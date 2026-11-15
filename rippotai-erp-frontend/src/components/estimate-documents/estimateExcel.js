// Budget Estimate → Excel, rebuilt cell-for-cell on the original ESTIMATE TEMPLATE.xlsx: same
// column widths, row heights, merges, Arial sizes, thin borders, green header fill (#6AA84F),
// grey Grand Total cell, dd-mmm-yy date, logo anchor, A4 portrait fit-to-width print setup.
// Item rows grow past the template's 20 lines; formulas keep Amount = Rate × Quantity live.
import ExcelJS from "exceljs";
import { saveWorkbook } from "@/lib/brandExcel";
import estimateLogo from "../../assets/templates/estimate-logo.png";
import { ESTIMATE_MIN_ROWS, ESTIMATE_PAYMENT_ROWS } from "./estimateModel";

const THIN = { style: "thin", color: { argb: "FF000000" } };
const ALL = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const INK = "FF1F1F1F";
const font = (size, extra = {}) => ({ name: "Arial", size, color: { argb: "FF000000" }, ...extra });

export const estimateExcelFileName = (model) =>
  `Estimate_${String(model?.number || model?.project?.name || "draft").replace(/[^\w-]+/g, "-")}.xlsx`;

async function logoBuffer() {
  const res = await fetch(estimateLogo);
  return res.arrayBuffer();
}

