// Fill the user's ORIGINAL Excel templates (src/assets/xlsx-templates/*.xlsx) in the
// browser. Mirrors backend/src/common/xlsx-template/xlsx-template.ts: the reference
// workbook is loaded as-is (sheets, title blocks, merges, fonts, fills, borders,
// widths, heights, number formats, validations, conditional formats, freeze panes,
// print setup) and only data cells are written; table rows reuse a prototype row's
// style and the rows below a table move with the data.
// Only bare imports here so the builders can also run under `node --test`.
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { downloadName } from './download-name.js';

const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));
const attr = (xml, name) => new RegExp(`\\s${name}="([^"]*)"`).exec(xml)?.[1];
const decodeXml = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

export const COL = (n) => {
  let s = '';
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};
const colNum = (s) => [...s.toUpperCase()].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
function parseRange(ref) {
  const [a, b = a] = ref.replace(/\$/g, '').split(':');
  const p = (x) => {
    const m = /^([A-Z]+)(\d+)$/i.exec(x);
    return [colNum(m[1]), Number(m[2])];
  };
  const [l, t] = p(a);
  const [r, btm] = p(b);
  return { top: t, left: l, bottom: btm, right: r };
}
const fmtRange = (b) =>
  b.top === b.bottom && b.left === b.right
    ? `${COL(b.left)}${b.top}`
    : `${COL(b.left)}${b.top}:${COL(b.right)}${b.bottom}`;

/** Fetch (browser) or accept (tests) the template bytes and load them. */
export async function loadXlsxTemplate(source) {
  const buffer = typeof source === 'string' ? await (await fetch(source)).arrayBuffer() : source;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  await restoreTemplateFidelity(workbook, buffer);
  // ExcelJS shares one style object between cells with the same style id.
  workbook.eachSheet((ws) =>
    ws.eachRow({ includeEmpty: true }, (row) =>
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.style = clone(cell.style) ?? {};
      }),
    ),
  );
  return workbook;
}

/** ExcelJS reads <sz> as an integer (10.5 → 10) and drops x14 validations. */
export async function restoreTemplateFidelity(workbook, buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const read = async (path) => (zip.file(path) ? zip.file(path).async('string') : '');
  const styles = await read('xl/styles.xml');
  const fontSizes = [
    ...(/<fonts[^>]*>([\s\S]*?)<\/fonts>/.exec(styles)?.[1] ?? '').matchAll(
      /<font\b[^>]*?(?:\/>|>([\s\S]*?)<\/font>)/g,
    ),
  ].map((m) => Number(/<sz val="([\d.]+)"/.exec(m[1] ?? '')?.[1] ?? 0));
  const xfFont = [
    ...(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles)?.[1] ?? '').matchAll(/<xf\b([^>]*)/g),
  ].map((m) => Number(attr(m[1], 'fontId') ?? 0));
  const fractional = (s) => {
    const size = fontSizes[xfFont[s]];
    return size && !Number.isInteger(size) ? size : 0;
  };
  const wbXml = await read('xl/workbook.xml');
  const rels = await read('xl/_rels/workbook.xml.rels');
  const targets = new Map(
    [...rels.matchAll(/<Relationship\b([^>]*)\/?>/g)].map((m) => [
      attr(m[1], 'Id'),
      attr(m[1], 'Target'),
    ]),
  );
  const sheets = [...wbXml.matchAll(/<sheet\b([^>]*)\/?>/g)].map((m) => ({
    name: decodeXml(attr(m[1], 'name') ?? ''),
    target: targets.get(attr(m[1], 'r:id')) ?? '',
  }));
  for (const { name, target } of sheets) {
    const ws = workbook.getWorksheet(name);
    if (!ws || !target) continue;
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
    const xml = await read(path);
    // Boolean attributes written as "true"/"false" (not 1/0) are missed by ExcelJS.
    const fit = /<pageSetUpPr\b[^>]*fitToPage="(true|1)"/.exec(xml);
    if (fit) ws.pageSetup.fitToPage = true;
    const view = /<sheetView\b([^>]*)>/.exec(xml)?.[1] ?? '';
    if (/showGridLines="(false|0)"/.test(view) && ws.views?.[0]) ws.views[0].showGridLines = false;
    for (const m of xml.matchAll(/<c r="([A-Z]+\d+)"([^>]*)/g)) {
      const size = fractional(Number(attr(m[2], 's') ?? 0));
      if (!size) continue;
      const cell = ws.getCell(m[1]);
      cell.style = { ...cell.style, font: { ...(cell.font ?? {}), size } };
    }
    for (const m of xml.matchAll(
      /<x14:dataValidation\b([^>]*)>([\s\S]*?)<\/x14:dataValidation>/g,
    )) {
      const formula1 = /<x14:formula1>\s*<xm:f>([\s\S]*?)<\/xm:f>/.exec(m[2])?.[1];
      const sqref = /<xm:sqref>([\s\S]*?)<\/xm:sqref>/.exec(m[2])?.[1];
      if (!formula1 || !sqref) continue;
      const rule = {
        type: attr(m[1], 'type') ?? 'list',
        allowBlank: attr(m[1], 'allowBlank') === '1',
        showErrorMessage: attr(m[1], 'showErrorMessage') === '1',
        showInputMessage: attr(m[1], 'showInputMessage') === '1',
        formulae: [decodeXml(formula1)],
      };
      for (const range of sqref.trim().split(/\s+/)) {
        const b = parseRange(range);
        for (let r = b.top; r <= b.bottom; r++)
          for (let c = b.left; c <= b.right; c++)
            ws.dataValidations.add(`${COL(c)}${r}`, { ...rule });
      }
    }
  }
}

