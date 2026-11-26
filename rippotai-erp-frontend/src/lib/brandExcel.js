// Rippotai brand layer for browser-built ExcelJS workbooks (docs/BRAND-DOCUMENTS.md → Excel).
// Mirrors backend/src/common/brand/excel-brand.ts: monogram + title / project / date block,
// green header row with white bold text, frozen header, autofilter, ₹ formats,
// bold totals with a top rule, A4 fit-to-width print setup with repeated header row.
import monogramUrl from '@/assets/brand/rippotai-monogram.png';
import { downloadName } from './download-name.js';

export const XL = {
  green: 'FF0D3D2F',
  gold: 'FFD9B061',
  ink: 'FF1A1A1A',
  grey: 'FF4D4D4D',
  rule: 'FF8C8C8C',
  ruleSoft: 'FFBDBDBD',
  fill: 'FFF2F2F2',
  white: 'FFFFFFFF',
};
export const XL_FONT = 'Lato';
export const INR_FORMAT = '"₹" #,##0.00';
export const QTY_FORMAT = '#,##0.###';
export const AREA_FORMAT = '#,##0.00';
export const DATE_FORMAT = 'dd-mmm-yyyy';
const COMPANY = 'Rippotai Architecture';

const soft = { style: 'thin', color: { argb: XL.ruleSoft } };
const hard = { style: 'thin', color: { argb: XL.rule } };
export const BODY_BORDER = { top: soft, bottom: soft, left: soft, right: soft };

export const xlToday = () =>
  new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

let monogramBase64;
/** Add the official monogram to a workbook; resolves to its image id (null if unavailable). */
export async function addMonogram(workbook) {
  try {
    if (!monogramBase64) {
      const blob = await (await fetch(monogramUrl)).blob();
      monogramBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    return workbook.addImage({ base64: monogramBase64, extension: 'png' });
  } catch {
    return null;
  }
}

/**
 * Rows 1–3: monogram (column A) + title / project / meta from column B, thin gold rule under
 * row 3. Put the column header row at 5 (row 4 is a spacer).
 */
export function writeBrandHeader(sheet, { title, project, meta, lastCol, imageId }) {
  const textCol = lastCol > 1 ? 2 : 1;
  const lines = [
    [1, title, { name: XL_FONT, size: 16, bold: true, color: { argb: XL.green } }, 26],
    [2, project, { name: XL_FONT, size: 11, bold: true, color: { argb: XL.ink } }, 18],
    [3, meta, { name: XL_FONT, size: 10, color: { argb: XL.grey } }, 18],
  ];
  for (const [r, text, font, height] of lines) {
    if (lastCol > textCol) sheet.mergeCells(r, textCol, r, lastCol);
    const cell = sheet.getCell(r, textCol);
    cell.value = text || null;
    cell.font = font;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(r).height = height;
  }
  for (let c = 1; c <= lastCol; c++)
    sheet.getCell(3, c).border = { bottom: { style: 'thin', color: { argb: XL.gold } } };
  sheet.getRow(4).height = 8;
  if (imageId != null)
    sheet.addImage(imageId, {
      tl: { col: 0.12, row: 0.25 },
      ext: { width: 44, height: 46 },
      editAs: 'oneCell',
    });
}

export function styleHeaderRow(row, fromCol, toCol, { right = [] } = {}) {
  row.height = Math.max(row.height || 0, 30);
  for (let c = fromCol; c <= toCol; c++) {
    const cell = row.getCell(c);
    cell.font = { name: XL_FONT, size: 10, bold: true, color: { argb: XL.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.green } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: right.includes(c) ? 'right' : 'left',
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

export function styleBodyRow(row, fromCol, toCol, formats = {}) {
  for (let c = fromCol; c <= toCol; c++) {
    const cell = row.getCell(c);
    const numeric = typeof cell.value === 'number';
    cell.font = { name: XL_FONT, size: 10, color: { argb: XL.ink } };
    cell.alignment = {
      vertical: 'top',
      wrapText: !numeric,
      horizontal: numeric ? 'right' : undefined,
    };
    cell.border = BODY_BORDER;
    if (formats[c]) cell.numFmt = formats[c];
    if (cell.value instanceof Date) cell.numFmt = DATE_FORMAT;
  }
}

/** Section row: bold black on light grey (merged across when asked). */
export function styleGroupRow(row, fromCol, toCol) {
  for (let c = fromCol; c <= toCol; c++) {
    const cell = row.getCell(c);
    cell.font = { name: XL_FONT, size: 10, bold: true, color: { argb: XL.ink } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.fill } };
    cell.alignment = { vertical: 'middle' };
    cell.border = BODY_BORDER;
  }
}

export function styleTotalsRow(row, fromCol, toCol, formats = {}) {
  for (let c = fromCol; c <= toCol; c++) {
    const cell = row.getCell(c);
    cell.font = { name: XL_FONT, size: 10, bold: true, color: { argb: XL.ink } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.fill } };
    cell.border = {
      top: { style: 'medium', color: { argb: XL.green } },
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

const colLetter = (n) => {
  let s = '';
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26))
    s = String.fromCharCode(65 + ((x - 1) % 26)) + s;
  return s;
};

/** Frozen header, autofilter, A4 fit-to-width, repeated header row, company + page footer. */
export function finishSheet(
  sheet,
  { headerRow, lastCol, lastRow, orientation = 'landscape', filterTo },
) {
  sheet.views = [{ state: 'frozen', ySplit: headerRow, showGridLines: false }];
  sheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: Math.max(headerRow + 1, filterTo ?? lastRow), column: lastCol },
  };
  sheet.pageSetup = {
    paperSize: 9,
    orientation,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    printTitlesRow: `${headerRow}:${headerRow}`,
    printArea: `A1:${colLetter(lastCol)}${Math.max(lastRow, headerRow + 1)}`,
  };
  sheet.headerFooter = {
    oddFooter: `&L&"Lato,Regular"&9${COMPANY}&R&"Lato,Regular"&9Page &P of &N`,
  };
}

export function setWidths(sheet, widths) {
  widths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));
}

/** Save a workbook from the browser. */
export async function saveWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  // Plain ASCII dashes: some browsers fall back to "download" for names with typographic dashes.
  link.download = downloadName([fileName], 'export.xlsx', 'Workbook');
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CSV text for Excel: UTF-8 BOM, CRLF, quoted only when needed, numbers left raw. */
export function toCsv(rows) {
  const cell = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
    let t = String(v).trim();
    if (t === '-' || t === '—') return ''; // empty-value placeholders
    if (/^[=+\-@\t\r]/.test(t) && !/^[+-]?\d/.test(t)) t = `'${t}`;
    return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return '\uFEFF' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}
