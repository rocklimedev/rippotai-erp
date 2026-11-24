/**
 * "What is being built right now" for projects in Execution — read from the
 * project's Build (PMC) planner instead of showing the bare word "Execution".
 *
 *   Site preparation · Demolition, Site clearing +4
 *
 * Active = rows marked Due (IN_PROGRESS) or whose start date has arrived and
 * that are not completed. With nothing active, the next unfinished phase is
 * shown. `late` counts unfinished rows whose end date has passed.
 */
import { QueryTypes, Sequelize } from 'sequelize';

export interface ExecutionWork {
  label: string;
  phase: string;
  items: string[];
  late: number;
  upcoming: boolean;
}

interface Row {
  project_id: string;
  phase: string | null;
  phase_order: number | null;
  work_name: string | null;
  details: string | null;
  status: string;
  s: string | null;
  e: string | null;
  sort_order: number | null;
}

export const EXECUTION_PHASE = '08_EXECUTION';

const title = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/(&+-])([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase());

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export function summariseExecution(rows: Row[], today = ymd(new Date())): ExecutionWork | null {
  const open = rows.filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED');
  if (!rows.length) return null;
  if (!open.length) return { label: 'All planned work completed', phase: '', items: [], late: 0, upcoming: false };
  const late = open.filter((r) => r.e && String(r.e).slice(0, 10) < today).length;
  const active = open.filter((r) => r.status === 'IN_PROGRESS' || (r.s && String(r.s).slice(0, 10) <= today));
  const pool = active.length ? active : open;
  const order = (r: Row) => [Number(r.phase_order ?? 9999), Number(r.sort_order ?? 0)];
  pool.sort((a, b) => order(a)[0] - order(b)[0] || order(a)[1] - order(b)[1]);
  const phase = pool[0].phase || 'Execution';
  const inPhase = pool.filter((r) => (r.phase || 'Execution') === phase);
  const names = [
    ...new Set(inPhase.map((r) => r.work_name || r.details).filter((n): n is string => !!n && !!n.trim()).map(title)),
  ];
  const shown = names.slice(0, 2);
  const more = names.length - shown.length;
  const label = `${active.length ? '' : 'Next: '}${title(phase)}${shown.length ? ` · ${shown.join(', ')}${more > 0 ? ` +${more}` : ''}` : ''}`;
  return { label, phase: title(phase), items: names, late, upcoming: !active.length };
}

/** Current Build-planner work per project id (only ids that have a Build planner). */
export async function executionWorkFor(sequelize: Sequelize, projectIds: string[]): Promise<Map<string, ExecutionWork>> {
  const out = new Map<string, ExecutionWork>();
  if (!projectIds.length) return out;
  const rows = await sequelize.query<Row>(
    `SELECT pl.project_id, ph.title AS phase, ph.sort_order AS phase_order, i.work_name, i.details,
            i.status, i.planned_start_date AS s, i.planned_end_date AS e, i.sort_order
       FROM project_planners pl
       JOIN project_planner_items i ON i.planner_id = pl.id AND i.deleted_at IS NULL
       JOIN project_phases ph ON ph.id = i.phase_id AND ph.module = 'PMC'
      WHERE pl.deleted_at IS NULL AND pl.project_id IN (:ids)`,
    { replacements: { ids: projectIds }, type: QueryTypes.SELECT },
  );
  const by = new Map<string, Row[]>();
  rows.forEach((r) => by.set(r.project_id, [...(by.get(r.project_id) || []), r]));
  by.forEach((list, id) => {
    const w = summariseExecution(list);
    if (w) out.set(id, w);
  });
  return out;
}
