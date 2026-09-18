import React from "react";
import { useNavigate } from "react-router-dom";
import { WidgetShell, Stat, RowList, useEndpoint } from "../common/hooks";

/* -------- Phase H: Site Operations widgets --------
 * Mirrors the shape of ./boqs, ./vendors, ./quots, ./materials, ./calendar:
 * small dashboard-grid widgets backed by useEndpoint("/site-ops/dashboard").
 *
 * Expected shape of GET /site-ops/dashboard (adjust to match the real API):
 * {
 *   stats: {
 *     today_report_ready, today_report_shared, total_reports,
 *     open_rfis, pending_mockups,
 *     passed_qc, failed_qc, qc_pass_rate,
 *     handoff_blocked,
 *     today_visits,
 *   },
 *   reports: [{ id, report_date, work_completed, is_shared }],
 *   visits: [{ id, visitor_name, visitor_type, scheduled_date, purpose, status }],
 *   rfis: [{ id, rfi_number, subject, status, priority, routed_to_team_name }],
 *   mockups: [{ id, name, finish_type, status }],
 *   activity: [{ id, type, title, description, date, status }],
 * }
 */

/* ============================================================
   STAT WIDGETS
============================================================ */

export const SiteOpsTodayReport = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  const ready = d?.stats?.today_report_ready;
  return (
    <WidgetShell
      title="Today's Site Report"
      onClick={() =>
        nav(
          ready
            ? "/site-ops/daily-reports?date=today"
            : "/site-ops/daily-report-new",
        )
      }
    >
      <div className="h-full flex flex-col items-center justify-center">
        <div
          className={`text-[22px] font-bold leading-none ${
            ready ? "text-[#1F453B]" : "text-[#B04D26]"
          }`}
        >
          {ready == null ? "—" : ready ? "Ready" : "Missing"}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">
          {ready
            ? d?.stats?.today_report_shared
              ? "shared with team"
              : "not shared yet"
            : "create today's report"}
        </div>
      </div>
    </WidgetShell>
  );
};

export const SiteOpsOpenRfis = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  return (
    <WidgetShell title="Open RFIs" onClick={() => nav("/site-ops/rfis")}>
      <Stat
        value={d?.stats?.open_rfis ?? "—"}
        sub="awaiting response or closure"
      />
    </WidgetShell>
  );
};

export const SiteOpsHandoffBlocked = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  return (
    <WidgetShell
      title="QC Handoffs Blocked"
      onClick={() => nav("/site-ops/qc")}
    >
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-[36px] font-bold text-[#B04D26] leading-none">
          {d?.stats?.handoff_blocked ?? "—"}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">
          trades waiting for clearance
        </div>
      </div>
    </WidgetShell>
  );
};

export const SiteOpsTodayVisits = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  return (
    <WidgetShell
      title="Today's Site Visits"
      onClick={() => nav("/site-ops/visits")}
    >
      <Stat
        value={d?.stats?.today_visits ?? "—"}
        sub="scheduled / logged visits"
      />
    </WidgetShell>
  );
};

export const SiteOpsQcPassRate = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  return (
    <WidgetShell title="QC Pass Rate" onClick={() => nav("/site-ops/qc")}>
      <Stat
        value={
          d?.stats?.qc_pass_rate != null ? `${d.stats.qc_pass_rate}%` : "—"
        }
        sub="based on recorded QC checks"
      />
    </WidgetShell>
  );
};

export const SiteOpsFailedQc = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  return (
    <WidgetShell title="Rework / Failed QC" onClick={() => nav("/site-ops/qc")}>
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-[36px] font-bold text-[#B04D26] leading-none">
          {d?.stats?.failed_qc ?? "—"}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">
          requires attention
        </div>
      </div>
    </WidgetShell>
  );
};

export const SiteOpsPendingMockups = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  return (
    <WidgetShell
      title="Mockup Approvals"
      onClick={() => nav("/site-ops/mockups")}
    >
      <Stat
        value={d?.stats?.pending_mockups ?? "—"}
        sub="finishes awaiting clearance"
      />
    </WidgetShell>
  );
};

export const SiteOpsTotalReports = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  return (
    <WidgetShell
      title="Site Reports (30d)"
      onClick={() => nav("/site-ops/daily-reports")}
    >
      <Stat
        value={d?.stats?.total_reports ?? "—"}
        sub="reports filed in last 30 days"
      />
    </WidgetShell>
  );
};

/* ============================================================
   LIST / ROW WIDGETS
============================================================ */

export const SiteOpsRecentReports = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  const rows = (d?.reports || []).slice(0, 5).map((r) => ({
    id: r.id,
    title: r.report_date,
    subtitle: r.work_completed || "No work summary",
    right: r.is_shared ? "Shared" : "Draft",
  }));
  return (
    <WidgetShell title="Daily Site Reports">
      <RowList
        rows={rows}
        onClick={() => nav("/site-ops/daily-reports")}
        empty="No site reports in the last 30 days"
      />
    </WidgetShell>
  );
};

export const SiteOpsRecentVisits = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  const rows = (d?.visits || []).slice(0, 6).map((v) => ({
    id: v.id,
    title: v.visitor_name,
    subtitle: `${v.visitor_type || "Visitor"} · ${v.scheduled_date || "—"}`,
    right: v.status,
  }));
  return (
    <WidgetShell title="Site Visits">
      <RowList
        rows={rows}
        onClick={() => nav("/site-ops/visits")}
        empty="No site visits scheduled or logged"
      />
    </WidgetShell>
  );
};

export const SiteOpsRfiQueue = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  const rows = (d?.rfis || [])
    .filter((r) => r.status === "OPEN")
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      title: r.subject,
      subtitle: `RFI-${String(r.rfi_number).padStart(3, "0")} · ${
        r.routed_to_team_name || "Awaiting team response"
      }`,
      right: r.priority,
    }));
  return (
    <WidgetShell title="RFI Queue">
      <RowList
        rows={rows}
        onClick={() => nav("/site-ops/rfis")}
        empty="No open RFIs"
      />
    </WidgetShell>
  );
};

export const SiteOpsMockupApprovals = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  const rows = (d?.mockups || [])
    .filter((m) => m.status === "PROPOSED" || m.status === "UNDER_REVIEW")
    .slice(0, 4)
    .map((m) => ({
      id: m.id,
      title: m.name,
      subtitle: m.finish_type || "Finish mockup",
      right: m.status,
    }));
  return (
    <WidgetShell title="Mockups Awaiting Review">
      <RowList
        rows={rows}
        onClick={() => nav("/site-ops/mockups")}
        empty="No mockups awaiting review"
      />
    </WidgetShell>
  );
};

export const SiteOpsRecentActivity = () => {
  const nav = useNavigate();
  const d = useEndpoint("/site-ops/dashboard");
  const rows = (d?.activity || []).slice(0, 8).map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.description,
    right: a.date ? new Date(a.date).toLocaleDateString() : "—",
  }));
  return (
    <WidgetShell title="Recent Site Activity">
      <RowList
        rows={rows}
        onClick={() => nav("/site-ops")}
        empty="No recent activity from reports, RFIs or mockups"
      />
    </WidgetShell>
  );
};
