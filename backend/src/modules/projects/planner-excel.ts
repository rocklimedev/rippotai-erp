// Project planner workbook = the user's PROJECT PLANNER TEMPLATE.xlsx filled with
// INOS data: EXECUTION PLANNER (PMC work), CONSULTANCY PLANNER (drawing list),
// PROCUREMENT PLANNER (tender tracker, labour) and PROCUREMENT SCHEDULE
// (material procurement list). Section rows (A, B, C …) are the planner phases;
// row styles, banding, formulas, dropdowns and colour rules are the template's.
import type { Worksheet } from 'exceljs';
import { COMPANY_NAME } from '../../common/brand/brand-assets';
import {
  insertRows,
  loadXlsxTemplate,
  wrappedHeight,
  writeXlsx,
} from '../../common/xlsx-template/xlsx-template';
import { sortWorkbookItems } from './planner-workbook';

type Value = unknown;
interface Section {
  title: string;
  rows: Array<{ values: Record<string, Value>; height?: number }>;
}

const FIRST = 5; // first section row in every template sheet
const SECTION_PROTO = 5;
const date = (v?: string | null) =>
  v ? new Date(`${String(v).slice(0, 10)}T00:00:00.000Z`) : null;
const days = (a?: string | null, b?: string | null, inclusive = true) => {
  const s = date(a);
  const e = date(b);
  if (!s || !e) return null;
  return Math.round((+e - +s) / 86400000) + (inclusive ? 1 : 0);
};
const addDays = (d: Date | null, n: number | null) =>
  d && n !== null ? new Date(+d + n * 86400000) : null;
const letter = (i: number): string =>
  i < 26
    ? String.fromCharCode(65 + i)
    : letter(Math.floor(i / 26) - 1) + letter(i % 26);
// Some seeded rows carry the literal text "NULL" for an empty value.
const text = (v: unknown) =>
  v === null || v === undefined || v === '' || v === 'NULL' ? null : v;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v ?? {}));

const EXEC_STATUS: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Done',
  ON_HOLD: 'On Hold',
  NOT_APPLICABLE: 'N/A',
};
const DRAWING_STATUS: Record<string, string> = {
  NOT_STARTED: 'Required',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  NOT_APPLICABLE: 'N/A',
};
const TENDER_STATUS: Record<string, string> = {
  NOT_STARTED: 'Pending',
  IN_PROGRESS: 'Negotiation',
  COMPLETED: 'Awarded',
  ON_HOLD: 'On Hold',
  NOT_APPLICABLE: 'N/A',
};
const LOCATION_STATUS: Record<string, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Done',
  ON_HOLD: 'On hold',
  NOT_APPLICABLE: 'N/A',
};

/** Extra INOS columns (absent from the template) in the template header style. */
function addColumns(
  ws: Worksheet,
  lastTemplateCol: number,
  columns: Array<[string, number]>,
) {
  columns.forEach(([label, width], k) => {
    const col = lastTemplateCol + 1 + k;
    ws.getColumn(col).width = width;
    ws.getCell(4, col).style = clone(ws.getCell(4, lastTemplateCol).style);
    ws.getCell(4, col).value = label;
    for (const r of [2, 3, SECTION_PROTO, FIRST + 1, FIRST + 2])
      ws.getCell(r, col).style = clone(ws.getCell(r, lastTemplateCol).style);
    if (ws.getCell(1, lastTemplateCol).isMerged || ws.getCell(1, 1).isMerged) {
      // Title bar spans the full table width.
      ws.unMergeCells(1, 1, 1, lastTemplateCol);
      ws.getCell(1, col).style = clone(ws.getCell(1, lastTemplateCol).style);
      ws.mergeCells(1, 1, 1, col);
    }
  });
}

/**
 * Rewrites the table body (row 5 → end) of a template sheet: section rows use
 * the template's row 5, items use row 6 (even rows, tinted) / row 7 (odd rows,
 * white) exactly like the template's banding. Rows grow / shrink to the data.
 */
