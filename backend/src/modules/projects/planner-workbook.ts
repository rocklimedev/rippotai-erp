import { WORKBOOK_TEMPLATE } from './planner-workbook-template';
const phases = [
  ...new Set(WORKBOOK_TEMPLATE.tasks.map((t) => `${t.module}:${t.phase}`)),
];
const phaseOrder = (phase?: {
  module?: string;
  title?: string;
  sort_order?: number;
}) => {
  const rank = phases.indexOf(`${phase?.module}:${phase?.title}`);
  return rank === -1 ? 100 + Number(phase?.sort_order || 0) : rank;
};

export const plannerStatusLabel = (status?: string) =>
  status ? status.toLowerCase().replace(/_/g, ' ') : '';

/** Stable ordering shared by the workbook API and Excel export. */
export function sortWorkbookItems<
  T extends {
    sort_order?: number;
    phase?: { sort_order?: number; module?: string; title?: string };
  },
>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      String(a.phase?.module || '').localeCompare(
        String(b.phase?.module || ''),
      ) ||
      phaseOrder(a.phase) - phaseOrder(b.phase) ||
      Number(a.sort_order || 0) - Number(b.sort_order || 0),
  );
}
