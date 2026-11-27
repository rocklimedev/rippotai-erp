// Fill the supplied workbook, removing only the BOQ table from trade sheets.
import {
  COL,
  cloneSheet,
  copyRowStyle,
  deleteRows,
  insertRows,
  loadXlsxTemplate,
  wrappedHeight,
  writeXlsx,
} from "../../lib/xlsxTemplate.js";
import {
  completeQuote,
  quoteAmount,
  quoteTotal,
} from "./vendorComparisonData.js";
const clone = (v) => JSON.parse(JSON.stringify(v ?? {}));
const quote = (v) => `'${v.replace(/'/g, "''")}'`;
const spaced = (v) =>
  String(v)
    .toUpperCase()
    .split(/\s+/)
    .map((word) => [...word].join(" "))
    .join("   ");
const safeName = (name, used) => {
  const base =
    String(name)
      .replace(/[\\/*?:[\]]/g, " ")
      .trim()
      .slice(0, 31) || "Trade";
  let next = base;
  for (let i = 2; used.has(next.toLowerCase()); i++)
    next = `${base.slice(0, 25)} (${i})`;
  used.add(next.toLowerCase());
  return next;
};

function tradeSheet(ws, source, trade) {
  const originalLast = source.rowCount - 4;
  const last = Math.max(
    originalLast,
    6 + Math.max(0, ...trade.vendors.map((v) => v.items.length)),
  );
  const vendors = new Map(
    trade.vendors.map((vendor, index) => [vendor.slot ?? index, vendor]),
  );
  const blocks = Math.max(3, ...Array.from(vendors.keys(), (slot) => Number(slot) + 1));
  // Each block uses six visible columns and one hidden lookup column.
  if (7 * blocks + 1 > 16384)
    throw new Error(`Too many vendor columns to export ${trade.name} to Excel`);
  const endCol = 6 * blocks; // B:F, H:L, N:R (no BOQ block)
  const helper = endCol + 2;
  const total = last + 1,
    label = last + 2,
    sum = last + 3,
    flag = last + 4;
  // Keep the original header, rebuild the table with the original vendor styles.
  for (const merge of [...ws.model.merges]) {
    const row = Number(/\d+/.exec(merge)[0]);
    if (row >= 5 || merge === "B1:X1" || merge === "T3:X3")
      ws.unMergeCells(merge);
  }
  ws.mergeCells(1, 2, 1, endCol);
  ws.getCell("B1").value = spaced(trade.name);
  ws.getCell("D3").value =
    trade.vendors.find((v) => v.id === trade.finalised_vendor_id)?.name || null;
  ws.getCell("T3").value = null;
  ws.mergeCells("N4:R4");
  ws.getCell("N4").style = clone(source.getCell("T3").style);
  ws.getCell("N4").value = {
    text: "← Back to Comparison",
    hyperlink: "#'Comparison'!A1",
  };
  ws.dataValidations.model = {};
  ws.conditionalFormattings = [];
  for (let r = 5; r <= Math.max(ws.rowCount, flag + 4); r++) {
    for (let c = 2; c <= Math.max(28, helper + blocks); c++) {
      ws.getCell(r, c).value = null;
      ws.getCell(r, c).style = {};
    }
  }
  const totals = trade.vendors.filter(completeQuote).map(quoteTotal);
  const lowest = totals.length ? Math.min(...totals) : null;
  for (let b = 0; b < blocks; b++) {
    const c = 2 + b * 6;
    const src = 8 + Math.min(b, 2) * 6;
    const vendor = vendors.get(b);
    for (let offset = 0; offset < 6; offset++) {
      ws.getColumn(c + offset).width = source.getColumn(src + offset).width;
      ws.getColumn(c + offset).hidden = false;
    }
    for (let r = 5; r <= flag; r++) {
      const sr =
        r <= 6
          ? r
          : r <= last
            ? Math.min(r, originalLast)
            : originalLast + r - last;
      ws.getRow(r).height = source.getRow(sr).height;
      for (let offset = 0; offset < 5; offset++)
        ws.getCell(r, c + offset).style = clone(
          source.getCell(sr, src + offset).style,
        );
    }
    for (const row of [5, total, label, sum, flag])
      ws.mergeCells(row, c, row, c + 4);
    ws.getCell(5, c).value = vendor?.name || `Vendor ${b + 1}`;
    ["S.No", "Description", "Qty", "Rate", "Amount"].forEach((v, j) => {
      ws.getCell(6, c + j).value = v;
    });
    for (let r = 7; r <= last; r++) {
      const item = vendor?.items[r - 7];
      ws.getCell(r, c).value = {
        formula: `IF(${COL(c + 1)}${r}="","",ROW()-6)`,
        result: item ? r - 6 : "",
      };
      ws.getCell(r, c + 1).value = item?.description || null;
      ws.getCell(r, c + 2).value = item?.quantity ?? null;
      ws.getCell(r, c + 3).value = item?.rate ?? null;
      ws.getCell(r, c + 4).value = {
        formula: `IF(${COL(c + 3)}${r}="","",IF(${COL(c + 2)}${r}="",${COL(c + 3)}${r},${COL(c + 2)}${r}*${COL(c + 3)}${r}))`,
        result: item ? (quoteAmount(item) ?? "") : "",
      };
    }
    ws.getCell(total, c).value = source.getCell(originalLast + 1, src).value;
    ws.getCell(label, c).value = {
      formula: `"("&${COL(c)}5&")"`,
      result: `(${vendor?.name || `Vendor ${b + 1}`})`,
    };
    ws.getCell(sum, c).value = {
      formula: `SUM(${COL(c + 4)}7:${COL(c + 4)}${last})`,
      result: vendor ? quoteTotal(vendor) : 0,
    };
    const eligible = `AND(COUNTA(${COL(c + 1)}7:${COL(c + 1)}${last})>0,COUNT(${COL(c + 3)}7:${COL(c + 3)}${last})=COUNTA(${COL(c + 1)}7:${COL(c + 1)}${last}))`;
    ws.getCell(5, helper + b).value = {
      formula: `${COL(c)}5`,
      result: vendor?.name || `Vendor ${b + 1}`,
    };
    ws.getCell(6, helper + b).value = {
      formula: `IF(${eligible},${COL(c)}${sum},"")`,
      result: vendor && completeQuote(vendor) ? quoteTotal(vendor) : "",
    };
    ws.getColumn(helper + b).hidden = true;
    const helperRange = `$${COL(helper)}$6:$${COL(helper + blocks - 1)}$6`;
    ws.getCell(flag, c).value = {
      formula: `TRIM(IF(AND($D$3<>"",$D$3=${COL(c)}5),"✓ FINALISED     ","")&IF(AND(${eligible},${COL(c)}${sum}=MIN(${helperRange})),"★ LOWEST",""))`,
      result: `${vendor?.id === trade.finalised_vendor_id ? "✓ FINALISED " : ""}${vendor && completeQuote(vendor) && quoteTotal(vendor) === lowest ? "★ LOWEST" : ""}`,
    };
    for (const range of [
      `${COL(c)}5:${COL(c + 4)}5`,
      `${COL(c)}${total}:${COL(c + 4)}${sum}`,
    ]) {
      const originalRule = source.conditionalFormattings[0]?.rules?.[0];
      if (originalRule)
        ws.conditionalFormattings.push({
          ref: range,
          rules: [
            {
              ...clone(originalRule),
              formulae: [`AND($D$3<>"",$D$3=$${COL(c)}$5)`],
            },
          ],
        });
    }
    if (vendor?.notes) {
      ws.mergeCells(flag + 2, c, flag + 2, c + 4);
      ws.getCell(flag + 2, c).value = `Notes: ${vendor.notes}`;
      ws.getCell(flag + 2, c).style = clone(source.getCell("N3").style);
      ws.getCell(flag + 2, c).alignment = {
        wrapText: true,
        vertical: "top",
        horizontal: "left",
      };
    }
  }
  for (let r = 7; r <= last; r++)
    ws.getRow(r).height = Math.max(
      source.getRow(Math.min(r, originalLast)).height || 25,
      ...trade.vendors.map((v) =>
        wrappedHeight([[v.items[r - 7]?.description || "", 26]], {
          min: 25,
          line: 12.5,
          pad: 6,
        }),
      ),
    );
  ws.getRow(flag + 2).height = Math.max(
    20,
    ...trade.vendors.map((v) =>
      wrappedHeight([[v.notes || "", 55]], { min: 20, line: 12.5 }),
    ),
  );
  const final = trade.vendors.find((v) => v.id === trade.finalised_vendor_id);
  const lastVendorColumn = COL(2 + (blocks - 1) * 6);
  const vendorName = 'SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(D3,"~","~~"),"*","~*"),"?","~?")';
  ws.getCell("J3").value = {
    formula: `IF(D3="","",IFERROR(INDEX(B${sum}:${lastVendorColumn}${sum},1,MATCH(${vendorName},B5:${lastVendorColumn}5,0)),"Name mismatch"))`,
    result: final ? quoteTotal(final) : "",
  };
  ws.getCell("D3").dataValidation = {
    type: "list",
    allowBlank: true,
    formulae: [`$${COL(helper)}$5:$${COL(helper + blocks - 1)}$5`],
  };
  for (let c = endCol + 1; c <= Math.max(28, helper + blocks); c++)
    ws.getColumn(c).hidden = true;
  ws.pageSetup.printArea = `B1:${COL(endCol)}${flag + (trade.vendors.some((v) => v.notes) ? 2 : 0)}`;
  return final ? { name: final.name, total: quoteTotal(final) } : null;
}

export async function buildVendorComparisonWorkbook(template, data) {
  const workbook = await loadXlsxTemplate(template);
  const originals = [...workbook.worksheets];
  const summary = workbook.getWorksheet("Comparison");
  const sources = originals.filter((s) => s !== summary);
  const used = new Set(["comparison"]);
  const sheets = data.trades.map((trade, index) => {
    const source =
      sources.find((s) => s.name.toLowerCase() === trade.name.toLowerCase()) ||
      sources[0];
    const sheet = cloneSheet(workbook, source, `export-${index}`);
    const picked = tradeSheet(sheet, source, trade);
    return { sheet, name: safeName(trade.name, used), picked };
  });
  sources.forEach((s) => workbook.removeWorksheet(s.id));
  sheets.forEach(({ sheet, name }) => {
    sheet.name = name;
  });
  // Preserve the original summary's typography, spacing and merged total block.
  const count = Math.max(1, data.trades.length);
  if (count < 30) deleteRows(summary, 6 + count, 30 - count);
  if (count > 30) {
    insertRows(summary, 35, count - 30);
    for (let r = 35; r < 35 + count - 30; r++) copyRowStyle(summary, 6, r, 5);
  }
  summary.getCell("B2").value = [data.projectName, data.clientName]
    .filter(Boolean)
    .join("   •   ");
  sheets.forEach(({ name, picked }, index) => {
    const r = index + 6,
      ref = quote(name);
    summary.getCell(r, 2).value = index + 1;
    summary.getCell(r, 3).value = {
      text: data.trades[index].name,
      hyperlink: `#${ref}!A1`,
    };
    summary.getCell(r, 4).value = {
      formula: `IF(${ref}!D3="","Pending",${ref}!D3)`,
      result: picked?.name || "Pending",
    };
    summary.getCell(r, 5).value = {
      formula: `IF(ISNUMBER(${ref}!J3),${ref}!J3,0)`,
      result: picked?.total || 0,
    };
  });
  const last = count + 5;
  summary.getCell(last + 3, 2).value = {
    formula: `SUM(E6:E${last})`,
    result: sheets.reduce((sum, s) => sum + (s.picked?.total || 0), 0),
  };
  summary.getCell(last + 4, 2).value = {
    formula: `COUNTIF(D6:D${last},"Pending")&" trade(s) pending selection"`,
    result: `${sheets.filter((s) => !s.picked).length} trade(s) pending selection`,
  };
  if (data.notes) {
    summary.mergeCells(last + 6, 2, last + 6, 5);
    summary.getCell(last + 6, 2).value = `Notes: ${data.notes}`;
    summary.getCell(last + 6, 2).style = clone(
      summary.getCell(last + 4, 2).style,
    );
    summary.getCell(last + 6, 2).alignment = {
      wrapText: true,
      vertical: "top",
    };
    summary.getRow(last + 6).height = wrappedHeight([[data.notes, 80]], {
      min: 22,
    });
  }
  summary.pageSetup.printArea = `B1:E${last + (data.notes ? 6 : 4)}`;
  workbook.calcProperties = { fullCalcOnLoad: true };
  return writeXlsx(workbook);
}
