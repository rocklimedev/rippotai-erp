import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WidgetShell, RowList } from "../common/hooks";
import { useGetSiteOpsDashboardQuery } from "@/api/procuerment/site-ops.api";

/* -------- Site Operations dashboard widgets --------
 * Backed by GET /api/v1/site-ops/dashboard (backend: SiteOpsDashboardService), via RTK Query
 * so the widgets refresh when a daily report is created / edited.
 * Shape: { stats: {...}, reports: [...], visits: [...], rfis: [...], mockups: [...], activity: [...] }
 */

const BASE = "/site-operations";
// carry the dashboard's project filter into the pages the widgets open
const pq = () => {
  const p = new URLSearchParams(window.location.search).get("project");
  return p ? `?project=${encodeURIComponent(p)}` : "";
};
const POLL = { pollingInterval: 60000, refetchOnFocus: true };
// The dashboard header's project picker writes ?project=<uuid>; every widget follows it.
const useDash = () => {
  const [sp] = useSearchParams();
  return useGetSiteOpsDashboardQuery({ projectId: sp.get("project") || undefined }, POLL).data;
};

function BigNumber({ value, caption, tone }) {
  const color = tone === "bad" ? "var(--bad-fg)" : tone === "warn" ? "var(--warn-fg)" : tone === "ok" ? "var(--ok-fg)" : "var(--text)";
  return (
    <div className="h-full flex flex-col justify-end min-w-0">
      <div className="text-[32px] font-bold tabular leading-none" style={{ color, letterSpacing: "-0.02em" }}>
        {value ?? "—"}
      </div>
      {caption && (
        <div className="text-[12px] mt-2 truncate" style={{ color: "var(--text-3)" }}>
          {caption}
        </div>
      )}
    </div>
  );
}

const fmtDay = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/* ============================================================
   STAT WIDGETS
============================================================ */

export const SiteOpsTodayReport = () => {
  const s = useDash()?.stats;
  const done = s?.reported_projects_today ?? null;
  const total = s?.active_projects ?? null;
  const tone = s ? (done && done >= total ? "ok" : "warn") : undefined;
  return (
    <WidgetShell title="Today's Site Reports" href={s?.today_report_ready ? `${BASE}/daily-reports${pq()}` : `${BASE}/daily-reports/new`}>
      <BigNumber
        value={s ? `${done}/${total}` : "—"}
        tone={tone}
        caption={s ? (s.today_report_ready ? `${s.manpower_today} workers on site today` : "No report filed yet today") : null}
      />
    </WidgetShell>
  );
};

export const SiteOpsOpenRfis = () => {
  const s = useDash()?.stats;
  return (
    <WidgetShell title="Open RFIs" href={`${BASE}/rfis${pq()}`}>
      <BigNumber value={s?.open_rfis} caption="awaiting response or closure" />
    </WidgetShell>
  );
};

export const SiteOpsHandoffBlocked = () => {
  const s = useDash()?.stats;
  return (
    <WidgetShell title="QC Handoffs Blocked" href={`${BASE}/qc/handoff-status${pq()}`}>
      <BigNumber value={s?.handoff_blocked} tone={s?.handoff_blocked ? "bad" : undefined} caption="trades waiting for clearance" />
    </WidgetShell>
  );
};

export const SiteOpsTodayVisits = () => {
  const s = useDash()?.stats;
  return (
    <WidgetShell title="Today's Site Visits" href={`${BASE}/visit-assignments${pq()}`}>
      <BigNumber value={s?.today_visits} caption="scheduled / logged visits" />
    </WidgetShell>
  );
};

export const SiteOpsQcPassRate = () => {
  const s = useDash()?.stats;
  return (
    <WidgetShell title="QC Pass Rate" href={`${BASE}/qc/history${pq()}`}>
      <BigNumber value={s?.qc_pass_rate != null ? `${s.qc_pass_rate}%` : "—"} caption={s?.qc_pass_rate == null ? "no QC checks recorded yet" : "based on recorded QC checks"} />
    </WidgetShell>
  );
};

export const SiteOpsFailedQc = () => {
  const s = useDash()?.stats;
  return (
    <WidgetShell title="Rework / Failed QC" href={`${BASE}/qc/history${pq()}`}>
      <BigNumber value={s?.failed_qc} tone={s?.failed_qc ? "bad" : undefined} caption="requires attention" />
    </WidgetShell>
  );
};

