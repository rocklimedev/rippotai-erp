export const WORKBOOK_VIEWS = [
  "Overview",
  "Consultancy",
  "Vendor & Procurement",
  "PMC",
];
const PHASES = [
  "PRE-DESIGN",
  "DESIGN",
  "MATERIAL SELECTION",
  "TENDER DRAWINGS",
  "WORKING DRAWINGS",
  "SITE PREPRATION",
  "CIVIL WORK",
  "FIT OUTS",
  "FINISHING",
  "SNAG & HANDOVER",
];
const phaseOrder = (phase) => {
  const rank = PHASES.indexOf(phase?.title);
  return rank === -1 ? 100 + Number(phase?.sort_order || 0) : rank;
};
export function workbookRows(planners = []) {
  return planners
    .flatMap((p) => p.items || [])
    .sort(
      (a, b) =>
        String(a.phase?.module || "").localeCompare(
          String(b.phase?.module || ""),
        ) ||
        phaseOrder(a.phase) - phaseOrder(b.phase) ||
        Number(a.sort_order || 0) - Number(b.sort_order || 0),
    );
}
