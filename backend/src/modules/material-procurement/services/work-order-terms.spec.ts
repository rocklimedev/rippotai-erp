import { WorkOrdersService } from './work-orders.service';
import { WorkOrderStatus } from '@/common/enums/work-order.enums';

describe('work order terms edits', () => {
  function setup() {
    const transaction = {};
    const workOrder = { id: 'order', status: WorkOrderStatus.DRAFT, subtotal: 100, discount: 0, gst_percentage: 0, cartage: 0, update: jest.fn() };
    const model = { findByPk: jest.fn().mockResolvedValue(workOrder), sequelize: { transaction: jest.fn((fn) => fn(transaction)) } };
    const terms = { destroy: jest.fn(), bulkCreate: jest.fn() };
    const templates = { findByPk: jest.fn().mockResolvedValue({ id: 'template', is_active: true, content_html: 'Template wording' }) };
    const service = new WorkOrdersService(model as any, {} as any, {} as any, terms as any, {} as any, {} as any, {} as any, templates as any);
    jest.spyOn(service, 'findOne').mockResolvedValue(workOrder as any);
    return { service, terms, workOrder, transaction };
  }

  it('persists edited wording with the order in one transaction', async () => {
    const { service, terms, transaction, workOrder } = setup();
    await service.update('order', { terms: [{ description: 'Revised payment clause' }] });
    expect(workOrder.update).toHaveBeenCalledWith(expect.anything(), { transaction });
    expect(terms.destroy).toHaveBeenCalledWith({ where: { work_order_id: 'order' }, transaction });
    expect(terms.bulkCreate).toHaveBeenCalledWith([expect.objectContaining({ description: 'Revised payment clause', terms_template_id: null })], { transaction });
  });

  it('adds the selected template once ahead of manual additions', async () => {
    const { service, terms, transaction } = setup();
    await service.update('order', { terms_template_id: 'template', terms: [{ description: 'Additional clause' }] });
    expect(terms.bulkCreate).toHaveBeenCalledWith([
      expect.objectContaining({ description: 'Template wording', sort_order: 1 }),
      expect.objectContaining({ description: 'Additional clause', sort_order: 2 }),
    ], { transaction });
  });

  it('allows clearing all terms and leaves them untouched when omitted', async () => {
    const { service, terms } = setup();
    await service.update('order', {});
    expect(terms.destroy).not.toHaveBeenCalled();
    await service.update('order', { terms: [] });
    expect(terms.destroy).toHaveBeenCalledTimes(1);
    expect(terms.bulkCreate).not.toHaveBeenCalled();
  });
});
