import { NotFoundException } from '@nestjs/common';
import { MaterialProcurementService } from './material-procurement.service';
import { MaterialProcurementStatus } from '../models/material-procurement.model';

describe('material procurement deletion', () => {
  function setup(status: MaterialProcurementStatus) {
    const transaction = {};
    const procurement = { status, destroy: jest.fn().mockResolvedValue(undefined) };
    const model = { findByPk: jest.fn().mockResolvedValue(procurement) };
    const items = { destroy: jest.fn().mockResolvedValue(1) };
    const sequelize = { transaction: jest.fn((callback) => callback(transaction)) };
    const service = new MaterialProcurementService(model as any, items as any, sequelize as any);
    return { service, model, items, procurement, transaction };
  }

  it.each(Object.values(MaterialProcurementStatus))('deletes a %s sheet and its items together', async (status) => {
    const { service, items, procurement, transaction } = setup(status);
    await expect(service.remove('sheet')).resolves.toMatchObject({ success: true });
    expect(items.destroy).toHaveBeenCalledWith({ where: { procurementId: 'sheet' }, transaction });
    expect(procurement.destroy).toHaveBeenCalledWith({ transaction });
  });

  it('does not delete items when the sheet is missing', async () => {
    const { service, model, items } = setup(MaterialProcurementStatus.DRAFT);
    model.findByPk.mockResolvedValue(null as any);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(items.destroy).not.toHaveBeenCalled();
  });

  it('propagates failures to roll back the transaction', async () => {
    const { service, procurement } = setup(MaterialProcurementStatus.CANCELLED);
    procurement.destroy.mockRejectedValue(new Error('Delete failed'));
    await expect(service.remove('sheet')).rejects.toThrow('Delete failed');
  });
});
