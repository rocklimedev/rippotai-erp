// Architect site visits → the user's ARCHITECT SITE VISIT SCHEDULE TEMPLATE.xlsx
// ("Architect visit schedule": title bar, project line, Visit No. / Stage / Main
// checks / Visit Type / Remarks). INOS's per-project visit tracking (status,
// dates, architect, findings, hold release) follows in the same cell style.
import { COMPANY_NAME } from '../../common/brand/brand-assets';
import {
  fillTable,
  loadXlsxTemplate,
  wrappedHeight,
  writeXlsx,
} from '../../common/xlsx-template/xlsx-template';

export interface VisitScheduleRow {
  visit_no: number;
  stage: string;
  checks_purpose: string;
  visit_type: string;
  remarks?: string | null;
  visit?: {
    status?: string | null;
    scheduled_date?: string | null;
    visited_date?: string | null;
    architect?: string | null;
    findings?: string | null;
    remarks?: string | null;
    hold_released?: boolean | null;
  } | null;
}

const day = (v?: string | null) =>
  v ? new Date(`${String(v).slice(0, 10)}T00:00:00.000Z`) : null;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v ?? {}));
const EXTRA: Array<[string, number]> = [
  ['Status', 15],
  ['Scheduled', 14],
  ['Visited', 14],
  ['Architect', 20],
  ['Findings', 36],
  ['Hold Released', 12],
];

export async function buildArchitectVisitScheduleWorkbook(data: {
  projectName?: string | null;
  rows: VisitScheduleRow[];
}) {
  const workbook = await loadXlsxTemplate('architect-visit-schedule.xlsx');
  workbook.creator = COMPANY_NAME;
  workbook.created = new Date();
  const ws = workbook.getWorksheet('Architect visit schedule')!;
  // The hidden helper list sheet of the template is not part of the schedule.
  const helper = workbook.getWorksheet('Quality check list ');
  if (helper) workbook.removeWorksheet(helper.id);

  const project = Boolean(data.projectName);
  let lastCol = 5;
  if (project) {
    // Per-project tracking columns, styled like the template's header / body cells.
    EXTRA.forEach(([label, width], k) => {
      const col = 6 + k;
      ws.getColumn(col).width = width;
      ws.getCell(3, col).style = clone(ws.getCell('E3').style);
      ws.getCell(3, col).value = label;
      for (const r of [1, 2])
        ws.getCell(r, col).style = clone(ws.getCell(r, 4).style);
      ws.getCell(4, col).style = clone(ws.getCell('D4').style);
    });
    lastCol = 5 + EXTRA.length;
    for (const r of [1, 2]) {
      ws.unMergeCells(`A${r}:E${r}`);
      ws.getCell(r, lastCol).style = clone(ws.getCell(r, 5).style);
      ws.mergeCells(r, 1, r, lastCol);
    }
    ws.getCell('A2').value = data.projectName;
  }
  const templateRows = 21; // rows 4–24
  fillTable(ws, {
    startRow: 4,
    protoRow: 4,
    templateRows,
    lastCol,
    rows: data.rows.map((row) => {
      const v = row.visit;
      return [
        row.visit_no,
        row.stage,
        row.checks_purpose,
        row.visit_type,
        [row.remarks, v?.remarks].filter(Boolean).join('\n') || null,
        ...(project
          ? [
              v?.status || null,
              day(v?.scheduled_date),
              day(v?.visited_date),
              v?.architect || null,
              v?.findings || null,
              v ? (v.hold_released ? 'Yes' : 'No') : null,
            ]
          : []),
      ];
    }),
  });
  data.rows.forEach((row, i) => {
    const r = 4 + i;
    if (project)
      for (const c of [7, 8]) ws.getCell(r, c).numFmt = 'dd-mmm-yyyy';
    ws.getRow(r).height = Math.max(
      47.25,
      wrappedHeight(
        [
          [row.stage, 31],
          [row.checks_purpose, 51],
          [row.visit?.findings, 36],
        ],
        { line: 15, pad: 8 },
      ),
    );
  });
  // Template rows the data does not use stay as blank ruled rows (like rows 25–29).
  for (let r = 4 + data.rows.length; r < 4 + templateRows; r++)
    for (let c = 1; c <= lastCol; c++) ws.getCell(r, c).value = null;
  if (project)
    Object.assign(ws.pageSetup, {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    });
  return writeXlsx(workbook);
}
