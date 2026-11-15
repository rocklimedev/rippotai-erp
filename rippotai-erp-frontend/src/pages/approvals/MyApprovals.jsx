// My approvals: every document waiting for the current user's decision, across
// all document types. Review opens the shared Approve / Revise / Reject /
// Archive dialog with comments.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Card, EmptyState, Page, PageHeader, Pill, SearchInput, Toolbar, prettyStatus } from "@/components/inos";
import { HistoryDrawer, ReviewMenu } from "@/components/doc-list/review";
import { fmtDate } from "@/components/doc-list/doc-utils";
import { approvalPath, useGetMyApprovalsCountQuery, useGetMyApprovalsQuery } from "@/api/doc-flow/approvals.api";
import "@/components/doc-list/doc-list.css";

const waited = (since) => {
  if (!since) return null;
  const days = Math.floor((Date.now() - new Date(since).getTime()) / 86400000);
  if (!Number.isFinite(days) || days < 1) return "today";
  return days === 1 ? "1 day" : `${days} days`;
};

export default function MyApprovals() {
  const { data, isLoading, isFetching, error, refetch } = useGetMyApprovalsQuery(undefined, { refetchOnMountOrArgChange: true });
  const { refetch: refetchCount } = useGetMyApprovalsCountQuery();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [history, setHistory] = useState(null);
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const types = useMemo(() => [...new Map(rows.map((r) => [r.type, r.type_label])).entries()], [rows]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows
      .filter((r) => !type || r.type === type)
      .filter(
        (r) =>
          !term ||
          [r.code, r.name, r.type_label, r.project_name, r.project_code, r.submitted_by_name].filter(Boolean).join(" ").toLowerCase().includes(term),
      );
  }, [rows, q, type]);
  const done = () => {
    refetch();
    refetchCount();
  };

  return (
    <Page>
      <PageHeader title="My Approvals" trail={false} info={isLoading ? null : `${rows.length} waiting for your decision`} />
      <Card flush className="dl-card">
        <div className="dl-filters">
          <Toolbar>
            <SearchInput value={q} onChange={setQ} placeholder="Search approvals" />
            <select className="inos-select dl-project" value={type} onChange={(e) => setType(e.target.value)} aria-label="Document type">
              <option value="">All documents</option>
              {types.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </Toolbar>
        </div>
        {error ? (
          <EmptyState title="Could not load approvals" text={error?.data?.message || "Try again in a moment."} />
        ) : isLoading ? (
          <div className="dl-loading">Loading…</div>
        ) : !shown.length ? (
          <EmptyState icon={CheckCircle2} title={rows.length ? "No matches" : "Nothing waiting for your decision"} />
        ) : (
          <div className="inos-table-wrap">
            <table className="inos-table dl-table" data-testid="approvals-table" aria-busy={isFetching || undefined}>
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Project</th>
                  <th>Submitted by</th>
                  <th>Waiting since</th>
                  <th>Status</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const to = approvalPath(r);
                  const label = `${r.code}${r.version ? ` v${r.version}` : ""}`;
                  return (
                    <tr key={`${r.type}:${r.id}`} data-testid="approval-row">
                      <td className="dl-name">
                        {to ? (
                          <Link to={to} className="dl-link">
                            {label}
                          </Link>
                        ) : (
                          <strong>{label}</strong>
                        )}
                        <div className="appr-sub">
                          {r.type_label}
                          {r.name && r.name !== r.type_label ? ` · ${r.name}` : ""}
                        </div>
                      </td>
                      <td className="dl-project-cell">
                        {r.project_id ? (
                          <Link to={`/projects/${r.project_id}`} className="appr-project">
                            {[r.project_code, r.project_name].filter(Boolean).join(" · ")}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{r.submitted_by_name || "—"}</td>
                      <td className="dl-date">
                        {fmtDate(r.since)}
                        {waited(r.since) && <div className="appr-sub">{waited(r.since)}</div>}
                      </td>
                      <td>
                        <Pill tone="warn">{prettyStatus(String(r.status || "").toLowerCase())}</Pill>
                      </td>
                      <td>
                        <ReviewMenu
                          type={r.type}
                          id={r.id}
                          name={`${label} · ${r.type_label}`}
                          canReview
                          onOpenHistory={() => setHistory(r)}
                          onDone={done}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {history && (
        <HistoryDrawer
          type={history.type}
          id={history.id}
          name={`${history.code} · ${history.type_label}`}
          version={history.version}
          canReview
          onClose={() => {
            setHistory(null);
            done();
          }}
        />
      )}
      <style>{`
        .appr-sub { font-size: 12.5px; color: var(--text-3); font-weight: 500; margin-top: 2px; white-space: normal; }
        .appr-project { color: var(--text-2); }
        .appr-project:hover { color: var(--brand); text-decoration: underline; }
      `}</style>
    </Page>
  );
}
