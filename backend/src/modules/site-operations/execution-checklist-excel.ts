// QC execution checklists → the user's EXECUTION CHECKLIST TEMPLATE.xlsx:
// "📋 Checklist Index" + one sheet per checklist in the template's step layout
// (title block, Step / Action Item / Specification / Status / Verified By /
// Inspection Date / Remarks, status dropdown and colour rules).
import type { Worksheet } from 'exceljs';
import { COMPANY_NAME } from '../../common/brand/brand-assets';
import {
  cloneSheet,
  copyRowStyle,
  fillTable,
  loadXlsxTemplate,
  wrappedHeight,
  writeXlsx,
} from '../../common/xlsx-template/xlsx-template';

const INDEX = '📋 Checklist Index';
const PROTOTYPE = 'Wall Painting';
const STATUS: Record<string, string> = {
  PASS: 'Verified',
  FAIL: 'Failed',
  NA: 'N/A',
  REWORK: 'Rework',
};
const day = (v?: string | Date | null) => {
  if (!v) return null;
  const d = new Date(v);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

export interface ExecutionChecklistData {
  projectName: string;
  checklists: Array<{
    name: string;
    category?: string | null;
    description?: string | null;
    step?: string | null;
    items: Array<{ text: string; required?: boolean }>;
    signOff?: {
      result: string;
      attempt: number;
      checkedBy?: string | null;
      checkedAt?: string | Date | null;
      notes?: string | null;
      items: Record<number, { result: string; remark?: string | null }>;
    } | null;
  }>;
}

function sheetName(name: string, used: Set<string>) {
  const base =
    name
      .replace(/\s*(QC|Checklist)$/i, '')
      .replace(/[\\/*?:[\]]/g, ' ')
      .trim()
      .slice(0, 31) || 'Checklist';
  let candidate = base;
  for (let i = 2; used.has(candidate.toLowerCase()); i++)
    candidate = `${base.slice(0, 26)} (${i})`;
  used.add(candidate.toLowerCase());
  return candidate;
}

function fillChecklist(
  ws: Worksheet,
  c: ExecutionChecklistData['checklists'][number],
  projectName: string,
) {
  ws.getCell('A1').value = c.name.toUpperCase();
  // Template note row (A17:C17) carries the project / sign-off context.
  const noteStyle = {
    font: { name: 'Lato', size: 9, italic: true, color: { argb: 'FF3F5C52' } },
    alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
  } as any;
  const s = c.signOff;
  const note = [
    `Project: ${projectName}`,
    c.step && `Step: ${c.step}`,
    c.category && `Trade: ${c.category}`,
    s && `QC result: ${STATUS[s.result] || s.result} (attempt ${s.attempt})`,
    s?.notes && `Notes: ${s.notes}`,
    c.description,
  ]
    .filter(Boolean)
    .join('  ·  ');
  // Template rows: 6–15 (10 steps), blank 16, note 17.
  const after = fillTable(ws, {
    startRow: 6,
    protoRow: 7,
    templateRows: 10,
    lastCol: 7,
    rows: c.items.map((item, i) => {
      const r = s?.items[i];
      return [
        `Step ${i + 1}`,
        item.text,
        item.required === false ? 'Optional' : null,
        r ? STATUS[r.result] || r.result : 'Pending',
        r ? s?.checkedBy || null : null,
        r ? day(s?.checkedAt) : null,
        r?.remark || null,
      ];
    }),
  });
  c.items.forEach((item, i) => {
    const row = ws.getRow(6 + i);
    // Banding as in the template: odd steps tinted, even steps white.
    copyRowStyle(ws, i % 2 ? 7 : 6, 6 + i, 7);
    row.height = Math.max(
      30,
      wrappedHeight(
        [
          [item.text, 34],
          [s?.items[i]?.remark, 30],
        ],
        { line: 14, pad: 8 },
      ),
    );
  });
  const noteCell = ws.getCell(after + 1, 1);
  noteCell.value = note;
  noteCell.style = noteStyle;
  ws.getRow(after + 1).height = wrappedHeight([[note, 95]], { line: 12 });
}

export async function buildExecutionChecklistWorkbook(
  data: ExecutionChecklistData,
) {
  const workbook = await loadXlsxTemplate('execution-checklist.xlsx');
  workbook.creator = COMPANY_NAME;
  workbook.created = new Date();
  const index = workbook.getWorksheet(INDEX)!;
  const proto = workbook.getWorksheet(PROTOTYPE)!;
  // Banding prototypes are rows 6 (tinted) and 7 (white); clear sample content.
  for (let r = 6; r <= 15; r++)
    for (let col = 1; col <= 7; col++) proto.getCell(r, col).value = null;
  for (const ws of [...workbook.worksheets])
    if (ws.id !== index.id && ws.id !== proto.id)
      workbook.removeWorksheet(ws.id);

  const used = new Set<string>([INDEX.toLowerCase()]);
  const list = data.checklists;
  const sheets = list.map((_, i) =>
    i === 0 ? proto : cloneSheet(workbook, proto, `exec-${i}`),
  );
  list.forEach((c, i) => {
    sheets[i].name = sheetName(c.name, used);
    fillChecklist(sheets[i], c, data.projectName);
  });
  if (!list.length) workbook.removeWorksheet(proto.id);

  // Index: one row per checklist (+ latest QC result, which INOS records).
  index.getColumn(6).width = 16;
  index.getColumn(7).width = 15;
  for (const [col, label] of [
    [6, 'QC Result'],
    [7, 'Checked On'],
  ] as const) {
    index.getCell(5, col).style = JSON.parse(
      JSON.stringify(index.getCell(5, 5).style),
    );
    index.getCell(5, col).value = label;
  }
  const templateRows = index.rowCount - 5;
  fillTable(index, {
    startRow: 6,
    protoRow: 6,
    templateRows,
    lastCol: 7,
    rows: list.map((c, i) => [
      i + 1,
      c.name,
      c.category || null,
      `${c.items.length} Steps`,
      c.items[0]?.text || c.description || null,
      c.signOff ? STATUS[c.signOff.result] || c.signOff.result : 'Pending',
      day(c.signOff?.checkedAt),
    ]),
  });
  list.forEach((_, i) => {
    copyRowStyle(index, i % 2 ? 7 : 6, 6 + i, 5);
    for (const col of [6, 7])
      index.getCell(6 + i, col).style = JSON.parse(
        JSON.stringify(index.getCell(6 + i, 4).style),
      );
    index.getCell(6 + i, 7).numFmt = 'd-mmm-yy';
  });
  for (let r = 6 + list.length; r <= 5 + templateRows; r++)
    for (let col = 1; col <= 7; col++) {
      index.getCell(r, col).value = null;
      index.getCell(r, col).style = {};
    }
  index.unMergeCells('A1:E4');
  for (let col = 6; col <= 7; col++)
    for (let r = 1; r <= 4; r++)
      index.getCell(r, col).style = JSON.parse(
        JSON.stringify(index.getCell(r, 5).style),
      );
  index.mergeCells('A1:G4');
  const note = index.getCell(7 + list.length, 1);
  note.value = `Project: ${data.projectName}`;
  note.style = {
    font: { name: 'Lato', size: 9, italic: true, color: { argb: 'FF3F5C52' } },
  };
  return writeXlsx(workbook);
}
