import { NotFoundException } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderStatus } from '../models/purchase-order.model';

describe('purchase order deletion', () => {
  function setup(status: PurchaseOrderStatus) {
    const transaction = {};
    const po = { status, destroy: jest.fn().mockResolvedValue(undefined) };
    const model = {
      findByPk: jest.fn().mockResolvedValue(po),
      sequelize: { transaction: jest.fn((callback) => callback(transaction)) },
    };
    const items = { destroy: jest.fn().mockResolvedValue(1) };
    const service = new PurchaseOrderService(model as any, items as any, {} as any);
    return { service, model, items, po, transaction };
  }

  it.each(Object.values(PurchaseOrderStatus))('deletes a %s order and its items in one transaction', async (status) => {
    const { service, items, po, transaction } = setup(status);
    await expect(service.delete('order')).resolves.toMatchObject({ success: true, id: 'order' });
    expect(items.destroy).toHaveBeenCalledWith({ where: { purchase_order_id: 'order' }, transaction });
    expect(po.destroy).toHaveBeenCalledWith({ transaction });
  });

  it('returns not found without deleting items when the order does not exist', async () => {
    const { service, model, items } = setup(PurchaseOrderStatus.DRAFT);
    model.findByPk.mockResolvedValue(null as any);
    await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(items.destroy).not.toHaveBeenCalled();
  });

  it('propagates deletion failures so the transaction rolls back', async () => {
    const { service, po } = setup(PurchaseOrderStatus.CANCELLED);
    po.destroy.mockRejectedValue(new Error('Delete failed'));
    await expect(service.delete('order')).rejects.toThrow('Delete failed');
  });
});
