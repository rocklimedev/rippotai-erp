// Project Overview "Recent activity": latest ~8 events of the project
// (documents created / updated / reviewed, uploads, project changes), each
// with a direct link to the record.
import { Link } from 'react-router-dom';
import { Card, StatusPill } from '@/components/inos';
import { useGetProjectRecentActivityQuery } from '@/api/doc-flow/record-context.api';
import { docCode, docMeta, fmtDayTime, viewPath } from './codes';
import './record-context.css';

const REVIEW_PAST = {
  approve: 'approved',
  revise: 'returned for revision',
  reject: 'rejected',
  archive: 'archived',
};
const vLabel = (v) => (v == null || v === '' ? '' : /^\d+$/.test(String(v)) ? ` v${v}` : ` ${v}`);

function describe(e) {
  const meta = docMeta(e.type);
  const code = docCode(e.number);
  const upload = e.type === 'document' || e.type === 'drawing';
  const tag = meta.short || meta.label;
  const name = upload
    ? e.title || code || meta.label
    : code
      ? e.number && code.startsWith(meta.prefix || '\u0000')
        ? code
        : `${tag} ${code}`
      : e.title || meta.label;
  switch (e.kind) {
    case 'review':
      return `${name}${vLabel(e.version)} ${REVIEW_PAST[e.action] || e.action}`;
    case 'uploaded':
      return `${name}${vLabel(e.version)} uploaded`;
    case 'updated':
      return `${name} updated`;
    case 'project':
      return String(e.action || 'Project updated')
        .replace(/_/g, ' ')
        .replace(/^\w/, (m) => m.toUpperCase());
    default:
      return `${name} created`;
  }
}

export default function RecentActivity({ projectId, limit = 8 }) {
  const { data, isLoading, isError } = useGetProjectRecentActivityQuery(
    { projectId, limit },
    { skip: !projectId },
  );
  const events = Array.isArray(data) ? data : [];
  return (
    <Card title="Recent activity" className="rc-card" data-testid="recent-activity">
      {isLoading ? (
        <p className="rc-empty">Loading…</p>
      ) : isError ? (
        <p className="rc-empty">Activity could not be loaded.</p>
      ) : !events.length ? (
        <p className="rc-empty">No activity yet.</p>
      ) : (
        <ol className="rc-timeline">
          {events.map((e, i) => {
            const to = e.type === 'project' ? null : viewPath(e.type, e.id, projectId);
            const meta = docMeta(e.type);
            return (
              <li
                key={`${e.kind}:${e.type}:${e.id}:${i}`}
                className={`rc-timeline__item${e.action ? ` rc-tone--${e.action}` : ''}`}
                data-testid="activity-item"
              >
                <span className="rc-timeline__dot" aria-hidden />
                <div className="rc-timeline__body">
                  <div className="rc-timeline__title">
                    {describe(e)}
                    {e.status && e.kind !== 'review' && (
                      <span className="rc-timeline__chip">
                        <StatusPill status={String(e.status).toLowerCase()} size="sm" />
                      </span>
                    )}
                  </div>
                  <div className="rc-timeline__meta">
                    {[fmtDayTime(e.at), e.user].filter(Boolean).join(' · ')}
                  </div>
                  {e.comment && <p className="rc-timeline__comment">“{e.comment}”</p>}
                  {to && (
                    <Link className="rc-link" to={to}>
                      View {meta.short || meta.label}
                      {e.kind === 'review' || e.kind === 'uploaded' ? ' and history' : ''}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
