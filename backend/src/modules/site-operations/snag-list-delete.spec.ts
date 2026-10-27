import { NotFoundException } from '@nestjs/common';
import { SnagListService } from './snag-list.service';

describe('snag list deletion', () => {
  function setup() {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    const row = { destroy: jest.fn().mockResolvedValue(undefined) };
    const model = {
      findByPk: jest.fn().mockResolvedValue(row),
      sequelize: { transaction: jest.fn((callback) => callback(transaction)) },
    };
    const revisions = { destroy: jest.fn().mockResolvedValue(2) };
    const service = new SnagListService(model as any, revisions as any, {} as any, {} as any);
    return { service, model, row, revisions, transaction };
  }

  it('locks the list and deletes its revisions and document together', async () => {
    const { service, model, row, revisions, transaction } = setup();
    await expect(service.remove('list')).resolves.toEqual({ id: 'list', deleted: true });
    expect(model.findByPk).toHaveBeenCalledWith('list', { attributes: ['id'], transaction, lock: transaction.LOCK.UPDATE });
    expect(revisions.destroy).toHaveBeenCalledWith({ where: { snag_list_id: 'list' }, transaction });
    expect(row.destroy).toHaveBeenCalledWith({ transaction });
  });

  it('does not delete revisions for a missing list', async () => {
    const { service, model, revisions } = setup();
    model.findByPk.mockResolvedValue(null as any);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(revisions.destroy).not.toHaveBeenCalled();
  });

  it('propagates failures to roll back the transaction', async () => {
    const { service, row } = setup();
    row.destroy.mockRejectedValue(new Error('Delete failed'));
    await expect(service.remove('list')).rejects.toThrow('Delete failed');
  });
});
