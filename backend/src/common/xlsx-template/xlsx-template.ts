// Fill the user's ORIGINAL Excel templates (src/common/xlsx-template/files/*.xlsx)
// instead of drawing workbooks from scratch: the reference workbook is loaded as-is
// (sheet names, title blocks, merges, fonts, fills, borders, widths, heights, number
// formats, validations, conditional formats, freeze panes, print setup) and only
// the data cells are written. Table rows reuse a prototype row's style and the
// rows below a table are pushed down when the data outgrows the template.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Workbook } from 'exceljs';
import type { Worksheet } from 'exceljs';
import JSZip from 'jszip';

const cache = new Map<string, Buffer>();

export function xlsxTemplateBuffer(file: string): Buffer {
  if (!cache.has(file)) {
    const candidates = [
      join(__dirname, 'files', file),
      resolve(process.cwd(), 'src', 'common', 'xlsx-template', 'files', file),
      resolve(
        process.cwd(),
        'dist',
        'src',
        'common',
        'xlsx-template',
        'files',
        file,
      ),
    ];
    const hit = candidates.find((p) => existsSync(p));
    if (!hit) throw new Error(`Excel template not found: ${file}`);
    cache.set(file, readFileSync(hit));
  }
  return cache.get(file)!;
}

/** Load a template workbook and restore what ExcelJS drops on read. */
export async function loadXlsxTemplate(file: string): Promise<Workbook> {
  const buffer = xlsxTemplateBuffer(file);
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer as any);
  await restoreTemplateFidelity(workbook, buffer);
  // ExcelJS shares one style object between cells loaded with the same style
  // id; give every cell its own so per-cell edits (numFmt, font…) stay local.
  workbook.eachSheet((ws) =>
    ws.eachRow({ includeEmpty: true }, (row) =>
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.style = clone(cell.style) ?? {};
      }),
    ),
  );
  return workbook;
}

const attr = (xml: string, name: string) =>
  new RegExp(`\\s${name}="([^"]*)"`).exec(xml)?.[1];

/**
 * ExcelJS parses <sz> as an integer (10.5 → 10) and ignores x14 data validations
 * (list sources on another sheet). Both are read back from the original XML.
 */
export async function restoreTemplateFidelity(
  workbook: Workbook,
  buffer: Buffer | ArrayBuffer | Uint8Array,
) {
  const zip = await JSZip.loadAsync(buffer);
  const read = (path: string) => zip.file(path)?.async('string') ?? '';
  const styles = await read('xl/styles.xml');
  const fontSizes = [
    ...(/<fonts[^>]*>([\s\S]*?)<\/fonts>/.exec(styles)?.[1] ?? '').matchAll(
      /<font\b[^>]*?(?:\/>|>([\s\S]*?)<\/font>)/g,
    ),
  ].map((m) => Number(/<sz val="([\d.]+)"/.exec(m[1] ?? '')?.[1] ?? 0));
  const xfFont = [
    ...(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles)?.[1] ?? '').matchAll(
      /<xf\b([^>]*)/g,
    ),
  ].map((m) => Number(attr(m[1], 'fontId') ?? 0));
  const fractional = (s: number) => {
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
    const path = target.startsWith('/')
      ? target.slice(1)
      : `xl/${target.replace(/^\.\//, '')}`;
    const xml = await read(path);
    // Boolean attributes written as "true"/"false" (not 1/0) are missed by ExcelJS.
    const fit = /<pageSetUpPr\b[^>]*fitToPage="(true|1)"/.exec(xml);
    if (fit) ws.pageSetup.fitToPage = true;
    const view = /<sheetView\b([^>]*)>/.exec(xml)?.[1] ?? '';
    if (/showGridLines="(false|0)"/.test(view) && (ws.views as any)?.[0])
      (ws.views as any)[0].showGridLines = false;
    for (const m of xml.matchAll(/<c r="([A-Z]+\d+)"([^>]*)/g)) {
      const s = Number(attr(m[2], 's') ?? 0);
      const size = fractional(s);
      if (!size) continue;
      const cell = ws.getCell(m[1]);
      cell.style = { ...cell.style, font: { ...(cell.font ?? {}), size } };
    }
    for (const m of xml.matchAll(
      /<x14:dataValidation\b([^>]*)>([\s\S]*?)<\/x14:dataValidation>/g,
    )) {
      const formula1 = /<x14:formula1>\s*<xm:f>([\s\S]*?)<\/xm:f>/.exec(
        m[2],
      )?.[1];
      const sqref = /<xm:sqref>([\s\S]*?)<\/xm:sqref>/.exec(m[2])?.[1];
      if (!formula1 || !sqref) continue;
      const rule = {
        type: (attr(m[1], 'type') ?? 'list') as any,
        allowBlank: attr(m[1], 'allowBlank') === '1',
        showErrorMessage: attr(m[1], 'showErrorMessage') === '1',
        showInputMessage: attr(m[1], 'showInputMessage') === '1',
        formulae: [decodeXml(formula1)],
      };
      // Per-cell keys, like ExcelJS's own parser, so row copies can find them.
      for (const range of sqref.trim().split(/\s+/)) {
        const b = parseRange(range);
        for (let r = b.top; r <= b.bottom; r++)
          for (let c = b.left; c <= b.right; c++)
            (ws as any).dataValidations.add(`${COL(c)}${r}`, { ...rule });
      }
    }
  }
}

