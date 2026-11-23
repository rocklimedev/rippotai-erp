import { ARCHITECT_VISIT_STAGES } from './constants/architect-visit-stages.constant';
import { VisitStageService } from './visit-stage.service';

describe('visit stage master', () => {
  const standard = ARCHITECT_VISIT_STAGES.find(({ visit_no }) => visit_no === 1)!;

  const setup = () => {
    const saved = { id: 'stage', visit_no: 1, stage: 'Previous name', is_active: true };
    const row = { ...saved, toJSON: () => saved };
    const model = {
      findAll: jest.fn().mockResolvedValue([row, { visit_no: 20 }, { visit_no: 99 }]),
      findByPk: jest.fn().mockResolvedValue(row),
    };
    const service = new VisitStageService(
      model as unknown as ConstructorParameters<typeof VisitStageService>[0],
    );
    return { service, model, saved };
  };

  it('lists only allocatable schedule stages with canonical values and saved IDs', async () => {
    const { service, model, saved } = setup();
    expect(await service.findAll()).toEqual([{ ...saved, ...standard }]);
    expect(model.findAll).toHaveBeenCalledWith({
      where: { is_active: true },
      order: [['visit_no', 'ASC']],
    });
    await service.findAll(true);
    expect(model.findAll).toHaveBeenLastCalledWith({
      where: {},
      order: [['visit_no', 'ASC']],
    });
  });

  it('looks up schedule stages and rejects unavailable or missing stages', async () => {
    const { service, model, saved } = setup();
    await expect(service.findOne('stage')).resolves.toEqual({ ...saved, ...standard });
    model.findByPk.mockResolvedValueOnce({ visit_no: 20 });
    await expect(service.findOne('excluded')).rejects.toThrow(
      'Visit stage is unavailable for allocation',
    );
    model.findByPk.mockResolvedValueOnce(null);
    await expect(service.findOne('missing')).rejects.toThrow('Visit stage not found');
  });

  it('rejects changes to the fixed schedule', async () => {
    const { service } = setup();
    const message = 'Architect visit stages are fixed by the site visit schedule';
    await expect(service.create({
      visit_no: 99,
      stage: 'Custom stage',
      checks_purpose: 'Custom checks',
      visit_type: standard.visit_type,
    })).rejects.toThrow(message);
    await expect(service.update('stage', { stage: 'Updated' })).rejects.toThrow(message);
    await expect(service.deactivate('stage')).rejects.toThrow(message);
  });
});
