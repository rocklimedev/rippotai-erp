// Budget Estimate → the rows of the original ESTIMATE TEMPLATE (ESTIMATE TEMPLATE.xlsx / .pdf).
// Shared by the A4 PDF (EstimateSheetDocument.jsx) and the Excel export (estimateExcel.js) so
// both always carry the same figures.
import { htmlToTerms } from "../print-document";
import { roundBudgetMoney, budgetItemAmount } from "@/lib/budget-estimate-totals";

const has = (v) => v !== null && v !== undefined && String(v).trim() !== "";
const num = (v) => Number(v || 0);
const itemAmount = (item) =>
  item?.amount !== null && item?.amount !== undefined ? num(item.amount) : budgetItemAmount(item);
const pct = (v) => `${num(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;

/** Template default clause (printed when the estimate has no terms of its own). */
export const ESTIMATE_DEFAULT_TERMS = ["Final payment will be made after satisfactory completion of work."];
export const ESTIMATE_MIN_ROWS = 20;
export const ESTIMATE_PAYMENT_ROWS = 4;

/**
 * company: Rippotai profile (the contractor issuing the estimate → the template's "Vendor" block).
 * Returns { date, vendor, project, rows, totals, grandTotal, payment, terms, approvedBy, contractor }.
 */
export function estimateSheetModel(estimate, termsHtml, company = {}) {
  const project = estimate.project || {};
  const categories = [...(estimate.categories || [])]
    .sort((a, b) => num(a.sort_order) - num(b.sort_order))
    .map((c) => ({
      ...c,
      items: [...(c.items || [])].filter((i) => !i.hidden).sort((a, b) => num(a.sort_order) - num(b.sort_order)),
    }))
    .filter((c) => c.items.length);

  const rows = [];
  let n = 0;
  categories.forEach((c) => {
    if (categories.length > 1 || has(c.name)) rows.push({ type: "category", name: c.name });
    c.items.forEach((i) => {
      n += 1;
      rows.push({
        type: "item",
        n,
        particular: i.name || i.title || i.libraryItem?.name || "Item",
        detail: [i.detail].filter(has).join(" · "),
        rate: has(i.rate) ? num(i.rate) : null,
        quantity: has(i.quantity) ? num(i.quantity) : null,
        unit: i.unit || i.unitRef?.code || i.libraryItem?.unit || "",
        amount: itemAmount(i),
        remarks: [i.location && `Location: ${i.location}`, i.notes].filter(has).join(" · "),
      });
    });
  });

  const itemsTotal = rows.reduce((s, r) => s + (r.type === "item" ? r.amount : 0), 0);
  const subtotal = num(estimate.subtotal) || itemsTotal;
  const misc = [...(estimate.miscellaneous || [])].filter((m) => num(m.value) > 0);
  const miscTotal = roundBudgetMoney(misc.reduce((s, m) => s + num(m.value), 0));
  const percentageMisc = roundBudgetMoney(num(estimate.misc_amount) - miscTotal);
  const additional = num(estimate.additional_amount);
  const totals = [
    { label: "Subtotal", value: subtotal, key: "subtotal" },
    percentageMisc > 0 && { label: `Misc. ${pct(estimate.misc_percentage)}`, detail: "Miscellaneous on items", value: percentageMisc },
    ...misc.map((m) => ({ label: "Misc.", detail: [m.name, m.notes].filter(has).join(" · "), value: num(m.value) })),
    additional > 0 && Math.abs(additional - miscTotal) > 0.5 && { label: "Additional", detail: "Additional amount", value: additional },
    num(estimate.design_amount) > 0 && { label: "Design fee", detail: "Design fee", value: num(estimate.design_amount) },
    num(estimate.execution_amount) > 0 && { label: "Execution", detail: "Execution fee", value: num(estimate.execution_amount) },
    num(estimate.supervisor_amount) > 0 && { label: "Supervision", detail: "Site supervision", value: num(estimate.supervisor_amount) },
    num(estimate.discount_amount) > 0 && { label: "Discount", detail: "Discount", value: -num(estimate.discount_amount) },
    num(estimate.tax_amount) > 0 && { label: `GST ${pct(estimate.tax_percentage)}`, detail: "GST", value: num(estimate.tax_amount) },
  ].filter(Boolean);

  const terms = htmlToTerms(termsHtml)
    .map((t) => [t.title, t.body].filter(has).join(" — "))
    .filter(has);

  return {
    date: estimate.estimate_date || estimate.created_at,
    number: estimate.estimate_number,
    version: estimate.version || 1,
    vendor: {
      name: company.name,
      type: "Architecture · Interiors · Turnkey",
      phone: company.phone,
      address: company.address,
    },
    project: {
      name: project.name || String(estimate.title || "").replace(/^Budget Estimate\s*-\s*/i, ""),
      client: estimate.client_name,
      address: estimate.location || project.site_location,
    },
    rows,
    totals,
    grandTotal: num(estimate.total_amount),
    payment: [],
    terms: terms.length ? terms : ESTIMATE_DEFAULT_TERMS,
    approvedBy: estimate.approved_at
      ? { name: estimate.approver?.name || "", date: estimate.approved_at }
      : null,
    contractor: { name: estimate.prepared_by || "", company: company.name },
  };
}
