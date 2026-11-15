// Quality checklists → the user's QUALITY CHECKLIST TEMPLATE.xlsx: "QC -Work heads"
// index + one sheet per checklist in the template's work-head layout (title bar,
// "Project :" line, Before / During / After execution sections, Checked (by
// engineer / architect) Yes/No/NA dropdowns with their colour rules).
// XLSX conversion happens in the browser using saved API JSON.
import { COL, cloneSheet, insertRows, loadXlsxTemplate, wrappedHeight, writeXlsx } from "../../lib/xlsxTemplate.js";

export const QUALITY_PHASES = [
  ["BEFORE_EXECUTION", "Before Execution"],
  ["DURING_EXECUTION", "During Execution"],
  ["AFTER_EXECUTION", "After Execution"],
];
export const QUALITY_STATUS_LABELS = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  DEFERRED: "Deferred",
};

const INDEX = "QC -Work heads";
const FALLBACK = "Demolition"; // 5-column layout used for checklists without a template sheet
const YES_NO = { type: "list", allowBlank: true, formulae: ['"Yes,No,NA"'] };
const clone = (v) => JSON.parse(JSON.stringify(v ?? {}));
const norm = (s) => String(s ?? "").toLowerCase().split(/\s+[—–-]\s+/)[0].replace(/[^a-z0-9]/g, "");
const yesNo = (v) => (v === true ? "Yes" : v === false ? "No" : null);
const day = (v) => (v ? new Date(`${String(v).slice(0, 10)}T00:00:00.000Z`) : null);
const HEAD_STATUS = {
  passed: "Verified",
  verified: "Verified",
  completed: "Verified",
  accepted: "Verified",
  "in progress": "In Progress",
  in_progress: "In Progress",
  pending: "Pending",
  not_started: "Pending",
  "not started": "Pending",
  "n/a": "N/A",
  not_applicable: "N/A",
};

const rowStyles = (ws, r, lastCol) => Array.from({ length: lastCol }, (_, c) => clone(ws.getCell(r, c + 1).style));
function applyRow(ws, r, styles, height) {
  const row = ws.getRow(r);
  styles.forEach((style, c) => {
    const cell = row.getCell(c + 1);
    cell.style = clone(style);
    cell.value = null;
  });
  if (height) row.height = height;
}
/** Remove merges, values and validations from `from` to the end of the sheet. */
function clearFrom(ws, from, lastCol) {
  for (const m of Object.values(ws._merges ?? {}))
    if (m.top >= from) ws.unMergeCells(m.top, m.left, m.bottom, m.right);
  for (let r = from; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= Math.max(lastCol, ws.columnCount); c++) {
      row.getCell(c).value = null;
      row.getCell(c).style = {};
      ws.dataValidations.remove(row.getCell(c).address);
    }
    row.height = undefined;
  }
}
function addColumns(ws, lastCol, columns) {
  columns.forEach(([label, width], k) => {
    const col = lastCol + 1 + k;
    ws.getColumn(col).width = width;
    ws.getCell(3, col).style = clone(ws.getCell(3, lastCol).style);
    ws.getCell(3, col).value = label;
    for (const r of [1, 2]) ws.getCell(r, col).style = clone(ws.getCell(r, lastCol).style);
  });
  const last = lastCol + columns.length;
  for (const r of [1, 2]) {
    ws.unMergeCells(r, 1, r, lastCol);
    ws.mergeCells(r, 1, r, last);
  }
  return last;
}
function ruleFor(ws, column) {
  const cf = (ws.conditionalFormattings ?? []).find((f) => f.ref.startsWith(column));
  return cf ? clone(cf.rules) : null;
}