function writeSections(
  ws: Worksheet,
  sections: Section[],
  opts: {
    lastCol: number;
    titleCol: string;
    formulas?: (
      row: number,
    ) => Record<string, { formula: string; result?: Value }>;
  },
) {
  const templateLast = ws.rowCount;
  const templateRows = templateLast - FIRST + 1;
  const total = sections.reduce((n, s) => n + 1 + s.rows.length, 0);
  // Keep prototypes before anything moves.
  const proto = (r: number) =>
    Array.from({ length: opts.lastCol }, (_, c) =>
      clone(ws.getCell(r, c + 1).style),
    );
  const sectionStyle = proto(SECTION_PROTO);
  const evenStyle = proto(FIRST + 1);
  const oddStyle = proto(FIRST + 2);
  const sectionHeight = ws.getRow(SECTION_PROTO).height;
  const itemHeight = ws.getRow(FIRST + 1).height;
  const dv = (ws as any).dataValidations;
  const protoDv = Array.from({ length: opts.lastCol }, (_, c) =>
    dv.find(ws.getCell(FIRST + 1, c + 1).address),
  );
  if (total > templateRows) insertRows(ws, templateLast, total - templateRows);
  else
    // Rows the data does not need are cleared (ExcelJS spliceRows does not
    // remove trailing rows).
    for (let r = FIRST + total; r <= templateLast; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= opts.lastCol; c++) {
        const cell = row.getCell(c);
        cell.value = null;
        cell.style = {};
        dv.remove(cell.address);
      }
      row.height = undefined as any;
    }

  let r = FIRST;
  sections.forEach((section, si) => {
    const row = ws.getRow(r);
    row.height = sectionHeight;
    sectionStyle.forEach((style, c) => {
      const cell = row.getCell(c + 1);
      cell.style = clone(style);
      cell.value = null;
      dv.remove(cell.address);
    });
    row.getCell(1).value = letter(si);
    ws.getCell(`${opts.titleCol}${r}`).value = section.title.toUpperCase();
    r++;
    section.rows.forEach((item, i) => {
      const row = ws.getRow(r);
      row.height = item.height ?? itemHeight;
      (r % 2 === 0 ? evenStyle : oddStyle).forEach((style, c) => {
        const cell = row.getCell(c + 1);
        cell.style = clone(style);
        cell.value = null;
        if (protoDv[c]) dv.add(cell.address, protoDv[c]);
        else dv.remove(cell.address);
      });
      row.getCell(1).value = i + 1;
      for (const [col, value] of Object.entries(item.values))
        ws.getCell(`${col}${r}`).value = (value ?? null) as any;
      for (const [col, f] of Object.entries(opts.formulas?.(r) ?? {}))
        ws.getCell(`${col}${r}`).value = f as any;
      r++;
    });
  });
}

const projectLine = (ws: Worksheet, name: string) => {
  ws.getCell('B2').value = name;
};

