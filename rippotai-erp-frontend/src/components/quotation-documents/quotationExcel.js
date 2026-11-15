// Procurement Quotation → the user's QUOTATION TEMPLATE.xlsx ("QUOTATION TEMPLATE" sheet), filled
// in place: logo, Date box, Vendor / Project block, the green S.NO … REMARKS table (rows 15–34,
// grows past 20 lines), Subtotal (+ GST rows) / Grand Total, Payment Terms (rows 39–42, grows),
// Terms & Conditions, APPROVED BY / CONTRACTOR'S SIGNATURE. Every style, merge, width, height and
// the print setup come from the template; Amount = Rate × Quantity and the totals stay formulas.
import { copyRowStyle, fillTable, insertRows, loadXlsxTemplate, wrappedHeight, writeXlsx } from "../../lib/xlsxTemplate.js";

const SHEET = "QUOTATION TEMPLATE";
const FIRST_ITEM = 15;
const ITEM_ROWS = 20; // 15–34
const SUBTOTAL = 35;
const PAY_FIRST = 39;
const PAY_ROWS = 4; // 39–42

const dateOnly = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};
const phone = (p) => String(p || "").replace(/^\+91\s*/, "").replace(/\s/g, "") || null;

/**
 * @param template URL (browser) or ArrayBuffer (tests) of QUOTATION TEMPLATE.xlsx
 * @param model    quotationSheetModel(quotation)
 */
