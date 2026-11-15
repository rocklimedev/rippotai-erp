// Rippotai brand layer for ExcelJS workbooks (docs/BRAND-DOCUMENTS.md → Excel):
// monogram + title/project/date block, green header row with white bold text,
// frozen header, autofilter, ₹ formats, bold totals with a top rule, A4 print setup.
import type { Workbook, Worksheet, Row, Cell, Borders } from 'exceljs';
import { BRAND, COMPANY_NAME, brandLogo } from './brand-assets';

const argb = (hex: string) => `FF${hex.replace('#', '').toUpperCase()}`;
export const XL = {
  green: argb(BRAND.green),
  gold: argb(BRAND.gold),
  ink: argb(BRAND.ink),
  grey: argb(BRAND.grey),
  rule: argb(BRAND.rule),
  ruleSoft: argb(BRAND.ruleSoft),
  fill: argb(BRAND.fill),
  white: argb(BRAND.white),
};
export const XL_FONT = 'Lato';
export const INR_FORMAT = '"₹" #,##0.00';
export const QTY_FORMAT = '#,##0.00';
export const DATE_FORMAT = 'dd-mmm-yyyy';

const soft = { style: 'thin' as const, color: { argb: XL.ruleSoft } };
const hard = { style: 'thin' as const, color: { argb: XL.rule } };
export const BODY_BORDER: Partial<Borders> = {
  top: soft,
  bottom: soft,
  left: soft,
  right: soft,
};

export interface BrandHeader {
  /** Document title, e.g. "Bill of Quantities". */
  title: string;
  /** Project / scope line. */
  project?: string;
  /** Third line: date · reference · revision … (pre-formatted). */
  meta?: string;
  /** Last column of the sheet's table (1-based). */
  lastCol: number;
  /** Last column the project/meta lines may merge to (defaults to lastCol). */
  metaLastCol?: number;
}

/** Today as "10 Nov 2026" (India). */
export const xlToday = () =>
  new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

/** Add the monogram once per workbook and reuse its id on every sheet. */
const imageIds = new WeakMap<Workbook, number>();
export function monogramId(workbook: Workbook): number {
  if (!imageIds.has(workbook)) {
    imageIds.set(
      workbook,
      workbook.addImage({
        buffer: brandLogo('monogram') as any,
        extension: 'png',
      }),
    );
  }
  return imageIds.get(workbook)!;
}

/**
 * Rows 1–3: monogram (column A) + title / project / meta (from column B), thin gold
 * rule under row 3. The caller puts its column header row at 4 or 5.
 */
export function writeBrandHeader(
  workbook: Workbook,
  sheet: Worksheet,
  h: BrandHeader,
) {
  const textCol = h.lastCol > 1 ? 2 : 1;
  const metaLast = Math.max(textCol, h.metaLastCol ?? h.lastCol);
  const lines: Array<[number, string | undefined, any, number]> = [
    [
      1,
      h.title,
      { name: XL_FONT, size: 16, bold: true, color: { argb: XL.green } },
      26,
    ],
    [
      2,
      h.project,
      { name: XL_FONT, size: 11, bold: true, color: { argb: XL.ink } },
      18,
    ],
    [3, h.meta, { name: XL_FONT, size: 10, color: { argb: XL.grey } }, 18],
  ];
  for (const [r, text, font, height] of lines) {
    const last = r === 1 ? Math.max(textCol, h.lastCol) : metaLast;
    if (last > textCol) sheet.mergeCells(r, textCol, r, last);
    const cell = sheet.getCell(r, textCol);
    cell.value = text || null;
    cell.font = font;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(r).height = height;
  }
  for (let c = 1; c <= h.lastCol; c++)
    sheet.getCell(3, c).border = {
      bottom: { style: 'thin', color: { argb: XL.gold } },
    };
  sheet.addImage(monogramId(workbook), {
    tl: { col: 0.12, row: 0.25 },
    ext: { width: 44, height: 46 },
    editAs: 'oneCell',
  });
  sheet.properties.defaultRowHeight = 18;
}

/** Green header row, white bold text, wrapped, centred vertically. */
export function styleHeaderRow(row: Row, fromCol: number, toCol: number) {
  row.height = Math.max(row.height || 0, 30);
  for (let c = fromCol; c <= toCol; c++) {
    const cell = row.getCell(c);
    cell.font = {
      name: XL_FONT,
      size: 10,
      bold: true,
      color: { argb: XL.white },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: XL.green },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: cell.alignment?.horizontal || 'left',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: XL.green } },
      bottom: { style: 'thin', color: { argb: XL.green } },
      left: { style: 'thin', color: { argb: XL.white } },
      right: { style: 'thin', color: { argb: XL.white } },
    };
  }
}