/** Build the workbook (exported for tests / previews). */
export async function buildEstimateWorkbook(model) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "INOS";
  const ws = wb.addWorksheet("ESTIMATE TEMPLATE", {
    properties: { defaultRowHeight: 15 },
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.2566929133858268, right: 0.2566949506473399, top: 0.39370078740157477, bottom: 0, header: 0, footer: 0 },
    },
  });
  [37.63, 55.88, 12.63, 22.0, 19.38, 16.63].forEach((w, i) => (ws.getColumn(i + 1).width = w));

  const H = (r, h) => (ws.getRow(r).height = h);
  const set = (addr, value, style = {}) => {
    const c = ws.getCell(addr);
    if (value !== undefined) c.value = value;
    Object.assign(c, style);
    return c;
  };
  // Merged block: value + style on the master cell; LibreOffice/Excel draw a merged area's outline
  // from the master's border, Excel from the edge cells — so set both.
  const box = (range, value, style = {}, edges = { top: true, bottom: true, left: true, right: true }) => {
    ws.mergeCells(range);
    const [a, b] = range.split(":");
    const [c1, r1] = [a.charCodeAt(0), Number(a.slice(1))];
    const [c2, r2] = [b.charCodeAt(0), Number(b.slice(1))];
    for (let r = r1; r <= r2; r += 1)
      for (let c = c1; c <= c2; c += 1) {
        const cell = ws.getCell(`${String.fromCharCode(c)}${r}`);
        cell.border = {
          ...(r === r1 && edges.top ? { top: THIN } : {}),
          ...(r === r2 && edges.bottom ? { bottom: THIN } : {}),
          ...(c === c1 && edges.left ? { left: THIN } : {}),
          ...(c === c2 && edges.right ? { right: THIN } : {}),
        };
      }
    const master = ws.getCell(a);
    if (value !== undefined) master.value = value;
    Object.assign(master, style);
    master.border = Object.fromEntries(Object.entries(edges).filter(([, on]) => on).map(([k]) => [k, THIN]));
  };
  const allCells = (r, style) =>
    "ABCDEF".split("").forEach((col) => {
      const c = ws.getCell(`${col}${r}`);
      c.border = ALL;
      if (style) Object.assign(c, style);
    });

  // ---- rows 1–8: logo, Date, ESTIMATE
  H(1, 15.75);
  for (let r = 2; r <= 5; r += 1) H(r, 15.75);
  box("A2:D5", null, {}, { top: true, left: true });
  box("E2:F3", "Date", { font: font(16, { bold: true }), alignment: { horizontal: "center", vertical: "middle" } });
  const d = model.date ? new Date(model.date) : null;
  box("E4:F5", d && !Number.isNaN(d.getTime()) ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) : null, {
    font: font(16, { bold: true }),
    alignment: { horizontal: "center", vertical: "middle" },
    numFmt: "dd\\-mmm\\-yy",
  });
  H(6, 27);
  H(7, 15.75);
  H(8, 15.75);
  box("A6:F7", "ESTIMATE", { font: font(28, { bold: true, color: { argb: INK } }), alignment: { horizontal: "center", vertical: "middle" } }, { left: true, right: true });
  box(
    "A8:F8",
    [model.number, model.version ? `Version ${model.version}` : "", model.project.client ? `Client: ${model.project.client}` : ""].filter(Boolean).join(" · ") || null,
    { font: font(12, { color: { argb: INK } }), alignment: { horizontal: "center", vertical: "middle" } },
    { left: true, right: true },
  );

  try {
    const id = wb.addImage({ buffer: await logoBuffer(), extension: "png" });
    ws.addImage(id, {
      tl: { nativeCol: 0, nativeColOff: 381000, nativeRow: 1, nativeRowOff: 104775 },
      ext: { width: 97, height: 119 },
      editAs: "oneCell",
    });
  } catch {
    /* logo is decorative — keep the export working offline */
  }

  // ---- rows 9–12: vendor | project
  const vendor = [
    ["Vendor Name", model.vendor.name],
    ["Vendor Type", model.vendor.type],
    ["Phone Number", String(model.vendor.phone || "").replace(/^\+91\s*/, "").replace(/\s/g, "")],
    ["Address", model.vendor.address],
  ];
  vendor.forEach(([label, value], i) => {
    const r = 9 + i;
    H(r, 33.75);
    set(`A${r}`, label, { font: font(18, { color: { argb: INK } }), alignment: { horizontal: "center", vertical: "middle" }, border: ALL });
    set(`B${r}`, value || null, { font: font(17, { color: { argb: INK } }), alignment: { vertical: "middle", wrapText: true }, border: ALL });
  });
  const center20 = { font: font(20, { color: { argb: INK } }), alignment: { horizontal: "center", vertical: "middle", wrapText: true } };
  box("C9:D10", "Project Name", center20);
  box("E9:F10", model.project.name || null, center20);
  box("C11:D12", "Project Address", center20);
  box("E11:F12", model.project.address || null, center20);

  // ---- row 13 blank, row 14 header
  H(13, 15.75);
  allCells(13, { font: font(11) });
  H(14, 15.75);
  ["S.NO", "PARTICULAR", "RATE (₹)", "QUANTITY", "AMOUNT (₹)", "REMARKS"].forEach((t, i) =>
    set(`${"ABCDEF"[i]}14`, t, {
      font: font(16),
      alignment: { horizontal: "center", vertical: "middle" },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF6AA84F" } },
      border: ALL,
    }),
  );

  // ---- item rows (≥ 20, then one blank like the template's row 34)
  let r = 15;
  const first = r;
  const rows = [...model.rows];
  while (rows.length < ESTIMATE_MIN_ROWS - 1) rows.push(null);
  rows.push(null);
  rows.forEach((row) => {
    H(r, 22.5);
    allCells(r);
    set(`A${r}`, null, { font: font(15), alignment: { horizontal: "center" } });
    set(`B${r}`, null, { font: font(15), alignment: { wrapText: true } });
    set(`C${r}`, null, { font: font(15), numFmt: "#,##0" });
    set(`D${r}`, null, { font: font(17) });
    set(`E${r}`, null, { font: font(17), numFmt: "#,##0" });
    set(`F${r}`, null, { font: font(17), alignment: { horizontal: "left", wrapText: true } });
    if (row?.type === "category") {
      set(`B${r}`, row.name, { font: font(15, { bold: true }) });
    } else if (row) {
      set(`A${r}`, row.n);
      set(`B${r}`, row.detail ? `${row.particular}\n${row.detail}` : row.particular);
      set(`C${r}`, row.rate);
      set(`D${r}`, row.quantity, { numFmt: row.unit ? `#,##0.###" ${String(row.unit).replace(/"/g, "")}"` : "#,##0.###" });
      set(`E${r}`, row.rate !== null && row.quantity !== null ? { formula: `C${r}*D${r}`, result: row.amount } : row.amount);
      set(`F${r}`, row.remarks || null);
      const lines = Math.max(
        Math.ceil(String(row.particular || "").length / 46) + (row.detail ? Math.ceil(row.detail.length / 46) : 0),
        Math.ceil(String(row.remarks || "").length / 12),
      );
      if (lines > 1) H(r, Math.min(19 * lines, 120));
    }
    r += 1;
  });
  const last = r - 1;

  // ---- Subtotal … Grand Total
  const totalRow = (t, grand, formula) => {
    H(r, 20);
    allCells(r, { font: font(17) });
    ws.getCell(`F${r}`).font = { name: "Calibri", size: 17 };
    if (!grand && t.key !== "subtotal" && t.detail) set(`B${r}`, t.detail, { font: font(15) });
    if (t.key === "subtotal") set(`B${r}`, " ");
    set(`D${r}`, t.label, { font: font(17, { bold: true }), alignment: { horizontal: "center" } });
    set(`E${r}`, formula ? { formula, result: t.value } : t.value, {
      font: font(17, { bold: true }),
      alignment: { horizontal: "right" },
      numFmt: "#,##0",
      ...(grand ? { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } } } : {}),
    });
    r += 1;
  };
  const subRow = r;
  model.totals.forEach((t) => totalRow(t, false, t.key === "subtotal" ? `SUM(E${first}:E${last})` : null));
  totalRow({ label: "Grand Total", value: model.grandTotal }, true, `SUM(E${subRow}:E${r - 1})`);

  // ---- Payment Terms
  H(r, 15.75);
  box(`A${r}:F${r}`, "Payment Terms :", { font: font(17, { bold: true }), alignment: { horizontal: "left" } });
  r += 1;
  const payRow = (cells, bold) => {
    H(r, 24);
    set(`A${r}`, cells[0], { font: font(17, { bold }), alignment: { horizontal: "center", vertical: "middle" }, border: ALL });
    set(`B${r}`, cells[1], { font: font(17, { bold }), alignment: { horizontal: "center", vertical: "middle" }, border: ALL });
    box(`C${r}:D${r}`, cells[2], { font: font(17, { bold }), alignment: { horizontal: "center", vertical: "middle" } });
    box(`E${r}:F${r}`, cells[3], { font: font(17, { bold }), alignment: { horizontal: "center", vertical: "middle" } });
    r += 1;
  };
  payRow(["Stages", "Date", "Amount ", "Remarks"], true);
  const pays = [...model.payment];
  while (pays.length < ESTIMATE_PAYMENT_ROWS) pays.push(null);
  pays.forEach((p) => payRow(p ? [p.stage, p.date ? new Date(p.date) : null, p.amount, p.remarks] : [null, null, null, null], false));

  // ---- Terms & Conditions
  H(r, 15.75);
  box(`A${r}:F${r}`, "Terms & Conditions:", { font: font(16, { bold: true }) });
  r += 1;
  const termText = model.terms.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const termLines = model.terms.reduce((s, t) => s + Math.max(1, Math.ceil(t.length / 150)), 0);
  const termRows = Math.max(3, termLines);
  for (let i = 0; i < termRows; i += 1) H(r + i, 15.75);
  box(`A${r}:F${r + termRows - 1}`, termText, { font: font(10), alignment: { vertical: "top", wrapText: true } });
  r += termRows;

  // ---- signatures
  for (let i = 0; i < 7; i += 1) H(r + i, 15.75);
  const approved = model.approvedBy ? [model.approvedBy.name, model.approvedBy.date ? new Date(model.approvedBy.date).toLocaleDateString("en-GB") : ""].filter(Boolean).join(" · ") : null;
  box(`A${r}:B${r + 6}`, approved, { font: font(10), alignment: { vertical: "bottom" } });
  box(`C${r}:F${r + 6}`, [model.contractor.name, model.contractor.company].filter(Boolean).join(" · ") || null, { font: font(10), alignment: { vertical: "bottom" } });
  r += 7;
  H(r, 15.75);
  box(`A${r}:B${r}`, "APPROVED BY", { font: font(16, { bold: true }), alignment: { horizontal: "center" } });
  box(`C${r}:F${r}`, "CONTRACTOR'S SIGNATURE", { font: font(16, { bold: true }), alignment: { horizontal: "center" } });
  r += 1;
  for (let i = 0; i < 3; i += 1) H(r + i, 15.75);
  box(`A${r}:F${r + 2}`, null);
  ws.pageSetup.printArea = `A1:F${r + 2}`;
  return wb;
}

export async function downloadEstimateExcel(model) {
  const wb = await buildEstimateWorkbook(model);
  await saveWorkbook(wb, estimateExcelFileName(model));
}
