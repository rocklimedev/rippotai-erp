// Daily site reports — list. Filters: project (or all), date range, issues / drafts.
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, FileText, Users, AlertTriangle, Share2, CalendarCheck, Camera, ChevronRight } from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  Button,
  Stats,
  StatTile,
  Segmented,
  Field,
  SelectInput,
  TextInput,
  Pill,
  StatusPill,
  EmptyState,
} from "@/components/inos";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import { useListDailySiteReportsQuery } from "@/api/procuerment/site-ops.api";
import {
  weatherLabel,
  weatherIcon,
  fmtDate,
  todayISO,
  shiftISO,
  manpowerTotal,
  issueCount,
  hasAttention,
} from "./daily-reports/reportModel";
import "./daily-reports/daily-reports.css";

const BASE = "/site-operations/daily-reports";

const weekday = (iso) => {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short" });
};

export default function DailySiteReportsPage() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const projectId = params.get("project") || "";
  const from = params.get("from") ?? shiftISO(todayISO(), -30);
  const to = params.get("to") ?? todayISO();
  const view = params.get("view") || "all";

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === "" || v == null ? next.delete(k) : next.set(k, v)));
    setParams(next, { replace: true });
  };

  const { data: projectsData } = useGetProjectsQuery({});
  const projects = useMemo(() => {
    const rows = Array.isArray(projectsData) ? projectsData : projectsData?.data || projectsData?.items || [];
    return rows.filter((p) => !p.deleted_at && !p.archived_at);
  }, [projectsData]);

  const { data, isFetching, isError } = useListDailySiteReportsQuery({
    projectId,
    from,
    to,
    hasIssues: view === "issues",
    status: view === "drafts" ? "DRAFT" : undefined,
  });
  const reports = Array.isArray(data) ? data : [];
  const [shown, setShown] = useState(50);
  useEffect(() => setShown(50), [projectId, from, to, view]);
  const visible = reports.slice(0, shown);

  const stats = useMemo(() => {
    const today = todayISO();
    const active = projects.filter((p) => String(p.status).toLowerCase() === "active");
    const reportedToday = new Set(reports.filter((r) => r.reportDate === today).map((r) => r.projectId));
    const days = reports.length || 1;
    return {
      total: reports.length,
      todayCount: reportedToday.size,
      activeCount: projectId ? 1 : active.length,
      avgManpower: reports.length ? Math.round(reports.reduce((s, r) => s + manpowerTotal(r), 0) / days) : 0,
      withIssues: reports.filter((r) => issueCount(r) > 0).length,
      flagged: reports.filter(hasAttention).length,
      shared: reports.filter((r) => r.isShared).length,
    };
  }, [reports, projects, projectId]);

  const newHref = `${BASE}/new${projectId ? `?projectId=${projectId}` : ""}`;
  const open = (r) => nav(`${BASE}/${r.id}`);

  const Weather = ({ r }) => {
    if (!r.weatherCondition) return <span className="muted">—</span>;
    const I = weatherIcon(r.weatherCondition);
    return (
      <span className="dsr-meta">
        <I />
        {weatherLabel(r.weatherCondition)}
      </span>
    );
  };

  const StatusCell = ({ r }) => (
    <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
      <StatusPill status={r.status} size="sm" />
      {r.isShared && <Pill tone="ok" size="sm">Shared</Pill>}
    </span>
  );

  const IssuesCell = ({ r }) => {
    const n = issueCount(r);
    if (!n) return <span className="muted">None</span>;
    return hasAttention(r) ? <Pill tone="bad" size="sm">{n} · attention</Pill> : <Pill tone="warn" size="sm">{n}</Pill>;
  };

  return (
    <Page className="dsr-page">
      <PageHeader
        crumbs={[{ label: "Site Operations", to: "/site-operations" }, { label: "Daily reports" }]}
        title="Daily site reports"
        subtitle="One report per project per day — manpower, work done, materials, issues and photos."
        actions={<Button variant="primary" icon={Plus} onClick={() => nav(newHref)}>New report</Button>}
      />

      <Stats>
        <StatTile label="Reports in range" value={stats.total} meta={`${fmtDate(from)} – ${fmtDate(to)}`} icon={<FileText />} />
        <StatTile
          label="Reported today"
          value={`${stats.todayCount}/${stats.activeCount}`}
          meta={projectId ? "this project" : "active projects"}
          icon={<CalendarCheck />}
          tone={stats.todayCount >= stats.activeCount && stats.activeCount ? "ok" : "warn"}
        />
        <StatTile label="Avg. workers / day" value={stats.avgManpower} icon={<Users />} />
        <StatTile
          label="With issues"
          value={stats.withIssues}
          meta={stats.flagged ? `${stats.flagged} need attention` : "none flagged"}
          icon={<AlertTriangle />}
          tone={stats.flagged ? "bad" : "warn"}
          active={view === "issues"}
          onClick={() => update({ view: view === "issues" ? "" : "issues" })}
        />
        <StatTile label="Shared with client" value={stats.shared} icon={<Share2 />} tone="ok" />
      </Stats>

      <Card flush>
        <div style={{ padding: 16, display: "grid", gap: 12, borderBottom: "1px solid var(--line)" }}>
          <div className="dsr-filters">
            <Field label="Project">
              <SelectInput value={projectId} onChange={(e) => update({ project: e.target.value })} aria-label="Project">
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="From">
              <TextInput type="date" value={from} max={to} onChange={(e) => update({ from: e.target.value })} />
            </Field>
            <Field label="To">
              <TextInput type="date" value={to} min={from} max={todayISO()} onChange={(e) => update({ to: e.target.value })} />
            </Field>
            <div>
              <Segmented
                value={view}
                onChange={(v) => update({ view: v === "all" ? "" : v })}
                options={[
                  { value: "all", label: "All" },
                  { value: "issues", label: "With issues" },
                  { value: "drafts", label: "Drafts" },
                ]}
              />
            </div>
          </div>
        </div>

        {isError ? (
          <EmptyState icon={AlertTriangle} title="Couldn't load reports" text="Check your connection and try again." />
        ) : !reports.length ? (
          <EmptyState
            icon={FileText}
            title={isFetching ? "Loading reports…" : "No reports in this range"}
            text={isFetching ? undefined : "Widen the date range, switch project, or file today's report."}
            action={!isFetching && <Button variant="primary" icon={Plus} onClick={() => nav(newHref)}>New report</Button>}
          />
        ) : (
          <>
            <div className="inos-table-wrap dsr-table">
              <table className="inos-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th className="num">Workers</th>
                    <th>Weather</th>
                    <th>Issues</th>
                    <th className="num">Photos</th>
                    <th>Status</th>
                    <th className="actions" aria-label="Open" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.id} className="is-clickable" onClick={() => open(r)}>
                      <td className="dsr-date-cell">
                        <strong>{fmtDate(r.reportDate)}</strong>
                        <span>{weekday(r.reportDate)} · {r.reportedBy}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.project?.name || "—"}</div>
                        <div className="dsr-summary">{r.workItems?.[0]?.activity || r.workCompleted || "—"}</div>
                      </td>
                      <td className="num">{manpowerTotal(r)}</td>
                      <td><Weather r={r} /></td>
                      <td><IssuesCell r={r} /></td>
                      <td className="num">{(r.photos || []).length}</td>
                      <td><StatusCell r={r} /></td>
                      <td className="actions"><ChevronRight size={16} color="var(--text-3)" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dsr-cards">
              {visible.map((r) => (
                <button type="button" key={r.id} className="dsr-card" onClick={() => open(r)}>
                  <div className="dsr-card__top">
                    <div>
                      <div className="dsr-card__date">{weekday(r.reportDate)}, {fmtDate(r.reportDate)}</div>
                      <div className="dsr-card__proj">{r.project?.name || "—"}</div>
                    </div>
                    <StatusCell r={r} />
                  </div>
                  <div className="dsr-card__meta">
                    <span><Users />{manpowerTotal(r)} workers</span>
                    <Weather r={r} />
                    <span><Camera />{(r.photos || []).length}</span>
                    <IssuesCell r={r} />
                  </div>
                </button>
              ))}
            </div>
            {reports.length > shown && (
              <div className="dsr-more">
                <Button variant="secondary" size="sm" onClick={() => setShown((n) => n + 50)}>
                  Show more ({reports.length - shown} older)
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </Page>
  );
}