/** Body cell: Lato 10 black, top-aligned, wrapped, light grid. */
export function styleBodyCell(cell: Cell, opts: { numFmt?: string } = {}) {
  cell.font = { name: XL_FONT, size: 10, color: { argb: XL.ink } };
  const numeric = typeof cell.value === 'number';
  cell.alignment = {
    vertical: 'top',
    wrapText: !numeric,
    horizontal: numeric ? 'right' : cell.alignment?.horizontal,
  };
  cell.border = BODY_BORDER;
  if (opts.numFmt) cell.numFmt = opts.numFmt;
  if (cell.value instanceof Date) cell.numFmt = DATE_FORMAT;
}

export function styleBodyRow(
  row: Row,
  fromCol: number,
  toCol: number,
  formats: Record<number, string> = {},
) {
  for (let c = fromCol; c <= toCol; c++)
    styleBodyCell(row.getCell(c), { numFmt: formats[c] });
}

/** Group / category row: bold black on light grey fill. */
export function styleGroupRow(row: Row, fromCol: number, toCol: number) {
  for (let c = fromCol; c <= toCol; c++) {
    const cell = row.getCell(c);
    cell.font = {
      name: XL_FONT,
      size: 10,
      bold: true,
      color: { argb: XL.ink },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: XL.fill },
    };
    cell.alignment = { vertical: 'middle', wrapText: false };
    cell.border = BODY_BORDER;
  }
}

/** Totals row: bold, light fill, top rule; `grand` makes the figure green. */
export function styleTotalsRow(
  row: Row,
  fromCol: number,
  toCol: number,
  {
    grand = false,
    formats = {},
  }: { grand?: boolean; formats?: Record<number, string> } = {},
) {
  for (let c = fromCol; c <= toCol; c++) {
    const cell = row.getCell(c);
    cell.font = {
      name: XL_FONT,
      size: grand ? 11 : 10,
      bold: true,
      color: { argb: grand ? XL.green : XL.ink },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: XL.fill },
    };
    cell.border = {
      top: grand ? { style: 'medium', color: { argb: XL.green } } : hard,
      bottom: hard,
      left: soft,
      right: soft,
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: typeof cell.value === 'number' ? 'right' : 'left',
    };
    if (formats[c]) cell.numFmt = formats[c];
  }
}

/** Freeze above the first data row, add an autofilter on the header row. */
export function freezeAndFilter(
  sheet: Worksheet,
  headerRow: number,
  lastCol: number,
  lastRow: number,
  { xSplit = 0, filter = true } = {},
) {
  sheet.views = [
    {
      state: 'frozen',
      xSplit,
      ySplit: headerRow,
      showGridLines: false,
      zoomScale: 100,
    } as any,
  ];
  if (filter)
    sheet.autoFilter = {
      from: { row: headerRow, column: 1 },
      to: { row: Math.max(headerRow + 1, lastRow), column: lastCol },
    };
}

const colLetter = (n: number) => {
  let s = '';
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26))
    s = String.fromCharCode(65 + ((x - 1) % 26)) + s;
  return s;
};

/** A4, fit to one page wide, header rows repeated, company + page footer. */
export function brandPrint(
  sheet: Worksheet,
  {
    orientation = 'landscape',
    repeatRows,
    lastCol,
    lastRow,
  }: {
    orientation?: 'landscape' | 'portrait';
    repeatRows: string;
    lastCol: number;
    lastRow: number;
  },
) {
  sheet.pageSetup = {
    ...sheet.pageSetup,
    paperSize: 9,
    orientation,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.6,
      bottom: 0.6,
      header: 0.3,
      footer: 0.3,
    },
    printTitlesRow: repeatRows,
    printArea: `A1:${colLetter(lastCol)}${Math.max(lastRow, 1)}`,
  };
  sheet.headerFooter = {
    oddFooter: `&L&"Lato,Regular"&9${COMPANY_NAME}&R&"Lato,Regular"&9Page &P of &N`,
  };
}

/** Column widths in Excel character units. */
export function setWidths(sheet: Worksheet, widths: number[]) {
  widths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));
}