const decodeXml = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const clone = <T>(v: T): T => (v == null ? v : JSON.parse(JSON.stringify(v)));

/** Copy a row's height and every cell style (1..lastCol) onto another row. */
export function copyRowStyle(
  ws: Worksheet,
  src: number,
  dst: number,
  lastCol = ws.columnCount,
) {
  const s = ws.getRow(src);
  const d = ws.getRow(dst);
  if (s.height) d.height = s.height;
  const dv = (ws as any).dataValidations;
  for (let c = 1; c <= lastCol; c++) {
    d.getCell(c).style = clone(s.getCell(c).style) ?? {};
    const rule = dv?.find(s.getCell(c).address);
    if (rule) dv.add(d.getCell(c).address, rule);
  }
}

interface Box {
  top: number;
  left: number;
  bottom: number;
  right: number;
}
const COL = (n: number) => {
  let s = '';
  for (; n > 0; n = Math.floor((n - 1) / 26))
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};
const colNum = (s: string) =>
  [...s.toUpperCase()].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
function parseRange(ref: string): Box {
  const [a, b = a] = ref.replace(/\$/g, '').split(':');
  const p = (x: string) => {
    const m = /^([A-Z]+)(\d+)$/i.exec(x)!;
    return [colNum(m[1]), Number(m[2])];
  };
  const [l, t] = p(a);
  const [r, btm] = p(b);
  return { top: t, left: l, bottom: btm, right: r };
}
const fmtRange = (b: Box) =>
  b.top === b.bottom && b.left === b.right
    ? `${COL(b.left)}${b.top}`
    : `${COL(b.left)}${b.top}:${COL(b.right)}${b.bottom}`;
function shiftBox(b: Box, at: number, count: number): Box {
  if (b.top >= at)
    return { ...b, top: b.top + count, bottom: b.bottom + count };
  if (b.bottom >= at) return { ...b, bottom: b.bottom + count };
  return b;
}
export const shiftRef = (ref: string, at: number, count: number) =>
  ref
    .split(/\s+/)
    .filter(Boolean)
    .map((r) => fmtRange(shiftBox(parseRange(r), at, count)))
    .join(' ');

/**
 * Insert `count` blank rows before row `at`: rows, merges, data validations and
 * conditional-format ranges at/below `at` move down (ranges spanning `at` grow).
 */
export function insertRows(ws: Worksheet, at: number, count: number) {
  if (count <= 0) return;
  const merges: Box[] = Object.values((ws as any)._merges ?? {}).map(
    (m: any) => ({
      top: m.top,
      left: m.left,
      bottom: m.bottom,
      right: m.right,
    }),
  );
  const moving = merges.filter((m) => m.top >= at);
  moving.forEach((m) => ws.unMergeCells(fmtRange(m)));
  const last = ws.rowCount;
  const lastCol = Math.max(ws.columnCount, 1);
  for (let r = last; r >= at; r--) {
    const src = ws.getRow(r);
    const dst = ws.getRow(r + count);
    dst.height = src.height;
    (dst as any).hidden = src.hidden;
    for (let c = 1; c <= lastCol; c++) {
      const from = src.getCell(c);
      const to = dst.getCell(c);
      to.value = from.value;
      to.style = clone(from.style) ?? {};
      from.value = null;
      from.style = {};
    }
    src.height = undefined as any;
  }
  moving.forEach((m) => ws.mergeCells(fmtRange(shiftBox(m, at, count))));
  const dv = (ws as any).dataValidations?.model as Record<string, any>;
  if (dv) {
    const next: Record<string, any> = {};
    for (const [key, value] of Object.entries(dv)) {
      const ref = key.replace(/^range:/, '');
      const shifted = shiftRef(ref, at, count);
      next[key.startsWith('range:') ? `range:${shifted}` : shifted] = value;
    }
    (ws as any).dataValidations.model = next;
  }
  for (const cf of (ws as any).conditionalFormattings ?? [])
    cf.ref = shiftRef(cf.ref, at, count);
}

