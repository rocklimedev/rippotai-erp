import { BudgetEstimateService } from './budget-estimate.service';

describe('budget estimate recalculation', () => {
  it.each([false, true])('persists reconciled totals (transaction: %s)', async (withTransaction) => {
    const estimate = {
      design_amount: '100.00', execution_amount: '200.00', supervisor_amount: '50.00',
      additional_amount: '25.00', misc_percentage: '10.00', discount_amount: '15.00',
      tax_percentage: '18.00', update: jest.fn().mockResolvedValue(undefined),
    };
    const service = Object.create(BudgetEstimateService.prototype) as any;
    service.estimateModel = { findByPk: jest.fn().mockResolvedValue(estimate) };
    service.itemModel = { findAll: jest.fn().mockResolvedValue([
      { quantity: '10.00', rate: '100.00', amount: '0.00' },
      { quantity: 100, rate: 100, hidden: true },
    ]) };
    service.miscellaneousModel = { findAll: jest.fn().mockResolvedValue([{ value: '40.00' }]) };
    const transaction = withTransaction ? { id: 'transaction' } : undefined;
    const result = withTransaction
      ? await service.recalculateWithTransaction('estimate', transaction)
      : await service.recalculate('estimate');
    expect(result).toBe(estimate);
    expect(estimate.update).toHaveBeenCalledWith({
      subtotal: 1000, misc_amount: 140, tax_amount: 270, total_amount: 1770,
    }, { transaction });
    expect(service.itemModel.findAll).toHaveBeenCalledWith({
      where: { estimate_id: 'estimate' }, transaction,
    });
    expect(service.miscellaneousModel.findAll).toHaveBeenCalledWith({
      where: { estimate_id: 'estimate' }, transaction,
    });
  });
});