export async function buildQuotationWorkbook(template, model) {
  const wb = await loadXlsxTemplate(template);
  wb.creator = "Rippotai Architecture";
  wb.title = `Quotation ${model.number || ""}`.trim();
  wb.calcProperties = { fullCalcOnLoad: true };
  for (const ws of [...wb.worksheets]) if (ws.name !== SHEET) wb.removeWorksheet(ws.id);
  const ws = wb.getWorksheet(SHEET);

  // ---- header + parties
  ws.getCell("E4").value = dateOnly(model.date);
  ws.getCell("B9").value = model.vendor.name || null;
  ws.getCell("B10").value = model.vendor.type || null;
  ws.getCell("B11").value = phone(model.vendor.phone);
  ws.getCell("B12").value = model.vendor.address || null;
  ws.getCell("E9").value = model.project.name || null;
  ws.getCell("E11").value = model.project.address || null;
  const sub8 = ws.getCell("A8");
  sub8.alignment = { horizontal: "center", vertical: "middle" };
  sub8.value =
    [model.number, model.version > 1 ? `Version ${model.version}` : "", model.project.client ? `Client: ${model.project.client}` : ""]
      .filter(Boolean)
      .join(" · ") || null;
  ["B9", "B10", "B11", "B12"].forEach((a) => {
    ws.getCell(a).alignment = { ...(ws.getCell(a).alignment || {}), vertical: "middle", wrapText: true };
  });

  // ---- items (category rows bold, like the estimate)
  const rows = model.rows;
  const end = fillTable(ws, {
    startRow: FIRST_ITEM,
    templateRows: ITEM_ROWS,
    rows: rows.map(() => [null, null, null, null, null, null]),
    lastCol: 6,
  });
  const lastItem = end - 1;
  rows.forEach((row, i) => {
    const r = FIRST_ITEM + i;
    if (row.type === "category") {
      const b = ws.getCell(`B${r}`);
      b.value = row.name;
      b.font = { ...(b.font || {}), bold: true };
      return;
    }
    ws.getCell(`A${r}`).value = row.n;
    ws.getCell(`A${r}`).alignment = { horizontal: "center", vertical: "top" };
    const b = ws.getCell(`B${r}`);
    b.value = row.detail ? `${row.particular}\n${row.detail}` : row.particular;
    b.alignment = { vertical: "top", wrapText: true };
    const c = ws.getCell(`C${r}`);
    c.value = row.rate;
    c.numFmt = "#,##0.##";
    c.alignment = { vertical: "top" };
    const d = ws.getCell(`D${r}`);
    d.value = row.quantity;
    d.numFmt = row.unit ? `#,##0.###" ${String(row.unit).replace(/"/g, "")}"` : "#,##0.###";
    d.alignment = { vertical: "top" };
    const e = ws.getCell(`E${r}`);
    e.value = row.quantity !== null ? { formula: `C${r}*D${r}`, result: row.amount } : { formula: `C${r}`, result: row.amount };
    e.numFmt = "#,##0.00";
    e.alignment = { vertical: "top" };
    const f = ws.getCell(`F${r}`);
    f.value = row.remarks || null;
    f.alignment = { vertical: "top", wrapText: true };
    // B is 55.9 chars of Arial 11 → ~40 chars at the template's 15 pt; F ~10 chars at 17 pt.
    ws.getRow(r).height = wrappedHeight([[b.value, 38], [f.value, 9]], { min: 22.5, line: 18.5, pad: 5 });
  });

  // A long quotation prints on several A4 pages (fit to width only), like the PDF.
  if (rows.length > ITEM_ROWS) {
    ws.pageSetup.fitToHeight = 0;
    ws.pageSetup.printTitlesRow = "14:14";
  }

  // ---- Subtotal, GST rows, Grand Total (row 35 / 36 move with the table)
  const shift = lastItem - (FIRST_ITEM + ITEM_ROWS - 1);
  const sub = SUBTOTAL + shift;
  const extra = model.totals.filter((t) => t.key !== "subtotal");
  if (extra.length) {
    insertRows(ws, sub + 1, extra.length);
    for (let k = 1; k <= extra.length; k++) copyRowStyle(ws, sub, sub + k, 6);
  }
  ws.getCell(`E${sub}`).value = { formula: `SUM(E${FIRST_ITEM}:E${lastItem})`, result: model.totals[0]?.value ?? 0 };
  extra.forEach((t, k) => {
    const r = sub + 1 + k;
    ws.getCell(`B${r}`).value = t.detail || null;
    ws.getCell(`D${r}`).value = t.label;
    ws.getCell(`E${r}`).value = t.value;
  });
  const grand = sub + extra.length + 1;
  ws.getCell(`E${grand}`).value = { formula: `SUM(E${sub}:E${grand - 1})`, result: model.grandTotal };
  for (let r = sub; r <= grand; r++) {
    const e = ws.getCell(`E${r}`);
    e.numFmt = "#,##0.00";
    e.font = { ...(e.font || {}), bold: true };
    e.alignment = { horizontal: "right" };
  }

  // ---- Payment Terms
  const shift2 = shift + extra.length;
  const payFirst = PAY_FIRST + shift2;
  const pays = model.payment;
  if (pays.length > PAY_ROWS) {
    const at = payFirst + PAY_ROWS - 1;
    insertRows(ws, at, pays.length - PAY_ROWS);
    for (let r = at; r < at + pays.length - PAY_ROWS; r++) {
      copyRowStyle(ws, payFirst, r, 6);
      ws.mergeCells(`C${r}:D${r}`);
      ws.mergeCells(`E${r}:F${r}`);
    }
  }
  pays.forEach((p, i) => {
    const r = payFirst + i;
    const center = { horizontal: "center", vertical: "middle", wrapText: true };
    ws.getCell(`A${r}`).value = p.stage || null;
    const date = dateOnly(p.date);
    ws.getCell(`B${r}`).value = date;
    if (date) ws.getCell(`B${r}`).numFmt = "dd\\-mmm\\-yy";
    ws.getCell(`C${r}`).value = p.amount !== undefined && p.amount !== null && p.amount !== "" ? Number(p.amount) : null;
    ws.getCell(`C${r}`).numFmt = "#,##0.00";
    ws.getCell(`E${r}`).value = p.remarks || null;
    ["A", "B", "C", "E"].forEach((col) => (ws.getCell(`${col}${r}`).alignment = center));
  });

  // ---- Terms & Conditions (merged A44:F46 block)
  const termsRow = 44 + shift2 + Math.max(0, pays.length - PAY_ROWS);
  const terms = ws.getCell(`A${termsRow}`);
  terms.value = model.terms.map((t, i) => `${i + 1}. ${t}`).join("\n");
  terms.alignment = { vertical: "top", wrapText: true };
  const lines = model.terms.reduce((s, t) => s + Math.max(1, Math.ceil(t.length / 150)), 0);
  if (lines > 3) for (let k = 0; k < 3; k++) ws.getRow(termsRow + k).height = Math.max(15.75, (lines * 13) / 3);

  // ---- signatures (A47:B53 / C47:F53)
  const sign = termsRow + 3;
  if (model.approvedBy) {
    const a = ws.getCell(`A${sign}`);
    a.value = [model.approvedBy.name, model.approvedBy.date ? new Date(model.approvedBy.date).toLocaleDateString("en-GB") : ""].filter(Boolean).join(" · ");
    a.alignment = { vertical: "bottom" };
  }
  return writeXlsx(wb);
}
