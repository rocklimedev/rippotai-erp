import { calculateBudgetEstimateTotals, budgetItemAmount } from './budget-estimate-totals';

describe('budget estimate totals', () => {
  it('includes each component once and applies discount before tax', () => {
    expect(calculateBudgetEstimateTotals({
      categories: [{ items: [{ quantity: '10', rate: '100' }, { quantity: 100, rate: 100, hidden: true }] }],
      design_amount: 100, execution_amount: 200, supervisor_amount: 50, additional_amount: 25,
      miscellaneous: [{ value: '40' }], misc_percentage: 10, discount_amount: 15, tax_percentage: 18,
    })).toEqual({ subtotal: 1000, fees: 375, miscItemsTotal: 40, percentageMisc: 100,
      miscAmount: 140, beforeTax: 1500, taxAmount: 270, total: 1770 });
  });

  it('sums rounded line amounts and rounds taxes to paise', () => {
    const item = { quantity: 0.33, rate: 0.33 };
    expect(budgetItemAmount(item)).toBe(0.11);
    expect(calculateBudgetEstimateTotals({ categories: [{ items: [item, item, item] }], tax_percentage: 18 }))
      .toMatchObject({ subtotal: 0.33, taxAmount: 0.06, total: 0.39 });
  });

  it('normalizes quantity and rate before calculating the stored line amount', () => {
    expect(budgetItemAmount({ quantity: 1.005, rate: 100 })).toBe(101);
  });
});
