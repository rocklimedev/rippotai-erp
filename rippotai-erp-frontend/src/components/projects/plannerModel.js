import { workbookRows } from './plannerWorkbookFormat';

export const PLANNER_VIEWS = ['Design', 'Build', 'Procurement'];

/** Old sheet names (links, saved URLs) → new planners. */
export function normalizeView(v) {
  const s = String(v || '').toLowerCase();
  if (s.startsWith('build') || s === 'pmc') return 'Build';
  if (s.startsWith('procure') || s.startsWith('vendor')) return 'Procurement';
  return 'Design';
}

export const VIEW_MODULE = { Design: 'CONSULTANCY', Build: 'PMC' };

export const VIEW_COLUMNS = {
  Design: { a: 'PHASE', b: 'DRAWINGS & DESIGN', c: 'DETAILS' },
  Build: { a: 'PHASE', b: 'WORK', c: 'DETAILS' },
  Procurement: { a: 'LABOUR CONTRACTOR', b: 'MATERIAL VENDOR', c: 'VENDOR NAME & PHASE' },
};

export const STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'IN_PROGRESS', label: 'Due' },
  { value: 'NOT_STARTED', label: 'Pending' },
];

const today = () => new Date().toISOString().slice(0, 10);
const dateOnly = (d) => (d ? String(d).slice(0, 10) : '');

/**
 * Display state of a row:
 *  { key: completed|late|due|pending, label, date, auto, planned }
 */
export function rowState(item, now = today()) {
  const planned = dateOnly(item.planned_end_date);
  const evidence = item.evidence?.date ? item.evidence : null;
  if (item.status === 'COMPLETED' || evidence) {
    const done = dateOnly(item.actual_end_date) || evidence?.date || planned;
    return {
      key: 'completed',
      label: 'Completed',
      date: item.status === 'COMPLETED' ? planned || done : evidence.date,
      doneOn: done,
      auto: item.status !== 'COMPLETED' && !!evidence,
      evidence,
      planned,
    };
  }
  if (planned && planned < now) return { key: 'late', label: 'Late', date: planned, planned };
  if (item.status === 'IN_PROGRESS') return { key: 'due', label: 'Due', date: planned, planned };
  return { key: 'pending', label: 'Pending', date: planned, planned };
}

/** The planner that owns the rows (the PROJECT planner; older projects may have split planners). */
export function mainPlanner(overview) {
  const planners = overview?.planners || [];
  return planners.find((p) => p.type === 'PROJECT') || planners[0] || null;
}

/** Rows of one planner view, without the duplicate rows of legacy split planners. */
export function viewRows(overview, view) {
  const planners = overview?.planners || [];
  if (view === 'Procurement') {
    const owner =
      planners.find((p) => p.type === 'PROJECT' && p.procurement_items?.length) ||
      planners.find((p) => p.procurement_items?.length);
    return [...(owner?.procurement_items || [])].sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
    );
  }
  const module = VIEW_MODULE[view];
  const has = (p) => (p.items || []).some((i) => i.phase?.module === module);
  const owner = planners.find((p) => p.type === 'PROJECT' && has(p)) || planners.find(has);
  return owner ? workbookRows([owner]).filter((i) => i.phase?.module === module) : [];
}

/** Counts for a summary line. */
export function viewCounts(rows) {
  const c = { completed: 0, late: 0, due: 0, pending: 0 };
  rows.forEach((r) => (c[rowState(r).key] += 1));
  return c;
}

/** Execution = the Build planner's work, each with its state (completed / late / due / pending). */
export function executionTasks(overview) {
  return viewRows(overview, 'Build').map((r) => ({ ...r, st: rowState(r) }));
}
