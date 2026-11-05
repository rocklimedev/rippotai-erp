import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBudgetEstimateTotals, budgetItemAmount } from './budget-estimate-totals.js';

test('includes category items, fees and one-off charges; discounts before tax', () => {
  const totals = calculateBudgetEstimateTotals({
    categories: [{ items: [{ quantity: '10', rate: '100' }, { quantity: 100, rate: 100, hidden: true }] }],
    design_amount: 100, execution_amount: 200, supervisor_amount: 50, additional_amount: 25,
    miscellaneous: [{ value: '40' }], misc_percentage: 10, discount_amount: 15, tax_percentage: 18,
  });
  assert.deepEqual(totals, { subtotal: 1000, fees: 375, miscItemsTotal: 40, percentageMisc: 100,
    miscAmount: 140, beforeTax: 1500, taxAmount: 270, total: 1770 });
});

test('category-only estimates update the total and ignore stale amount fields', () => {
  const estimate = { categories: [{ items: [{ quantity: 3, rate: 200, amount: 0 }] }] };
  assert.equal(calculateBudgetEstimateTotals(estimate).total, 600);
  estimate.categories[0].items[0].quantity = 4;
  assert.equal(calculateBudgetEstimateTotals(estimate).total, 800);
});

test('fees-only estimates follow the same misc percentage basis as the server', () => {
  const result = calculateBudgetEstimateTotals({ design_amount: 1000, misc_percentage: 10, tax_percentage: 18 });
  assert.equal(result.miscAmount, 0);
  assert.equal(result.total, 1180);
});

test('one-off charges are counted once even without an additional amount', () => {
  const result = calculateBudgetEstimateTotals({ miscellaneous: [{ value: 100 }], tax_percentage: 18 });
  assert.equal(result.miscAmount, 100);
  assert.equal(result.total, 118);
});

test('rounds line amounts before summing so displayed rows reconcile', () => {
  const item = { quantity: 0.33, rate: 0.33 };
  assert.equal(budgetItemAmount(item), 0.11);
  const result = calculateBudgetEstimateTotals({ categories: [{ items: [item, item, item] }], tax_percentage: 18 });
  assert.equal(result.subtotal, 0.33);
  assert.equal(result.taxAmount, 0.06);
  assert.equal(result.total, 0.39);
});

test('rounds quantity and rate to the database precision before multiplication', () => {
  assert.equal(budgetItemAmount({ quantity: 1.005, rate: 100 }), 101);
});

test('empty optional fields produce a zero estimate', () => {
  assert.equal(calculateBudgetEstimateTotals({}).total, 0);
});