/** Copy a row's height, cell styles and per-cell validations onto another row. */
export function copyRowStyle(ws, src, dst, lastCol = ws.columnCount, firstCol = 1) {
  const s = ws.getRow(src);
  const d = ws.getRow(dst);
  if (s.height) d.height = s.height;
  for (let c = firstCol; c <= lastCol; c++) {
    d.getCell(c).style = clone(s.getCell(c).style) ?? {};
    const rule = ws.dataValidations.find(s.getCell(c).address);
    if (rule) ws.dataValidations.add(d.getCell(c).address, rule);
  }
}

function shiftBox(b, at, count) {
  if (b.top >= at) return { ...b, top: b.top + count, bottom: b.bottom + count };
  if (b.bottom >= at) return { ...b, bottom: b.bottom + count };
  return b;
}
export const shiftRef = (ref, at, count) =>
  ref
    .split(/\s+/)
    .filter(Boolean)
    .map((r) => fmtRange(shiftBox(parseRange(r), at, count)))
    .join(' ');

function moveRow(ws, from, to, lastCol) {
  const src = ws.getRow(from);
  const dst = ws.getRow(to);
  dst.height = src.height;
  for (let c = 1; c <= lastCol; c++) {
    const a = src.getCell(c);
    const b = dst.getCell(c);
    b.value = a.value;
    b.style = clone(a.style) ?? {};
    a.value = null;
    a.style = {};
  }
  src.height = undefined;
}
function shiftValidations(ws, at, count, deleted) {
  const next = {};
  for (const [key, value] of Object.entries(ws.dataValidations.model)) {
    if (!value) continue;
    const box = parseRange(key);
    if (deleted && box.top >= deleted[0] && box.top < deleted[1]) continue;
    next[shiftRef(key, at, count)] = value;
  }
  ws.dataValidations.model = next;
}

/** Insert `count` blank rows before row `at` (rows, merges, validations, CF move). */
export function insertRows(ws, at, count) {
  if (count <= 0) return;
  const merges = Object.values(ws._merges ?? {}).map((m) => ({
    top: m.top,
    left: m.left,
    bottom: m.bottom,
    right: m.right,
  }));
  const moving = merges.filter((m) => m.top >= at);
  moving.forEach((m) => ws.unMergeCells(fmtRange(m)));
  const lastCol = Math.max(ws.columnCount, 1);
  for (let r = ws.rowCount; r >= at; r--) moveRow(ws, r, r + count, lastCol);
  moving.forEach((m) => ws.mergeCells(fmtRange(shiftBox(m, at, count))));
  shiftValidations(ws, at, count);
  for (const cf of ws.conditionalFormattings ?? []) cf.ref = shiftRef(cf.ref, at, count);
}