function fillChecklist(ws, { checklist, items, projectName, matched }) {
  // Template layouts: C engineer, D architect, E remarks — or (6 cols) C engineer,
  // D remarks, E architect, F remarks.
  const wide = /architect/i.test(String(ws.getCell("E3").value ?? ""));
  const lastCol = wide ? 6 : 5;
  const archCol = wide ? 5 : 4;
  const remarksCol = wide ? 4 : 5;
  const labels = [];
  for (let r = 4; r <= ws.rowCount; r++)
    if (!ws.getCell(r, 1).value && ws.getCell(r, 2).value) labels.push(String(ws.getCell(r, 2).value));
  const section = rowStyles(ws, 4, lastCol);
  const odd = rowStyles(ws, 5, lastCol);
  const even = rowStyles(ws, 6, lastCol);
  const sectionHeight = ws.getRow(4).height;
  const itemHeight = ws.getRow(5).height || 22;
  const widthOf = (c) => ws.getColumn(c).width || 10;
  const engineerRules = ruleFor(ws, "C");
  const architectRules = ruleFor(ws, COL(archCol));

  if (!matched) ws.getCell("A1").value = String(checklist.title || checklist.name || "").toUpperCase();
  ws.getCell("A2").value = `Project : ${projectName}`;
  const last = addColumns(ws, lastCol, [
    ["Status", 16],
    ["Inspected On", 15],
  ]);
  clearFrom(ws, 4, last);
  ws.conditionalFormattings = [];
  const extend = (styles) => [...styles, clone(styles[lastCol - 1]), clone(styles[lastCol - 1])];

  let r = 4;
  const itemRows = [];
  for (const [i, [phase, label]] of QUALITY_PHASES.entries()) {
    const list = items.filter((item) => (item.phase || "BEFORE_EXECUTION") === phase).sort((a, b) => a.serial_number - b.serial_number);
    if (!list.length) continue;
    applyRow(ws, r, extend(section), sectionHeight);
    ws.getCell(r, 2).value = labels[i] ?? label;
    ws.mergeCells(r, 2, r, last);
    r++;
    for (const item of list) {
      applyRow(ws, r, extend(item.serial_number % 2 ? odd : even), null);
      const row = ws.getRow(r);
      row.getCell(1).value = item.serial_number;
      row.getCell(2).value = item.checkpoint_name;
      row.getCell(3).value = yesNo(item.is_accepted);
      row.getCell(remarksCol).value = item.remarks || null;
      row.getCell(lastCol + 1).value = QUALITY_STATUS_LABELS[item.status] || item.status || null;
      row.getCell(lastCol + 2).value = day(item.inspection_date);
      row.getCell(lastCol + 2).numFmt = "dd-mmm-yyyy";
      row.getCell(3).dataValidation = YES_NO;
      row.getCell(archCol).dataValidation = YES_NO;
      row.height = wrappedHeight(
        [
          [item.checkpoint_name, widthOf(2)],
          [item.remarks, widthOf(remarksCol)],
        ],
        { min: Math.min(itemHeight, 30), line: 14, pad: 10 },
      );
      itemRows.push(r);
      r++;
    }
  }
  if (itemRows.length) {
    const span = (col) => `${col}${itemRows[0]}:${col}${itemRows[itemRows.length - 1]}`;
    if (engineerRules) ws.conditionalFormattings.push({ ref: span("C"), rules: engineerRules });
    if (architectRules) ws.conditionalFormattings.push({ ref: span(COL(archCol)), rules: architectRules });
  }
  ws.pageSetup.printArea = `A1:${COL(last)}${Math.max(r - 1, 3)}`;
}

