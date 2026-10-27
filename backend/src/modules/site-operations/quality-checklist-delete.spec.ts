import { NotFoundException } from '@nestjs/common';
import { QualityChecklistService } from './quality-checklist.service';

describe('quality checklist deletion', () => {
  function setup() {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    const row = { destroy: jest.fn().mockResolvedValue(undefined) };
    const model = { findByPk: jest.fn().mockResolvedValue(row) };
    const items = { destroy: jest.fn().mockResolvedValue(2) };
    const database = { transaction: jest.fn((callback) => callback(transaction)) };
    const service = new QualityChecklistService(model as any, items as any, {} as any, database as any, {} as any);
    return { service, model, row, items, transaction };
  }

  it('soft deletes the checklist and its checkpoints in one transaction', async () => {
    const { service, model, row, items, transaction } = setup();
    await service.deleteChecklist('checklist');
    expect(model.findByPk).toHaveBeenCalledWith('checklist', { transaction, lock: transaction.LOCK.UPDATE });
    expect(items.destroy).toHaveBeenCalledWith({ where: { checklist_id: 'checklist' }, transaction });
    expect(row.destroy).toHaveBeenCalledWith({ transaction });
  });

  it('does not delete items for a missing checklist', async () => {
    const { service, model, items } = setup();
    model.findByPk.mockResolvedValue(null as any);
    await expect(service.deleteChecklist('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(items.destroy).not.toHaveBeenCalled();
  });

  it('propagates failures to roll back the transaction', async () => {
    const { service, row } = setup();
    row.destroy.mockRejectedValue(new Error('Delete failed'));
    await expect(service.deleteChecklist('checklist')).rejects.toThrow('Delete failed');
  });
});