export async function buildPlannerWorkbook(
  overview: {
    project: { name: string };
    planners: any[];
    locations: any[];
  },
  userNames: Record<string, string> = {},
) {
  const workbook = await loadXlsxTemplate('project-planner.xlsx');
  workbook.creator = COMPANY_NAME;
  workbook.created = new Date();
  // Excel recomputes the template's formulas (phase, end / delivery dates).
  (workbook as any).calcProperties = { fullCalcOnLoad: true };

  const byType = (type: string) =>
    overview.planners.filter((p) => !p.type || p.type === type);
  const items = (type: string, module: string) =>
    sortWorkbookItems(
      byType(type)
        .flatMap((p) => p.items || [])
        .filter((i: any) => i.phase?.module === module),
    );
  const locationNames = new Map<string, string>();
  const walk = (list: any[]) =>
    list.forEach((l) => {
      locationNames.set(l.id, l.name);
      walk(l.children || []);
    });
  walk(overview.locations || []);
  const locationStatus = (item: any) =>
    (item.locations || [])
      .map(
        (l: any) =>
          `${locationNames.get(l.location_id) || l.location?.name || 'Location'}: ${
            LOCATION_STATUS[l.status] || l.status || ''
          }`,
      )
      .join('\n') || null;
  const activity = (i: any) =>
    [text(i.work_name) || i.document_type?.name, text(i.details)]
      .filter(Boolean)
      .join(' — ') || null;
  const groupByPhase = (list: any[], row: (i: any) => Section['rows'][0]) => {
    const sections: Section[] = [];
    for (const item of list) {
      const title = item.phase?.title || 'General';
      let s = sections[sections.length - 1];
      if (!s || s.title !== title) sections.push((s = { title, rows: [] }));
      s.rows.push(row(item));
    }
    return sections;
  };

  // ---------------------------------------------------------------- EXECUTION
  const exec = workbook.getWorksheet('EXECUTION PLANNER')!;
  projectLine(exec, overview.project.name);
  const pmc = items('PMC', 'PMC').length
    ? items('PMC', 'PMC')
    : items('PROJECT', 'PMC');
  const starts = pmc
    .map((i: any) => i.planned_start_date)
    .filter(Boolean)
    .sort();
  const projectStart =
    byType('PROJECT')[0]?.planned_start_date || starts[0] || null;
  exec.getCell('F2').value = date(projectStart);
  addColumns(exec, 14, [['Location Status', 26]]);
  const phase1 = exec.getCell('H2').value as Date | null;
  const phase2 = exec.getCell('J2').value as Date | null;
  const phaseOf = (end: Date | null) =>
    !end
      ? ''
      : phase1 && end <= phase1
        ? 'Phase 1'
        : phase2 && end <= phase2
          ? 'Phase 2'
          : 'Phase 3';
  const execRows = new Map<number, any>();
  const execSections = groupByPhase(pmc, (i) => ({
    values: {
      D: activity(i),
      E: days(i.planned_start_date, i.planned_end_date),
      F: date(i.planned_start_date),
      H: days(i.actual_start_date, i.actual_end_date),
      I: date(i.actual_start_date),
      L: EXEC_STATUS[i.status] || i.status || null,
      M: (i.assigned_to && userNames[i.assigned_to]) || null,
      N: text(i.remarks),
      O: locationStatus(i),
      _item: i,
    },
    height: wrappedHeight(
      [
        [activity(i), 58],
        [i.remarks, 28],
        [locationStatus(i), 26],
      ],
      { min: 24, line: 13 },
    ),
  }));
  execSections.forEach((s) =>
    s.rows.forEach((r) => {
      const item = (r.values as any)._item;
      delete (r.values as any)._item;
      execRows.set(execRows.size, item);
    }),
  );
  let execIndex = 0;
  writeSections(exec, execSections, {
    lastCol: 15,
    titleCol: 'D',
    formulas: (row) => {
      const item = execRows.get(execIndex++);
      const end = addDays(
        date(item?.planned_start_date),
        days(item?.planned_start_date, item?.planned_end_date),
      );
      const plannedEnd = end ? addDays(end, -1) : null;
      const actualEnd =
        item?.actual_start_date && item?.actual_end_date
          ? date(item.actual_end_date)
          : null;
      return {
        C: {
          formula: `IF(G${row}="","",IF(AND($H$2<>"",G${row}<=$H$2),"Phase 1",IF(AND($J$2<>"",G${row}<=$J$2),"Phase 2","Phase 3")))`,
          result: phaseOf(plannedEnd),
        },
        G: {
          formula: `IF(OR(E${row}="",F${row}=""),"",F${row}+E${row}-1)`,
          result: plannedEnd ?? '',
        },
        J: {
          formula: `IF(OR(H${row}="",I${row}=""),"",I${row}+H${row}-1)`,
          result: actualEnd ?? '',
        },
      };
    },
  });

  // -------------------------------------------------------------- CONSULTANCY
  const drawings = workbook.getWorksheet('CONSULTANCY PLANNER')!;
  projectLine(drawings, overview.project.name);
  const consultancy = items('CONSULTANCY', 'CONSULTANCY').length
    ? items('CONSULTANCY', 'CONSULTANCY')
    : items('PROJECT', 'CONSULTANCY');
  const documents = [
    ...items('CONSULTANCY', 'DOCUMENTS'),
    ...items('PROJECT', 'DOCUMENTS'),
  ];
  addColumns(drawings, 5, [
    ['Planned Start', 14],
    ['Planned End', 14],
    ['Started On', 14],
    ['Completed On', 14],
    ['Location Status', 26],
  ]);
  for (const col of [6, 7, 8, 9])
    for (const r of [SECTION_PROTO + 1, SECTION_PROTO + 2])
      drawings.getCell(r, col).numFmt = drawings.getCell(r, 4).numFmt;
  writeSections(
    drawings,
    groupByPhase([...consultancy, ...documents], (i) => ({
      values: {
        B: activity(i),
        C: DRAWING_STATUS[i.status] || i.status || null,
        E: text(i.remarks),
        F: date(i.planned_start_date),
        G: date(i.planned_end_date),
        H: date(i.actual_start_date),
        I: date(i.actual_end_date),
        J: locationStatus(i),
      },
      height: wrappedHeight(
        [
          [activity(i), 54],
          [i.remarks, 30],
          [locationStatus(i), 26],
        ],
        { min: 24, line: 13 },
      ),
    })),
    { lastCol: 10, titleCol: 'B' },
  );

  // ---------------------------------------------------------- PROCUREMENT
  const procurement = overview.planners
    .flatMap((p) => p.procurement_items || [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order);
  const vendorName = (i: any) => i.vendor_name || i.vendor?.name || null;

  const tender = workbook.getWorksheet('PROCUREMENT PLANNER')!;
  projectLine(tender, overview.project.name);
  addColumns(tender, 8, [
    ['Start', 13],
    ['End', 13],
  ]);
  for (const col of [9, 10])
    for (const r of [SECTION_PROTO + 1, SECTION_PROTO + 2])
      tender.getCell(r, col).numFmt = tender.getCell(r, 4).numFmt;
  const labour = procurement.filter((i: any) => i.item_type === 'LABOUR');
  writeSections(
    tender,
    [
      {
        title: 'CONTRACTORS / VENDORS',
        rows: labour.map((i: any) => {
          const d = days(i.planned_start_date, i.planned_end_date);
          return {
            values: {
              B: i.category_name,
              D: date(i.estimate_finalised_at),
              E: TENDER_STATUS[i.status] || i.status || null,
              F: vendorName(i),
              G: d === null ? null : `${d} days`,
              H: text(i.remarks),
              I: date(i.planned_start_date),
              J: date(i.planned_end_date),
            },
          };
        }),
      },
    ],
    { lastCol: 10, titleCol: 'B' },
  );

  const schedule = workbook.getWorksheet('PROCUREMENT SCHEDULE')!;
  projectLine(schedule, overview.project.name);
  addColumns(schedule, 8, [
    ['Vendor', 24],
    ['Start', 13],
    ['End', 13],
  ]);
  for (const col of [10, 11])
    for (const r of [SECTION_PROTO + 1, SECTION_PROTO + 2])
      schedule.getCell(r, col).numFmt = schedule.getCell(r, 3).numFmt;
  const materials = procurement.filter((i: any) => i.item_type !== 'LABOUR');
  const materialRows = materials.map((i: any) => {
    const lead = days(i.purchase_date, i.received_at_site_date, false);
    const status = i.received_at_site_date
      ? 'Delivered'
      : i.purchase_date
        ? 'Ordered'
        : i.estimate_finalised_at
          ? 'Finalised'
          : i.status === 'COMPLETED'
            ? 'Delivered'
            : 'Pending';
    return { item: i, lead, status };
  });
  let m = 0;
  writeSections(
    schedule,
    [
      {
        title: 'MATERIALS',
        rows: materialRows.map(({ item: i, lead, status }) => ({
          values: {
            B: i.category_name,
            C: date(i.estimate_finalised_at),
            D: date(i.purchase_date),
            E: lead,
            G: status,
            H: text(i.remarks),
            I: vendorName(i),
            J: date(i.planned_start_date),
            K: date(i.planned_end_date),
          },
        })),
      },
    ],
    {
      lastCol: 11,
      titleCol: 'B',
      formulas: (row) => {
        const entry = materialRows[m++];
        const received = date(entry?.item.received_at_site_date);
        // Delivery = order + lead time (template formula); a delivery recorded
        // without an order date is written as the date itself.
        if (received && !entry?.item.purchase_date)
          return { F: { formula: '', result: received } };
        return {
          F: {
            formula: `IF(OR(D${row}="",E${row}=""),"",D${row}+E${row})`,
            result: received ?? '',
          },
        };
      },
    },
  );
  // Plain date for deliveries without an order date (no formula).
  schedule.eachRow((row) => {
    const cell = row.getCell(6);
    const v: any = cell.value;
    if (v && typeof v === 'object' && v.formula === '') cell.value = v.result;
  });
  return writeXlsx(workbook);
}
