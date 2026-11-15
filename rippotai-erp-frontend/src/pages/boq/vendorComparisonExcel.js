// BOQ vendor rate comparison → the user's VENDOR COMPARISON TEMPLATE.xlsx:
// "Comparison" summary (trade · finalised vendor · amount, total) + one trade sheet
// per BOQ category in the template's layout (BOQ block + vendor blocks of
// S.No / Description / Qty / Rate / Amount, totals, finalised-vendor dropdown,
// "★ LOWEST" flags). Formulas are the template's; cached results are written too.
import { COL, cloneSheet, copyRowStyle, deleteRows, insertRows, loadXlsxTemplate, wrappedHeight, writeXlsx } from "../../lib/xlsxTemplate.js";

const PROTOTYPE = "01 Site Prep & Demolition";
const FIRST_ITEM = 7;
const TEMPLATE_ITEMS = 15; // rows 7–21
const COMPARISON_FIRST = 6;
const COMPARISON_ROWS = 31; // rows 6–36
const clone = (v) => JSON.parse(JSON.stringify(v ?? {}));

const spaced = (text) =>
  String(text || "")
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .map((word) => [...word].join(" "))
    .join("   ");

const safeSheetName = (name, used) => {
  const base = String(name).replace(/[\\/*?:[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 31);
  let candidate = base;
  for (let i = 2; used.has(candidate.toLowerCase()); i++) candidate = `${base.slice(0, 26)} (${i})`;
  used.add(candidate.toLowerCase());
  return candidate;
};
const quote = (name) => `'${name.replace(/'/g, "''")}'`;

/** Column number of block `b` (0 = BOQ, 1.. = vendors): B, H, N, T, Z … */
const blockCol = (b) => 2 + b * 6;

/** Add a 4th (or later) vendor block by copying the last template block's look. */
function addBlock(ws, block, lastRow) {
  const src = blockCol(3) - 1; // spacer + block of vendor 3 (S..X)
  const dst = blockCol(block) - 1;
  for (let k = 0; k < 6; k++) {
    ws.getColumn(dst + k).width = ws.getColumn(src + k).width;
    ws.getColumn(dst + k).hidden = false;
    for (let r = 1; r <= lastRow; r++) {
      const cell = ws.getCell(r, dst + k);
      if (r > 1) cell.value = null;
      cell.style = clone(ws.getCell(r, src + k).style);
    }
  }
}

function writeTradeSheet(ws, { title, items, vendors, finalised = "" }) {
  const blocks = Math.max(3, vendors.length);
  const extra = Math.max(0, items.length - TEMPLATE_ITEMS);
  if (extra) {
    const at = FIRST_ITEM + TEMPLATE_ITEMS - 1;
    insertRows(ws, at, extra);
    for (let r = at; r < at + extra; r++) copyRowStyle(ws, FIRST_ITEM, r, 24);
  }
  const lastItem = FIRST_ITEM + Math.max(items.length, TEMPLATE_ITEMS) - 1;
  const [totalRow, labelRow, sumRow, flagRow] = [1, 2, 3, 4].map((k) => lastItem + k);

  // Hidden helper cells (vendor names / totals) sit two columns after the last block.
  const helper = blockCol(blocks) + 6; // Z for three vendors
  if (blocks > 3) {
    ["Z1", "Z5", "AA5", "AB5", "Z6", "AA6", "AB6"].forEach((a) => (ws.getCell(a).value = null));
    for (let b = 4; b <= blocks; b++) addBlock(ws, b, flagRow);
    ws.unMergeCells("B1:X1");
    ws.mergeCells(1, 2, 1, blockCol(blocks) + 4);
    for (let b = 4; b <= blocks; b++) {
      const c = blockCol(b);
      for (const r of [5, totalRow, labelRow, sumRow, flagRow]) ws.mergeCells(r, c, r, c + 4);
      for (const ref of [`${COL(c)}5:${COL(c + 4)}5`, `${COL(c)}${totalRow}:${COL(c + 4)}${sumRow}`])
        ws.conditionalFormattings.push({
          ref,
          rules: [
            {
              ...clone(ws.conditionalFormattings[0].rules[0]),
              formulae: [`AND($D$3<>"",$D$3=$${COL(c)}$5)`],
            },
          ],
        });
    }
    // Move the "back" link over the last block.
    ws.unMergeCells("T3:X3");
    ws.getCell("T3").value = null;
    ws.mergeCells(3, blockCol(blocks), 3, blockCol(blocks) + 4);
    ws.getCell(3, blockCol(blocks)).style = clone(ws.getCell("T3").style);
  }
  for (let b = 0; b < blocks; b++) {
    const c = helper + b;
    ws.getColumn(c).hidden = true;
    ws.getColumn(c).width = 13;
  }
  const helperRange = (row) => `$${COL(helper)}$${row}:$${COL(helper + blocks - 1)}$${row}`;

  ws.getCell("B1").value = spaced(title);
  ws.getCell("D3").dataValidation = { type: "list", allowBlank: true, formulae: [helperRange(5)] };
  const back = blocks > 3 ? ws.getCell(3, blockCol(blocks)) : ws.getCell("T3");
  back.value = { text: "← Back to Comparison", hyperlink: "#'Comparison'!A1" };

  const totals = [];
  for (let b = 0; b <= blocks; b++) {
    const c = blockCol(b);
    const [sno, desc, qty, rate, amount] = [0, 1, 2, 3, 4].map((k) => COL(c + k));
    let sum = 0;
    for (let r = FIRST_ITEM; r <= lastItem; r++) {
      const item = items[r - FIRST_ITEM];
      const value = item ? (b === 0 ? item.boqRate : item.rates[b - 1]) : null;
      const hasRate = value !== null && value !== undefined && value !== "" && Number(value) > 0;
      const amt = item && hasRate ? (item.qty ? item.qty * Number(value) : Number(value)) : null;
      if (amt) sum += amt;
      ws.getCell(`${sno}${r}`).value = { formula: `IF(${desc}${r}="","",ROW()-6)`, result: item ? r - 6 : "" };
      ws.getCell(`${desc}${r}`).value = item ? item.description : null;
      ws.getCell(`${qty}${r}`).value = item && item.qty ? item.qty : null;
      ws.getCell(`${rate}${r}`).value = hasRate ? Number(value) : null;
      ws.getCell(`${amount}${r}`).value = {
        formula: `IF(${rate}${r}="","",IF(${qty}${r}="",${rate}${r},${qty}${r}*${rate}${r}))`,
        result: amt ?? "",
      };
    }
    totals.push(sum);
    ws.getCell(`${sno}${sumRow}`).value = { formula: `SUM(${amount}${FIRST_ITEM}:${amount}${lastItem})`, result: sum };
    if (b === 0) continue;
    const name = vendors[b - 1] || `Vendor ${b}`;
    ws.getCell(`${sno}5`).value = name;
    ws.getCell(`${sno}${labelRow}`).value = { formula: `"("&${sno}5&")"`, result: `(${name})` };
    ws.getCell(`${COL(helper + b - 1)}5`).value = { formula: `${sno}5`, result: name };
    ws.getCell(`${COL(helper + b - 1)}6`).value = { formula: `${sno}${sumRow}`, result: sum };
  }
  const vendorTotals = totals.slice(1);
  const lowest = Math.min(...vendorTotals.filter((t) => t > 0));
  for (let b = 1; b <= blocks; b++) {
    const sno = COL(blockCol(b));
    ws.getCell(`${sno}${flagRow}`).value = {
      formula: `TRIM(IF(AND($D$3<>"",$D$3=${sno}5),"✓ FINALISED     ","")&IF(AND(${sno}${sumRow}>0,${sno}${sumRow}=_xlfn.MINIFS(${helperRange(6)},${helperRange(6)},">0")),"★ LOWEST",""))`,
      result: vendorTotals[b - 1] > 0 && vendorTotals[b - 1] === lowest ? "★ LOWEST" : "",
    };
  }
  const chain = Array.from({ length: blocks }, (_, k) => COL(blockCol(k + 1))).reduceRight(
    (rest, c) => `IF(D3=${c}5,${c}${sumRow},${rest})`,
    `"Name mismatch"`,
  );
  // Finalised vendor (stored in INOS) fills the template's dropdown cell.
  const finalIndex = finalised ? vendors.indexOf(finalised) : -1;
  if (finalIndex >= 0) ws.getCell("D3").value = finalised;
  ws.getCell("J3").value = { formula: `IF(D3="","",${chain})`, result: finalIndex >= 0 ? vendorTotals[finalIndex] : "" };
  for (let b = 1; b <= blocks && finalIndex >= 0; b++) {
    const flag = ws.getCell(`${COL(blockCol(b))}${flagRow}`);
    if (b - 1 === finalIndex) flag.value = { ...flag.value, result: `✓ FINALISED ${flag.value.result || ""}`.trim() };
  }
  items.forEach((item, i) => {
    ws.getRow(FIRST_ITEM + i).height = wrappedHeight([[item.description, 26]], { min: 30, line: 12.5, pad: 6 });
  });
  return finalIndex >= 0 ? { vendor: finalised, total: vendorTotals[finalIndex] } : null;
}

/**
 * @param data {{ projectName, clientName, title, notes, vendors: string[],
 *   categories: Array<{ name, items: Array<{ description, qty, boqRate, rates: number[] }> }> }}
 */
export async function buildVendorComparisonWorkbook(template, data) {
  const workbook = await loadXlsxTemplate(template);
  workbook.creator = "Rippotai Architecture";
  workbook.title = data.title || "Vendor Comparison";
  workbook.calcProperties = { fullCalcOnLoad: true };
  const summary = workbook.getWorksheet("Comparison");
  const proto = workbook.getWorksheet(PROTOTYPE);
  for (const ws of [...workbook.worksheets])
    if (ws.id !== summary.id && ws.id !== proto.id) workbook.removeWorksheet(ws.id);

  const categories = data.categories.length ? data.categories : [{ name: "General", items: [] }];
  const used = new Set(["comparison"]);
  const names = categories.map((c, i) => safeSheetName(`${String(i + 1).padStart(2, "0")} ${c.name}`, used));
  const sheets = names.map((name, i) => (i === 0 ? proto : cloneSheet(workbook, proto, `trade-${i}`)));
  sheets.forEach((ws, i) => {
    ws.name = names[i];
    categories[i].result = writeTradeSheet(ws, {
      title: categories[i].name,
      items: categories[i].items,
      vendors: data.vendors,
      finalised: categories[i].finalised,
    });
  });

  // Summary sheet rows grow / shrink to the number of trades.
  const n = categories.length;
  if (n > COMPARISON_ROWS) insertRows(summary, COMPARISON_FIRST + COMPARISON_ROWS - 1, n - COMPARISON_ROWS);
  if (n < COMPARISON_ROWS) deleteRows(summary, COMPARISON_FIRST + n, COMPARISON_ROWS - n);
  const last = COMPARISON_FIRST + n - 1;
  summary.getCell("C2").value = data.projectName || null;
  summary.getCell("E2").value = data.clientName || null;
  categories.forEach((category, i) => {
    const r = COMPARISON_FIRST + i;
    const ref = quote(names[i]);
    summary.getCell(`B${r}`).value = i + 1;
    summary.getCell(`C${r}`).value = { text: category.name, hyperlink: `#${ref}!A1` };
    const picked = category.result;
    summary.getCell(`D${r}`).value = { formula: `IF(${ref}!D3="","Pending",${ref}!D3)`, result: picked ? picked.vendor : "Pending" };
    summary.getCell(`E${r}`).value = { formula: `IF(ISNUMBER(${ref}!J3),${ref}!J3,0)`, result: picked ? picked.total : 0 };
  });
  const picked = categories.filter((c) => c.result);
  summary.getCell(`B${last + 3}`).value = {
    formula: `SUM(E${COMPARISON_FIRST}:E${last})`,
    result: picked.reduce((sum, c) => sum + c.result.total, 0),
  };
  summary.getCell(`B${last + 4}`).value = {
    formula: `COUNTIF(D${COMPARISON_FIRST}:D${last},"Pending")&" trade(s) pending selection"`,
    result: `${n - picked.length} trade(s) pending selection`,
  };
  if (data.notes) {
    // INOS comparison notes (not in the template) under the footnote, same style.
    const r = last + 6;
    summary.mergeCells(r, 2, r, 5);
    const cell = summary.getCell(r, 2);
    cell.value = `Notes: ${data.notes}`;
    cell.style = { ...clone(summary.getCell(last + 4, 2).style), alignment: { horizontal: "left", vertical: "top", wrapText: true } };
    summary.getRow(r).height = wrappedHeight([[cell.value, 70]], { line: 12 });
  }
  return writeXlsx(workbook);
}
