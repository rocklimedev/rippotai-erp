// Helpers shared by the sheet documents (see sheet.jsx).
import sheetLogo from '../../assets/templates/rippotai-sheet-logo.png';

/** Logo artwork embedded in the original PO / WO / DC sheets (xl/media/image1.png). */
export const SHEET_LOGO = sheetLogo;
export const PT_PER_PX = 0.75;

/** "" for empty values, otherwise the trimmed string. */
export const txt = (v) => (v === null || v === undefined ? '' : String(v).trim());

/** Text placed by its PDF "top" (pdfplumber) — Lato's baseline sits 0.787·size below it. */
export const at = (top, size) => top - 0.1 * size;

/** Pad a row list to the template's minimum number of (numbered) rows. */
export function padRows(rows, min) {
  const out = [...rows];
  for (let n = rows.length; n < min; n += 1) out.push(null);
  return out;
}

/** Amounts as the sheets print them: Indian grouping, 2 decimals, no currency sign. */
export const amt = (v) => {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** Sheet date style (e.g. 20-Sep-26 for the estimate; 28 Oct 2026 elsewhere). */
export const sheetDate = (v, style = 'long') => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return txt(v);
  const m = d.toLocaleString('en-GB', { month: 'short' });
  if (style === 'dmy') return `${d.getDate()}-${m}-${String(d.getFullYear()).slice(2)}`;
  return `${String(d.getDate()).padStart(2, '0')} ${m} ${d.getFullYear()}`;
};