function fillIndex(ws, heads) {
  const lastCol = 4;
  const tint = rowStyles(ws, 4, lastCol);
  const white = rowStyles(ws, 5, lastCol);
  const height = ws.getRow(4).height;
  const rules = ruleFor(ws, "C");
  const statusRule = clone(ws.dataValidations.find("C4"));
  const last = addColumns(ws, lastCol, [["Checked On", 15]]);
  const templateLast = 22;
  const n = heads.length;
  if (n > templateLast - 3) insertRows(ws, templateLast, n - (templateLast - 3));
  clearFrom(ws, 4 + n, last);
  ws.conditionalFormattings = [];
  [...heads]
    .sort((a, b) => (a.template_serial_number ?? a.sort_order) - (b.template_serial_number ?? b.sort_order))
    .forEach((head, i) => {
      const r = 4 + i;
      applyRow(ws, r, [...(i % 2 ? white : tint), clone((i % 2 ? white : tint)[3])], height);
      const status = String(head.status ?? "");
      ws.getCell(r, 1).value = head.template_serial_number ?? head.sort_order ?? i + 1;
      ws.getCell(r, 2).value = head.name;
      ws.getCell(r, 3).value = HEAD_STATUS[status.toLowerCase()] || status || null;
      ws.getCell(r, 4).value = head.remarks || null;
      ws.getCell(r, 5).value = day(head.checked_at);
      ws.getCell(r, 5).numFmt = "dd-mmm-yyyy";
      ws.getCell(r, 3).dataValidation = statusRule;
      ws.getRow(r).height = Math.max(height || 24, wrappedHeight([[head.remarks, 40]], { line: 14, pad: 8 }));
    });
  if (n && rules) ws.conditionalFormattings.push({ ref: `C4:C${3 + n}`, rules });
  ws.pageSetup.printArea = `A1:${COL(last)}${Math.max(3 + n, 3)}`;
}

/** @param template ArrayBuffer of QUALITY CHECKLIST TEMPLATE.xlsx (or its URL) */
export async function buildQualityWorkbook(template, data) {
  const workbook = await loadXlsxTemplate(template);
  workbook.creator = "Rippotai Architecture";
  const projectName = data.project?.name || data.checklist?.project_id || "";
  const templates = workbook.worksheets.filter((ws) => ws.name !== INDEX && ws.state !== "hidden");
  const used = new Set();
  const keep = new Set();

  const index = workbook.getWorksheet(INDEX);
  if (data.work_heads) {
    fillIndex(index, data.work_heads);
    keep.add(index.id);
  }
  const names = new Set([INDEX.toLowerCase()]);
  const uniqueName = (name) => {
    const base = String(name || "Checklist").replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31) || "Checklist";
    let candidate = base;
    for (let i = 2; names.has(candidate.toLowerCase()); i++) candidate = `${base.slice(0, 26)} (${i})`;
    names.add(candidate.toLowerCase());
    return candidate;
  };
  const fallback = workbook.getWorksheet(FALLBACK);
  // Clone prototypes first so every copy starts from the untouched template.
  const plan = (data.checklists || [data])
    .filter((entry) => entry?.checklist)
    .map(({ checklist, items = [] }) => {
      const keys = [checklist.sheet_name, checklist.work_head, checklist.title, checklist.name].map(norm);
      const base =
        templates.find((ws) => keys.includes(norm(ws.name))) ||
        templates.find((ws) => keys.some((k) => k && norm(ws.name).startsWith(k))) ||
        null;
      return { checklist, items, base };
    });
  const sheets = plan.map(({ base }, i) => {
    const source = base || fallback;
    if (!used.has(source.id)) {
      used.add(source.id);
      return source;
    }
    return cloneSheet(workbook, source, `qc-${i}`);
  });
  plan.forEach(({ checklist, items, base }, i) => {
    const ws = sheets[i];
    ws.name = uniqueName(checklist.sheet_name || checklist.name);
    fillChecklist(ws, { checklist, items, projectName, matched: Boolean(base) });
    keep.add(ws.id);
  });
  for (const ws of [...workbook.worksheets]) if (!keep.has(ws.id)) workbook.removeWorksheet(ws.id);
  return writeXlsx(workbook);
}

export async function downloadQualityWorkbook(data, filename) {
  const [{ default: templateUrl }, { downloadXlsx }] = await Promise.all([
    import("@/assets/xlsx-templates/quality-checklist.xlsx?url"),
    import("@/lib/xlsxTemplate"),
  ]);
  downloadXlsx(await buildQualityWorkbook(templateUrl, data), `${filename}.xlsx`);
}