/**
 * Write a table into a template: data rows start at `startRow` (styled like
 * `protoRow`); the template provides `templateRows` formatted rows there and the
 * content below them is pushed down when there is more data.
 * Returns the row number after the last written/template row.
 */
export function fillTable(
  ws: Worksheet,
  opts: {
    startRow: number;
    protoRow?: number;
    templateRows: number;
    rows: unknown[][];
    lastCol?: number;
    firstCol?: number;
  },
) {
  let proto = opts.protoRow ?? opts.startRow;
  const lastCol = opts.lastCol ?? ws.columnCount;
  const firstCol = opts.firstCol ?? 1;
  const extra = opts.rows.length - opts.templateRows;
  if (extra > 0) {
    // Insert inside the table (before its last row) so validation and
    // conditional-format ranges covering the template rows grow with it.
    const at = opts.startRow + Math.max(0, opts.templateRows - 1);
    insertRows(ws, at, extra);
    if (proto >= at) proto += extra;
  }
  opts.rows.forEach((values, i) => {
    const r = opts.startRow + i;
    if (r !== proto) copyRowStyle(ws, proto, r, lastCol);
    values.forEach((value, c) => {
      ws.getCell(r, firstCol + c).value = (value ?? null) as any;
    });
  });
  return opts.startRow + Math.max(opts.rows.length, opts.templateRows);
}

/** Row height estimate for wrapped text (points) in columns of `widths` chars. */
export function wrappedHeight(
  texts: Array<[unknown, number]>,
  { min = 15, line = 13.5, pad = 4, max = 409 } = {},
) {
  const lines = Math.max(
    1,
    ...texts.map(([text, width]) =>
      (typeof text === 'string'
        ? text
        : text == null
          ? ''
          : `${text as number}`
      )
        .split('\n')
        .reduce(
          (n, part) =>
            n + Math.max(1, Math.ceil(part.length / Math.max(1, width * 1.1))),
          0,
        ),
    ),
  );
  return Math.min(max, Math.max(min, lines * line + pad));
}

/** Copy one template sheet into a new sheet of the same workbook. */
export function cloneSheet(wb: Workbook, src: Worksheet, name: string) {
  const ws = wb.addWorksheet(name);
  const model = clone((src as any).model);
  model.name = name;
  model.id = (ws as any).id;
  model.orderNo = (ws as any).orderNo;
  (ws as any).model = model;
  for (const m of Object.values((src as any)._merges ?? {}))
    ws.mergeCells(fmtRange(m as any));
  return ws;
}

/**
 * ExcelJS squeezes per-cell validations by sorted address strings ("K10" < "K6"),
 * which can emit overlapping ranges. Merge them into explicit column runs first.
 */
export function compactValidations(ws: Worksheet) {
  const dv = (ws as any).dataValidations;
  if (!dv?.model) return;
  const next: Record<string, any> = {};
  const runs = new Map<string, { col: number; rows: number[]; rule: any }>();
  for (const [key, rule] of Object.entries(dv.model as Record<string, any>)) {
    if (!rule) continue;
    const m = /^([A-Z]+)(\d+)$/.exec(key);
    if (!m) {
      next[key] = rule;
      continue;
    }
    const col = colNum(m[1]);
    const id = `${col}|${JSON.stringify(rule)}`;
    if (!runs.has(id)) runs.set(id, { col, rows: [], rule });
    runs.get(id)!.rows.push(Number(m[2]));
  }
  for (const { col, rows, rule } of runs.values()) {
    rows.sort((a, b) => a - b);
    let start = rows[0];
    for (let i = 1; i <= rows.length; i++) {
      if (i < rows.length && rows[i] === rows[i - 1] + 1) continue;
      const end = rows[i - 1];
      next[fmtRange({ top: start, bottom: end, left: col, right: col })] = rule;
      start = rows[i];
    }
  }
  dv.model = next;
}

export async function writeXlsx(wb: Workbook): Promise<Buffer> {
  wb.eachSheet((ws) => compactValidations(ws));
  return Buffer.from(await wb.xlsx.writeBuffer());
}
