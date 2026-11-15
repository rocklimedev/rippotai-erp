// Daily site report → the user's SITE ENGINEER DAILY PROGRESS REPORT TEMPLATE.xlsx
// (single "DPR" sheet: header block, 1 Manpower … 7 Photos). Tables grow with the
// data (rows inserted inside each table, merges / dropdowns / colour rules kept);
// INOS fields the template lacks follow as sections 8–10 in the same style.
import { copyRowStyle, insertRows, loadXlsxTemplate, wrappedHeight, writeXlsx } from "../../../lib/xlsxTemplate.js";

const clone = (v) => JSON.parse(JSON.stringify(v ?? {}));
const day = (v) => (v ? new Date(`${String(v).slice(0, 10)}T00:00:00.000Z`) : null);
const LEVEL = { NONE: "Green", LOW: "Green", MEDIUM: "Amber", HIGH: "Red" };
const titleCase = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const qty = (m) => [m.quantity != null ? Number(m.quantity).toLocaleString("en-IN") : "", m.unit || ""].join(" ").trim();

/**
 * Fill one numbered table of the template. `spans` are the merged column ranges of a
 * data row (e.g. [[3,4],[5,6]]); `cols` maps value index → first column.
 */
function fillBlock(ws, { first, count, rows, spans, cols, height = 22 }) {
  const extra = rows.length - count;
  if (extra > 0) {
    const at = first + count - 1;
    insertRows(ws, at, extra);
    for (let r = at; r < at + extra; r++) {
      copyRowStyle(ws, first, r, 7);
      for (const [a, b] of spans) ws.mergeCells(r, a, r, b);
    }
  }
  const total = Math.max(count, rows.length);
  for (let i = 0; i < total; i++) {
    const r = first + i;
    ws.getCell(r, 2).value = i + 1;
    const values = rows[i] || [];
    cols.forEach((col, k) => {
      ws.getCell(r, col).value = values[k] ?? null;
    });
    if (rows[i]) {
      const widths = cols.map((col) => {
        const span = spans.find(([a]) => a === col);
        let w = 0;
        for (let c = col; c <= (span ? span[1] : col); c++) w += ws.getColumn(c).width || 13;
        return w;
      });
      ws.getRow(r).height = Math.max(height, wrappedHeight(values.map((v, k) => [typeof v === "string" ? v : "", widths[k]]), { line: 13, pad: 8 }));
    }
  }
  return Math.max(0, extra);
}

/** A new section after the template's last one, styled like section 1 (rows 8–11). */
function appendSection(ws, start, { title, headers, spans, rows, note }) {
  let r = start;
  copyRowStyle(ws, 8, r, 7);
  ws.mergeCells(r, 2, r, 7);
  ws.getCell(r, 2).value = title;
  r++;
  if (note) {
    copyRowStyle(ws, 9, r, 7);
    ws.mergeCells(r, 2, r, 7);
    ws.getCell(r, 2).value = note;
    r++;
  }
  copyRowStyle(ws, 10, r, 7);
  for (const [a, b] of spans) {
    for (let c = a; c <= b; c++) ws.getCell(r, c).style = clone(ws.getCell(10, 3).style);
    if (b > a) ws.mergeCells(r, a, r, b);
  }
  ws.getCell(r, 2).value = "#";
  headers.forEach((h, k) => (ws.getCell(r, spans[k][0]).value = h));
  r++;
  rows.forEach((values, i) => {
    copyRowStyle(ws, 11, r, 7);
    for (const [a, b] of spans) {
      // Data cells of the template row 11 are C:D, E:F, G — restyle per span.
      for (let c = a; c <= b; c++) ws.getCell(r, c).style = clone(ws.getCell(11, 3).style);
      if (b > a) ws.mergeCells(r, a, r, b);
    }
    ws.getCell(r, 2).style = clone(ws.getCell(11, 2).style);
    ws.getCell(r, 2).value = i + 1;
    values.forEach((v, k) => (ws.getCell(r, spans[k][0]).value = v ?? null));
    ws.getRow(r).height = Math.max(22, wrappedHeight([[String(values.join(" ")), 60]], { line: 13, pad: 8 }));
    r++;
  });
  return r + 1;
}

