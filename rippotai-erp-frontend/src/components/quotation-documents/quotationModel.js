// Procurement Quotation → the rows of the original QUOTATION TEMPLATE (QUOTATION TEMPLATE.pdf /
// .xlsx). The template is the ESTIMATE sheet with the title QUOTATION, so the PDF reuses the
// estimate sheet renderer (EstimateSheetDocument) and the Excel fills QUOTATION TEMPLATE.xlsx.
const has = (v) => v !== null && v !== undefined && String(v).trim() !== "";
const num = (v) => Number(v || 0);
const pct = (v) => `${num(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;

/** Template default clause (Terms & Conditions, clause 1). */
export const QUOTATION_DEFAULT_TERMS = ["Final payment will be made after satisfactory completion of work."];

export const lineAmount = (l) => {
  const q = num(l.quantity);
  return Math.round((q > 0 ? q * num(l.rate) : num(l.rate)) * 100) / 100;
};
export const lineTax = (l) => Math.round(((lineAmount(l) * num(l.tax_percent)) / 100) * 100) / 100;

/** Subtotal, GST grouped by rate, grand total — same arithmetic as the backend. */
export function quotationTotals(items = []) {
  const subtotal = items.reduce((s, l) => s + lineAmount(l), 0);
  const byRate = new Map();
  items.forEach((l) => {
    const t = lineTax(l);
    if (t > 0) byRate.set(num(l.tax_percent), (byRate.get(num(l.tax_percent)) || 0) + t);
  });
  const taxes = [...byRate.entries()].sort((a, b) => a[0] - b[0]).map(([rate, value]) => ({ rate, value }));
  const tax = taxes.reduce((s, t) => s + t.value, 0);
  return { subtotal, taxes, tax, total: subtotal + tax };
}

export const termsOf = (text) =>
  String(text || "")
    .split(/\n+/)
    .map((t) => t.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);

export function quotationSheetModel(q) {
  const items = [...(q.items || [])].sort((a, b) => num(a.sort_order) - num(b.sort_order));
  const categories = [...new Set(items.map((i) => i.category_name || ""))];
  const showCategories = categories.length > 1 || (categories.length === 1 && has(categories[0]));
  const rows = [];
  let current = null;
  items.forEach((i, idx) => {
    if (showCategories && (i.category_name || "") !== current) {
      current = i.category_name || "";
      if (has(current)) rows.push({ type: "category", name: current });
    }
    rows.push({
      type: "item",
      n: idx + 1,
      particular: i.item_name,
      detail: has(i.description) ? i.description : "",
      rate: num(i.rate),
      quantity: num(i.quantity) > 0 ? num(i.quantity) : null,
      unit: i.unit || "",
      amount: lineAmount(i),
      remarks: i.remarks || "",
    });
  });
  const t = quotationTotals(items);
  const terms = termsOf(q.terms);
  return {
    title: "QUOTATION",
    date: q.quotation_date || q.created_at,
    number: q.quotation_number,
    version: q.version || 1,
    vendor: {
      name: q.vendor_name || q.vendor?.company_name || q.vendor?.name,
      type: q.vendor_type,
      phone: q.vendor_phone,
      address: q.vendor_address,
    },
    project: {
      name: q.project_name || q.project?.name,
      client: q.client_name,
      address: q.project_address || q.project?.site_location,
    },
    rows,
    totals: [
      { label: "Subtotal", value: t.subtotal, key: "subtotal" },
      ...t.taxes.map((x) => ({ label: `GST ${pct(x.rate)}`, detail: "GST", value: x.value, key: `gst-${x.rate}` })),
    ],
    grandTotal: t.total,
    payment: (q.payment_terms || []).filter((p) => has(p?.stage)).map((p) => ({ stage: p.stage, date: p.date, amount: p.amount, remarks: p.remarks })),
    terms: terms.length ? terms : QUOTATION_DEFAULT_TERMS,
    approvedBy: q.approved_at ? { name: q.approver?.name || "", date: q.approved_at } : null,
    contractor: { name: "", company: "" },
  };
}

export const quotationFileName = (q, ext) =>
  `Quotation_${String(q?.quotation_number || "draft").replace(/[^\w-]+/g, "-")}${q?.version > 1 ? `_v${q.version}` : ""}.${ext}`;
