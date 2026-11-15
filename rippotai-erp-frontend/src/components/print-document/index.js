// Rippotai print kit — every client-facing PDF is built with these.
export { default as PrintDocument } from './PrintDocument';
export {
  KV,
  kvHas,
  Pills,
  TextItem,
  RowsHead,
  Row,
  Rows,
  Figure,
  Totals,
  Note,
  SubHead,
  SignOff,
  Terms,
  Stats,
  HtmlTerms,
  htmlToTerms,
  Pill,
} from './primitives';
export {
  has,
  humanize,
  titleCase,
  labelOf,
  fmtDate,
  yesNo,
  num,
  inr,
  money,
  listOf,
  bySort,
  slugify,
  pdfFileName,
} from './format';
export { downloadDocumentPdf, usePdfDownload } from './download';
export { default as DocumentPreview } from './DocumentPreview';
// Word template family (the user's .docx forms) — use with <PrintDocument variant="word">.
export {
  WordCover,
  WSub,
  WIntro,
  WValue,
  WField,
  WFields,
  Box,
  WCheck,
  WChecks,
  WCheckColumns,
  WAnswer,
  WLines,
  WLabelTable,
  WSign,
} from './word';
export { coverRows, padRows, checkedLabels } from './word-helpers';
export { projectPeople, useProjectPeople } from './project-people';
