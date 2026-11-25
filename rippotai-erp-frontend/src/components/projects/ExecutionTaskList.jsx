// Execution = one phase; its list is the work (tasks) of the Build project planner.
// Each task: Completed (done) · Late (end date passed, not done) · Upcoming.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { executionTasks } from './plannerModel';
import './project-documents-board.css';

const fmt = (d) =>
  d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';
const tidy = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bAnd\b/g, 'and');
const real = (s) => (s && String(s).trim().toUpperCase() !== 'NULL' ? s : '');

const STATE = {
  completed: { label: 'Completed', cls: 'is-completed' },
  late: { label: 'Late', cls: 'is-late' },
  due: { label: 'Upcoming', cls: 'is-upcoming' },
  pending: { label: 'Upcoming', cls: 'is-upcoming' },
};

export default function ExecutionTaskList({ overview, projectId }) {
  const tasks = useMemo(() => executionTasks(overview), [overview]);
  if (!tasks.length)
    return (
      <p className="cc-muted" style={{ margin: '4px 0 12px' }}>
        No execution work in the Build planner yet.{' '}
        {projectId && <Link to={`/projects/planner/create?projectId=${projectId}&view=Build`}>Plan the work</Link>}
      </p>
    );
  const counts = tasks.reduce((m, t) => ({ ...m, [STATE[t.st.key].label]: (m[STATE[t.st.key].label] || 0) + 1 }), {});
  return (
    <div className="pdb-exec" data-testid="execution-tasks">
      <div className="pdb-exec__head">
        <span>Execution work · from the Build planner</span>
        <span className="cc-muted">
          {['Completed', 'Late', 'Upcoming']
            .filter((k) => counts[k])
            .map((k) => `${counts[k]} ${k.toLowerCase()}`)
            .join(' · ')}
        </span>
      </div>
      <table className="pdb-exec__table">
        <thead>
          <tr>
            <th>#</th>
            <th>Work</th>
            <th>Start – End</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => {
            const s = STATE[t.st.key];
            const name = real(t.work_name) || real(t.details) || 'Untitled work';
            return (
              <tr key={t.id} className={s.cls}>
                <td className="pdb-exec__no">{i + 1}</td>
                <td>
                  <span className="pdb-exec__work">{tidy(name)}</span>
                  {t.phase?.title && <span className="pdb-exec__phase">{tidy(t.phase.title)}</span>}
                </td>
                <td className="pdb-exec__dates">
                  {t.planned_start_date || t.planned_end_date
                    ? `${fmt(t.planned_start_date) || '—'} – ${fmt(t.planned_end_date) || '—'}`
                    : 'No dates'}
                </td>
                <td>
                  <span className="pdb-exec__state">
                    {s.label}
                    {t.st.key === 'completed' && t.st.doneOn ? ` · ${fmt(t.st.doneOn)}` : ''}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
