import { VisitStageService } from './visit-stage.service';

describe('visit stage master', () => {
  const setup = () => {
    const row = { id: 'stage', visit_no: 99, stage: 'Custom stage', is_active: true, toJSON: jest.fn(() => ({ id: 'stage', visit_no: 99, stage: 'Custom stage' })), update: jest.fn().mockResolvedValue({}) };
    const model: any = { findAll: jest.fn().mockResolvedValue([row]), findByPk: jest.fn().mockResolvedValue(row), create: jest.fn().mockResolvedValue(row) };
    return { service: new VisitStageService(model), model, row };
  };
  it('returns saved custom stages without seed overrides', async () => {
    const { service, model } = setup();
    expect(await service.findAll()).toEqual([{ id: 'stage', visit_no: 99, stage: 'Custom stage' }]);
    expect(model.findAll).toHaveBeenCalledWith({ where: { is_active: true }, order: [['visit_no', 'ASC']] });
    await service.findAll(true);
    expect(model.findAll).toHaveBeenLastCalledWith({ where: {}, order: [['visit_no', 'ASC']] });
  });
  it('updates master values and soft deletes without removing references', async () => {
    const { service, row } = setup();
    await service.update('stage', { stage: ' Updated ' });
    expect(row.update).toHaveBeenCalledWith({ stage: 'Updated' });
    await service.deactivate('stage');
    expect(row.update).toHaveBeenLastCalledWith({ is_active: false });
  });
  it('rejects blank names and missing stages', async () => {
    const { service, model } = setup();
    await expect(service.update('stage', { stage: ' ' })).rejects.toThrow('stage is required');
    model.findByPk.mockResolvedValue(null);
    await expect(service.deactivate('missing')).rejects.toThrow('Visit stage not found');
  });
});