export const SiteOpsPendingMockups = () => {
  const s = useDash()?.stats;
  return (
    <WidgetShell title="Mockup Approvals" href={`${BASE}/mockups${pq()}`}>
      <BigNumber value={s?.pending_mockups} caption="finishes awaiting clearance" />
    </WidgetShell>
  );
};

export const SiteOpsTotalReports = () => {
  const s = useDash()?.stats;
  return (
    <WidgetShell title="Site Reports (30 days)" href={`${BASE}/daily-reports${pq()}`}>
      <BigNumber
        value={s?.total_reports}
        caption={s ? (s.reports_with_issues ? `${s.reports_with_issues} with issues` : "no issues reported") : null}
        tone={s?.reports_with_issues ? "warn" : undefined}
      />
    </WidgetShell>
  );
};

/* ============================================================
   LIST / ROW WIDGETS
============================================================ */

export const SiteOpsRecentReports = () => {
  const nav = useNavigate();
  const d = useDash();
  const rows = (d?.reports || []).slice(0, 5).map((r) => ({
    id: r.id,
    title: `${fmtDay(r.report_date)} · ${r.project_name || "Project"}`,
    subtitle: `${r.manpower} workers${r.needs_attention ? " · needs attention" : ""}`,
    right: r.is_shared ? "Shared" : r.status === "SUBMITTED" ? "Submitted" : "Draft",
  }));
  return (
    <WidgetShell title="Daily Site Reports">
      <RowList rows={rows} onClick={(r) => nav(`${BASE}/daily-reports/${r.id}`)} empty="No site reports yet" />
    </WidgetShell>
  );
};

export const SiteOpsRecentVisits = () => {
  const nav = useNavigate();
  const d = useDash();
  const rows = (d?.visits || []).slice(0, 6).map((v) => ({
    id: v.id,
    title: v.visitor_name,
    subtitle: [v.visitor_type || "Visitor", v.project_name, fmtDay(v.scheduled_date)].filter(Boolean).join(" · "),
    right: v.status,
  }));
  return (
    <WidgetShell title="Site Visits">
      <RowList rows={rows} onClick={() => nav(`${BASE}/visit-assignments${pq()}`)} empty="No site visits scheduled or logged" />
    </WidgetShell>
  );
};

export const SiteOpsRfiQueue = () => {
  const nav = useNavigate();
  const d = useDash();
  const rows = (d?.rfis || [])
    .filter((r) => r.status === "OPEN")
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      title: r.subject,
      subtitle: [`RFI-${String(r.rfi_number).padStart(3, "0")}`, r.project_name].filter(Boolean).join(" · "),
      right: r.priority,
    }));
  return (
    <WidgetShell title="RFI Queue">
      <RowList rows={rows} onClick={() => nav(`${BASE}/rfis${pq()}`)} empty="No open RFIs" />
    </WidgetShell>
  );
};

export const SiteOpsMockupApprovals = () => {
  const nav = useNavigate();
  const d = useDash();
  const rows = (d?.mockups || [])
    .filter((m) => m.status === "PROPOSED" || m.status === "UNDER_REVIEW")
    .slice(0, 4)
    .map((m) => ({ id: m.id, title: m.name, subtitle: [m.finish_type || "Finish mockup", m.project_name].filter(Boolean).join(" · "), right: m.status }));
  return (
    <WidgetShell title="Mockups Awaiting Review">
      <RowList rows={rows} onClick={() => nav(`${BASE}/mockups${pq()}`)} empty="No mockups awaiting review" />
    </WidgetShell>
  );
};

export const SiteOpsRecentActivity = () => {
  const nav = useNavigate();
  const d = useDash();
  const target = { report: (a) => `${BASE}/daily-reports/${a.ref_id}`, rfi: () => `${BASE}/rfis${pq()}`, mockup: () => `${BASE}/mockups${pq()}` };
  const rows = (d?.activity || []).slice(0, 8).map((a) => ({
    id: a.id,
    type: a.type,
    ref_id: a.ref_id,
    title: a.title,
    subtitle: a.description,
    right: a.date ? fmtDay(a.date) : "—",
  }));
  return (
    <WidgetShell title="Recent Site Activity">
      <RowList rows={rows} onClick={(r) => nav((target[r.type] || (() => BASE))(r))} empty="No recent activity from reports, RFIs or mockups" />
    </WidgetShell>
  );
};
