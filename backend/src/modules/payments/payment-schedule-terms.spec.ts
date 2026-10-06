import { PaymentSchedulesService } from './payment-schedule.service';

describe('payment schedule terms versions', () => {
  function setup() {
    const schedule: any = {
      termsVersion: 1,
      termsTemplate: {
        content_html: 'Latest',
        $get: jest.fn().mockResolvedValue([{ content_html: 'Original' }]),
      },
      setDataValue: jest.fn(),
    };
    const model = {
      findByPk: jest.fn().mockResolvedValue(schedule),
      findAll: jest.fn().mockResolvedValue([schedule]),
    };
    const service = new PaymentSchedulesService(
      model as any,
      {} as any,
      {} as any,
    );
    return { service, schedule };
  }

  it('renders the saved version in detail and list responses', async () => {
    const { service, schedule } = setup();
    expect(await service.findOne('schedule')).toBe(schedule);
    expect(schedule.termsTemplate.$get).toHaveBeenCalledWith('versions', {
      where: { version: 1 },
    });
    expect(schedule.setDataValue).toHaveBeenCalledWith(
      'terms_content_snapshot',
      'Original',
    );
    expect(await service.findAll()).toEqual([schedule]);
    expect(schedule.setDataValue).toHaveBeenCalledTimes(2);
  });

  it('reports missing historical wording instead of silently using latest wording', async () => {
    const { service, schedule } = setup();
    schedule.termsTemplate.$get.mockResolvedValue([]);
    await expect(service.findOne('schedule')).rejects.toThrow(
      'saved terms version is unavailable',
    );
    expect(schedule.setDataValue).not.toHaveBeenCalled();
  });
});
