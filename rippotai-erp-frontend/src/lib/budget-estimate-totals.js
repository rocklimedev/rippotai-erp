// Keep in step with the server's budget-estimate-totals.ts.
export const roundBudgetMoney = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const budgetItemAmount = (item) =>
  roundBudgetMoney(roundBudgetMoney(item.quantity) * roundBudgetMoney(item.rate));

export const budgetItemsSubtotal = (items = []) => roundBudgetMoney(
  items.filter((item) => !item.hidden).reduce((sum, item) => sum + budgetItemAmount(item), 0),
);

export function calculateBudgetEstimateTotals(estimate) {
  const subtotal = budgetItemsSubtotal((estimate.categories || []).flatMap((c) => c.items || []));
  const fees = roundBudgetMoney(['design_amount', 'execution_amount', 'supervisor_amount', 'additional_amount']
    .reduce((sum, key) => sum + roundBudgetMoney(estimate[key]), 0));
  const miscItemsTotal = roundBudgetMoney((estimate.miscellaneous || [])
    .reduce((sum, item) => sum + roundBudgetMoney(item.value), 0));
  const percentageMisc = roundBudgetMoney(subtotal * roundBudgetMoney(estimate.misc_percentage) / 100);
  const miscAmount = roundBudgetMoney(percentageMisc + miscItemsTotal);
  const beforeTax = roundBudgetMoney(subtotal + fees + miscAmount - roundBudgetMoney(estimate.discount_amount));
  const taxAmount = roundBudgetMoney(beforeTax * roundBudgetMoney(estimate.tax_percentage) / 100);
  return { subtotal, fees, miscItemsTotal, percentageMisc, miscAmount, beforeTax, taxAmount,
    total: roundBudgetMoney(beforeTax + taxAmount) };
}
