// Estimate of ONE vendor from the vendor comparison sheet: every trade the vendor
// quoted in, finalised or not, with blank rates marked "Rate pending".
// Only bare imports here so it can also run under `node --test`.
import ExcelJS from "exceljs";
import { completeQuote, quoteAmount, quoteTotal } from "./vendorComparisonData.js";

const GREEN = "FF1F453B";
const WASH = "FFEEF3F0";
const LINE = "FFD8E0DA";
const MONEY = '"₹"#,##0.00';

/** The vendor's quotes across trades (same id, or same name for custom vendors). */
export function vendorEstimateTrades(trades, vendor) {
  const key = (v) => String(v?.name || "").trim().toLowerCase();
  return trades
    .map((trade) => {
      const quote =
        trade.vendors.find((v) => v.id === vendor.id) ||
        trade.vendors.find((v) => key(v) && key(v) === key(vendor));
      return quote ? { trade, quote, finalised: trade.finalised_vendor_id === quote.id } : null;
    })
    .filter(Boolean);
}

export async function buildVendorEstimateWorkbook({ title, projectName, vendor, trades, date = new Date() }) {
  const rows = vendorEstimateTrades(trades, vendor);
  const wb = new ExcelJS.Workbook();
  wb.creator = "Rippotai INOS";
  const ws = wb.addWorksheet("Estimate", {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  ws.columns = [
    { key: "no", width: 12 },
    { key: "desc", width: 48 },
    { key: "qty", width: 10 },
    { key: "rate", width: 16 },
    { key: "amount", width: 18 },
    { key: "note", width: 18 },
  ];
  const border = { bottom: { style: "thin", color: { argb: LINE } } };
  const font = (o = {}) => ({ name: "Calibri", size: 11, color: { argb: "FF222222" }, ...o });

  ws.mergeCells("A1:F1");
  Object.assign(ws.getCell("A1"), { value: "RIPPOTAI", font: font({ size: 16, bold: true, color: { argb: GREEN } }) });
  ws.mergeCells("A2:F2");
  Object.assign(ws.getCell("A2"), { value: "Vendor Estimate", font: font({ size: 13, bold: true }) });
  const info = [
    ["Vendor", vendor.name || "—"],
    ["Project", projectName || "—"],
    ["Comparison", title || "—"],
    ["Date", date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
  ];
  info.forEach(([k, v], i) => {
    const r = 4 + i;
    Object.assign(ws.getCell(r, 1), { value: k, font: font({ color: { argb: "FF6B7B7C" } }) });
    ws.mergeCells(r, 2, r, 6);
    Object.assign(ws.getCell(r, 2), { value: v, font: font({ bold: k === "Vendor" }) });
  });

  let r = 9;
  const head = ["S.No", "Description", "Qty", "Rate", "Amount", "Remark"];
  head.forEach((h, i) => {
    const c = ws.getCell(r, i + 1);
    c.value = h;
    c.font = font({ bold: true, color: { argb: "FFFFFFFF" } });
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    c.alignment = { vertical: "middle", horizontal: i >= 2 && i <= 4 ? "right" : "left" };
  });
  ws.getRow(r).height = 22;
  r += 1;

  const subtotalCells = [];
  rows.forEach(({ trade, quote, finalised }, t) => {
    ws.mergeCells(r, 1, r, 4);
    const sec = ws.getCell(r, 1);
    sec.value = `${t + 1}. ${trade.name}`;
    sec.font = font({ bold: true, color: { argb: GREEN } });
    const st = ws.getCell(r, 5);
    st.value = finalised ? "Finalised" : "Not finalised";
    st.font = font({ bold: true, color: { argb: finalised ? GREEN : "FF9A6A12" } });
    st.alignment = { horizontal: "right" };
    if (!completeQuote(quote)) {
      ws.getCell(r, 6).value = "Incomplete quote";
      ws.getCell(r, 6).font = font({ italic: true, color: { argb: "FF9A6A12" } });
    }
    for (let c = 1; c <= 6; c++) ws.getCell(r, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: WASH } };
    r += 1;
    const first = r;
    quote.items.forEach((item, i) => {
      const amount = quoteAmount(item);
      ws.getCell(r, 1).value = `${t + 1}.${i + 1}`;
      ws.getCell(r, 2).value = item.description;
      ws.getCell(r, 2).alignment = { wrapText: true, vertical: "top" };
      ws.getCell(r, 3).value = item.quantity ?? "LS";
      ws.getCell(r, 4).value = item.rate === null || item.rate === "" ? null : Number(item.rate);
      ws.getCell(r, 5).value = amount;
      ws.getCell(r, 6).value = amount === null ? "Rate pending" : null;
      [4, 5].forEach((c) => (ws.getCell(r, c).numFmt = MONEY));
      [3, 4, 5].forEach((c) => (ws.getCell(r, c).alignment = { horizontal: "right", vertical: "top" }));
      for (let c = 1; c <= 6; c++) {
        ws.getCell(r, c).border = border;
        if (!ws.getCell(r, c).font) ws.getCell(r, c).font = font();
      }
      if (amount === null) ws.getCell(r, 6).font = font({ italic: true, color: { argb: "FF9A6A12" } });
      r += 1;
    });
    ws.getCell(r, 4).value = "Subtotal";
    ws.getCell(r, 4).font = font({ bold: true });
    ws.getCell(r, 4).alignment = { horizontal: "right" };
    ws.getCell(r, 5).value = {
      formula: quote.items.length ? `SUM(E${first}:E${r - 1})` : "0",
      result: quoteTotal(quote),
    };
    ws.getCell(r, 5).numFmt = MONEY;
    ws.getCell(r, 5).font = font({ bold: true });
    subtotalCells.push(`E${r}`);
    r += 2;
  });

  ws.mergeCells(r, 1, r, 4);
  const tl = ws.getCell(r, 1);
  tl.value = "Total estimate";
  tl.font = font({ bold: true, size: 12, color: { argb: "FFFFFFFF" } });
  const tv = ws.getCell(r, 5);
  tv.value = {
    formula: subtotalCells.length ? subtotalCells.join("+") : "0",
    result: rows.reduce((s, x) => s + quoteTotal(x.quote), 0),
  };
  tv.numFmt = MONEY;
  tv.font = font({ bold: true, size: 12, color: { argb: "FFFFFFFF" } });
  for (let c = 1; c <= 6; c++) ws.getCell(r, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
  r += 2;
  const pending = rows.filter((x) => !completeQuote(x.quote)).length;
  ws.mergeCells(r, 1, r, 6);
  ws.getCell(r, 1).value =
    `${rows.length} trade${rows.length === 1 ? "" : "s"} · ${rows.filter((x) => x.finalised).length} finalised` +
    (pending ? ` · ${pending} with rates pending (excluded from totals)` : "");
  ws.getCell(r, 1).font = font({ italic: true, color: { argb: "FF6B7B7C" } });
  if (vendor.notes) {
    r += 1;
    ws.mergeCells(r, 1, r, 6);
    ws.getCell(r, 1).value = `Notes: ${vendor.notes}`;
    ws.getCell(r, 1).alignment = { wrapText: true };
  }
  return wb;
}