export async function buildDailyReportWorkbook(template, report) {
  const workbook = await loadXlsxTemplate(template);
  workbook.creator = "Rippotai Architecture";
  workbook.calcProperties = { fullCalcOnLoad: true };
  const ws = workbook.getWorksheet("DPR");

  // Header block.
  ws.getCell("D5").value = report.project?.name || null;
  ws.getCell("F5").value = day(report.reportDate);
  ws.getCell("D6").value = report.reportedBy || null;
  if (report.submittedAt) {
    const t = new Date(report.submittedAt);
    // Excel time-of-day fraction for the "hh:mm AM/PM" cell (India time).
    const ist = new Date(t.getTime() + 330 * 60000);
    ws.getCell("F6").value = (ist.getUTCHours() * 60 + ist.getUTCMinutes()) / 1440;
  }

  const workItems = report.workItems?.length
    ? report.workItems
    : report.workCompleted
      ? [{ activity: report.workCompleted }]
      : [];
  const received = (report.materials || []).filter((m) => m.direction === "RECEIVED");
  const used = (report.materials || []).filter((m) => m.direction === "USED");
  const plan = String(report.nextDayPlan || "")
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
  const issues = [
    ...(report.issueItems || []).map((i) => [
      `${titleCase(i.type)}: ${i.description}${i.needsAttention ? " (needs attention)" : ""}`,
      null,
      LEVEL[i.impact] || null,
      day(report.reportDate),
    ]),
    ...(report.issues ? [[report.issues, null, null, day(report.reportDate)]] : []),
  ];
  const manpower = report.manpower || [];

  // Fill bottom-up so inserted rows never shift a block that is still to be filled.
  fillBlock(ws, { first: 54, count: 4, rows: issues, spans: [[3, 4]], cols: [3, 5, 6, 7] });
  fillBlock(ws, { first: 46, count: 5, rows: [], spans: [[5, 6]], cols: [3, 4, 5, 7] });
  fillBlock(ws, {
    first: 38,
    count: 5,
    rows: received.map((m) => [[m.name, m.remarks].filter(Boolean).join(" — "), null, qty(m), null]),
    spans: [[5, 6]],
    cols: [3, 4, 5, 7],
  });
  fillBlock(ws, { first: 30, count: 5, rows: plan.map((p) => [null, p, null]), spans: [[4, 6]], cols: [3, 4, 7] });
  fillBlock(ws, {
    first: 21,
    count: 6,
    rows: workItems.map((w) => {
      const pct = w.progress == null ? null : Number(w.progress);
      const status = pct == null ? null : pct >= 100 ? "Done" : pct > 0 ? "In Progress" : "Not Started";
      const activity = [w.activity, pct != null && pct < 100 && pct > 0 ? `(${pct}%)` : null, w.remarks ? `— ${w.remarks}` : null]
        .filter(Boolean)
        .join(" ");
      return [w.location || null, activity, null, status];
    }),
    spans: [[4, 5]],
    cols: [3, 4, 6, 7],
  });
  const grown = fillBlock(ws, {
    first: 11,
    count: 6,
    rows: manpower.map((m) => [m.contractorName || null, titleCase(m.trade), Number(m.headcount) || 0]),
    spans: [
      [3, 4],
      [5, 6],
    ],
    cols: [3, 5, 7],
  });
  const totalRow = 17 + grown;
  const lastHead = 16 + grown;
  ws.getCell(totalRow, 7).value = {
    formula: `SUM(G11:G${lastHead})`,
    result: manpower.reduce((n, m) => n + (Number(m.headcount) || 0), 0),
  };

  // 7. PHOTOS — one linked line per photo under the section bar.
  let photosRow = 0;
  ws.eachRow((row, n) => {
    if (String(row.getCell(2).value || "").startsWith("7.  PHOTOS")) photosRow = n;
  });
  let r = photosRow + 1;
  for (const [i, p] of (report.photos || []).entries()) {
    copyRowStyle(ws, 9, r, 7);
    ws.mergeCells(r, 2, r, 7);
    ws.getCell(r, 2).value = { text: `${i + 1}.  ${p.caption || p.filename || "Photo"}`, hyperlink: p.url };
    ws.getCell(r, 2).font = { ...clone(ws.getCell(9, 2).font), italic: false, underline: true, color: { argb: "FF0D3D2F" } };
    r++;
  }
  r += 1;

  // INOS fields beyond the template, in the template's section style.
  const conditions = [
    ["Weather", [titleCase(report.weatherCondition), report.weatherNotes].filter(Boolean).join(" — ") || null],
    ["Site condition", titleCase(report.siteCondition) || null],
    ["Safety incident", report.safetyIncident ? "Yes" : "No"],
    ["Safety notes", report.safetyNotes || null],
    ["Status", titleCase(report.status)],
    ["Shared with client", report.isShared ? "Yes" : report.shareWithClient ? "On submit" : "No"],
  ];
  r = appendSection(ws, r, {
    title: "8.  SITE CONDITIONS & SAFETY",
    headers: ["Item", "Details"],
    spans: [
      [3, 4],
      [5, 7],
    ],
    rows: conditions,
  });
  if ((report.equipment || []).length)
    r = appendSection(ws, r, {
      title: "9.  EQUIPMENT ON SITE",
      headers: ["Equipment", "Count", "Hours", "Remarks"],
      spans: [
        [3, 3],
        [4, 4],
        [5, 5],
        [6, 7],
      ],
      rows: report.equipment.map((e) => [e.name, e.count ?? null, e.hours ?? null, e.remarks || null]),
    });
  if (used.length)
    r = appendSection(ws, r, {
      title: `${(report.equipment || []).length ? 10 : 9}.  MATERIAL USED`,
      headers: ["Material", "Quantity", "Remarks"],
      spans: [
        [3, 4],
        [5, 5],
        [6, 7],
      ],
      rows: used.map((m) => [m.name, qty(m), m.remarks || null]),
    });
  ws.pageSetup.printArea = `A1:G${Math.max(r - 1, 59)}`;
  // The template fits one page; longer reports keep the width and flow onto more pages.
  if (r - 1 > 62) Object.assign(ws.pageSetup, { fitToPage: true, fitToWidth: 1, fitToHeight: 0 });
  return writeXlsx(workbook);
}

export async function downloadDailyReportWorkbook(report, filename) {
  const [{ default: templateUrl }, { downloadXlsx }] = await Promise.all([
    import("@/assets/xlsx-templates/site-engineer-dpr.xlsx?url"),
    import("@/lib/xlsxTemplate"),
  ]);
  downloadXlsx(await buildDailyReportWorkbook(templateUrl, report), `${filename}.xlsx`);
}