/** Delete `count` rows starting at `at`; everything below moves up. */
export function deleteRows(ws, at, count) {
  if (count <= 0) return;
  const end = at + count; // first row that survives
  const merges = Object.values(ws._merges ?? {}).map((m) => ({
    top: m.top,
    left: m.left,
    bottom: m.bottom,
    right: m.right,
  }));
  merges.filter((m) => m.bottom >= at).forEach((m) => ws.unMergeCells(fmtRange(m)));
  const lastCol = Math.max(ws.columnCount, 1);
  const last = ws.rowCount;
  for (let r = end; r <= last; r++) moveRow(ws, r, r - count, lastCol);
  for (let r = last - count + 1; r <= last; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= lastCol; c++) {
      row.getCell(c).value = null;
      row.getCell(c).style = {};
    }
    row.height = undefined;
  }
  merges
    .filter((m) => m.top >= end)
    .forEach((m) =>
      ws.mergeCells(fmtRange({ ...m, top: m.top - count, bottom: m.bottom - count })),
    );
  shiftValidations(ws, end, -count, [at, end]);
  for (const cf of ws.conditionalFormattings ?? [])
    cf.ref = cf.ref
      .split(/\s+/)
      .filter(Boolean)
      .map((ref) => {
        const b = parseRange(ref);
        if (b.top >= end) return fmtRange({ ...b, top: b.top - count, bottom: b.bottom - count });
        if (b.bottom >= at) return fmtRange({ ...b, bottom: Math.max(b.top, b.bottom - count) });
        return ref;
      })
      .join(' ');
}

/**
 * Write a table: data rows start at `startRow` styled like `protoRow`; the template
 * has `templateRows` formatted rows there — extra data pushes the rows below down.
 */
export function fillTable(
  ws,
  { startRow, protoRow = startRow, templateRows, rows, lastCol = ws.columnCount, firstCol = 1 },
) {
  let proto = protoRow;
  const extra = rows.length - templateRows;
  if (extra > 0) {
    const at = startRow + Math.max(0, templateRows - 1);
    insertRows(ws, at, extra);
    if (proto >= at) proto += extra;
  }
  rows.forEach((values, i) => {
    const r = startRow + i;
    if (r !== proto) copyRowStyle(ws, proto, r, lastCol);
    values.forEach((value, c) => {
      ws.getCell(r, firstCol + c).value = value ?? null;
    });
  });
  return startRow + Math.max(rows.length, templateRows);
}

/** Row height (points) for wrapped text in columns `width` characters wide. */
export function wrappedHeight(texts, { min = 15, line = 13.5, pad = 4, max = 409 } = {}) {
  const lines = Math.max(
    1,
    ...texts.map(([text, width]) =>
      (typeof text === 'string' ? text : text == null ? '' : String(text))
        .split('\n')
        .reduce((n, part) => n + Math.max(1, Math.ceil(part.length / Math.max(1, width * 1.1))), 0),
    ),
  );
  return Math.min(max, Math.max(min, lines * line + pad));
}

/** Copy a template sheet (styles, merges, validations, CF, print setup) to a new sheet. */
export function cloneSheet(wb, src, name) {
  const ws = wb.addWorksheet(name);
  const model = clone(src.model);
  model.name = name;
  model.id = ws.id;
  model.orderNo = ws.orderNo;
  ws.model = model;
  for (const m of Object.values(src._merges ?? {})) ws.mergeCells(fmtRange(m));
  return ws;
}

/** Merge per-cell validations into column runs (ExcelJS can emit overlaps). */
export function compactValidations(ws) {
  const next = {};
  const runs = new Map();
  for (const [key, rule] of Object.entries(ws.dataValidations.model)) {
    if (!rule) continue;
    const m = /^([A-Z]+)(\d+)$/.exec(key);
    if (!m) {
      next[key] = rule;
      continue;
    }
    const col = colNum(m[1]);
    const id = `${col}|${JSON.stringify(rule)}`;
    if (!runs.has(id)) runs.set(id, { col, rows: [], rule });
    runs.get(id).rows.push(Number(m[2]));
  }
  for (const { col, rows, rule } of runs.values()) {
    rows.sort((a, b) => a - b);
    let start = rows[0];
    for (let i = 1; i <= rows.length; i++) {
      if (i < rows.length && rows[i] === rows[i - 1] + 1) continue;
      next[fmtRange({ top: start, bottom: rows[i - 1], left: col, right: col })] = rule;
      start = rows[i];
    }
  }
  ws.dataValidations.model = next;
}

export async function writeXlsx(wb) {
  wb.eachSheet((ws) => compactValidations(ws));
  return wb.xlsx.writeBuffer();
}

/** Browser download of a workbook buffer. */
export function downloadXlsx(buffer, fileName) {
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = downloadName([fileName], 'export.xlsx', 'Workbook');
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
