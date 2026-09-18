import React from "react";
import { useNavigate } from "react-router-dom";
import { WidgetShell, Stat, RowList, useEndpoint } from "../common/hooks";

/* -------- Phase K: CRM (overview) widgets --------
 * Mirrors the shape of ./boqs, ./vendors, ./quots, ./materials, ./siteops,
 * ./ledger, ./designstudio, ./calendar: small dashboard-grid widgets backed
 * by useEndpoint("/crm/dashboard").
 *
 * Expected shape of GET /crm/dashboard (adjust to match the real API):
 * {
 *   leads: { total, new, active, won, lost, conversion_rate },
 *   projects: { total, active, upcoming, completed },
 *   project_briefs: { total, drafts, under_review, approved },
 *   site_recce: { total, pending, completed },
 *   plans_of_action: { total, active, overdue_phases, completed },
 *   scope_of_work: { total, drafts, review, approved },
 *   payment_schedules: { total, active, payable_amount, pending_milestones },
 *   upcoming_deadlines: [{ id, title, project_name, date, time, type, priority }],
 *   activity: [{ id, type, title, description, user, time }],
 * }
 */

const formatCurrency = (value) => {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

/* ============================================================
   STAT WIDGETS
============================================================ */

export const CrmTotalLeads = () => {
  const nav = useNavigate();
  const d = useEndpoint("/crm/dashboard");
  return (
    <WidgetShell title="Total Leads" onClick={() => nav("/crm/leads")}>
      <Stat
        value={d?.leads?.total ?? "—"}
        sub={
          d?.leads?.new != null ? `${d.leads.new} new this period` : undefined
        }
      />
    </WidgetShell>
  );
};

export const CrmActiveProjects = () => {
  const nav = useNavigate();
  const d = useEndpoint("/crm/dashboard");
  return (
    <WidgetShell title="Active Projects" onClick={() => nav("/projects")}>
      <Stat
        value={d?.projects?.active ?? "—"}
        sub={
          d?.projects?.upcoming != null
            ? `${d.projects.upcoming} upcoming`
            : undefined
        }
      />
    </WidgetShell>
  );
};

export const CrmActivePlans = () => {
  const nav = useNavigate();
  const d = useEndpoint("/crm/dashboard");
  return (
    <WidgetShell title="Active Plans" onClick={() => nav("/plan-of-actions")}>
      <Stat
        value={d?.plans_of_action?.active ?? "—"}
        sub={
          d?.plans_of_action?.overdue_phases != null
            ? `${d.plans_of_action.overdue_phases} overdue phases`
            : undefined
        }
      />
    </WidgetShell>
  );
};

export const CrmPayableAmount = () => {
  const nav = useNavigate();
  const d = useEndpoint("/crm/dashboard");
  return (
    <WidgetShell
      title="Payable Amount"
      onClick={() => nav("/ledger/payment-schedule/all")}
    >
      <Stat
        value={formatCurrency(d?.payment_schedules?.payable_amount)}
        sub={
          d?.payment_schedules?.pending_milestones != null
            ? `${d.payment_schedules.pending_milestones} pending milestones`
            : undefined
        }
      />
    </WidgetShell>
  );
};

export const CrmLeadsBreakdown = () => {
  const nav = useNavigate();
  const d = useEndpoint("/crm/dashboard");
  const rows = [
    { id: "total", title: "Total", right: d?.leads?.total },
    { id: "new", title: "New", right: d?.leads?.new },
    { id: "active", title: "Active", right: d?.leads?.active },
    { id: "won", title: "Won", right: d?.leads?.won },
    { id: "lost", title: "Lost", right: d?.leads?.lost },
  ].map((r) => ({ ...r, right: r.right ?? "—" }));
  return (
    <WidgetShell title="Leads Pipeline">
      <RowList
        rows={rows}
        onClick={() => nav("/crm/leads")}
        empty="No lead data yet"
      />
    </WidgetShell>
  );
};

export const CrmProjectsBreakdown = () => {
  const nav = useNavigate();
  const d = useEndpoint("/crm/dashboard");
  const rows = [
    { id: "active", title: "Active", right: d?.projects?.active },
    { id: "upcoming", title: "Upcoming", right: d?.projects?.upcoming },
    { id: "completed", title: "Completed", right: d?.projects?.completed },
    { id: "total", title: "Total", right: d?.projects?.total },
  ].map((r) => ({ ...r, right: r.right ?? "—" }));
  return (
    <WidgetShell title="Project Portfolio">
      <RowList
        rows={rows}
        onClick={() => nav("/projects")}
        empty="No project data yet"
      />
    </WidgetShell>
  );
};

export const CrmProjectBriefs = () => {
  const nav = useNavigate();
  const d = useEndpoint("/crm/dashboard");
  return (
    <WidgetShell title="Project Briefs" onClick={() => nav("/crm/brief/all")}>
      <Stat
        value={d?.project_briefs?.total ?? "—"}
        sub={
          d?.project_briefs?.drafts != null
            ? `${d.project_briefs.drafts} drafts`
            : undefined
        }
      />
    </WidgetShell>
  );
};

export const CrmSiteRecce = () => {
  const nav = useNavigate();
  const d = useEndpoint("/crm/dashboard");
  return (
    <WidgetShell title="Site Recce" onClick={() => nav("/site-recce")}>
      <Stat
        value={d?.site_recce?.total ?? "—"}
        sub={
          d?.site_recce?.pending != null
            ? `${d.site_recce.pending} pending`
            : undefined
        }
      />
    </WidgetShell>
  );
};

export const CrmPlansOfAction = () => {
  const nav = useNavigate();
  const d = useEndpoint("/crm/dashboard");
  return (
    <WidgetShell
      title="Plans of Action"
      onClick={() => nav("/plan-of-actions")}
    >
      <Stat
        value={d?.plans_of_action?.total ?? "—"}
        sub={
          d?.plans_of_action?.completed != null
            ? `${d.plans_of_action.completed} completed`
            : undefined
        }
      />
    </WidgetShell>
  );
};

export const CrmScopeOfWork = () => {
  const nav = useNavigate();
  const d = useEndpoint("/crm/dashboard");
  return (
    <WidgetShell title="Scope of Work" onClick={() => nav("/scope-of-work")}>
      <Stat
        value={d?.scope_of_work?.total ?? "—"}
        sub={
          d?.scope_of_work?.review != null
            ? `${d.scope_of_work.review} in review`
            : undefined
        }
      />
    </WidgetShell>
  );
};

export const CrmPaymentSchedules = () => {
  const nav = useNavigate();
  const d = useEndpoint("/crm/dashboard");
  return (
    <WidgetShell
      title="Payment Schedules"
      onClick={() => nav("/ledger/payment-schedule/all")}
    >
      <Stat
        value={d?.payment_schedules?.total ?? "—"}
        sub={
          d?.payment_schedules?.active != null
            ? `${d.payment_schedules.active} active`
            : undefined
        }
      />
    </WidgetShell>
  );
};

/* ============================================================
   LIST / ROW WIDGETS
============================================================ */

export const CrmUpcomingDeadlines = () => {
  const nav = useNavigate();
  const d = useEndpoint("/crm/dashboard");
  const rows = (d?.upcoming_deadlines || []).slice(0, 6).map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: `${item.project_name || "—"} · ${item.date || "—"}`,
    right: item.priority,
  }));
  return (
    <WidgetShell title="Upcoming Deadlines">
      <RowList
        rows={rows}
        onClick={() => nav("/calendar")}
        empty="No upcoming deadlines"
      />
    </WidgetShell>
  );
};

export const CrmRecentActivity = () => {
  const d = useEndpoint("/crm/dashboard");
  const rows = (d?.activity || []).slice(0, 8).map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: `${a.description || "—"} · by ${a.user || "—"}`,
    right: a.time,
  }));
  return (
    <WidgetShell title="Recent Activity">
      <RowList rows={rows} empty="No recent CRM activity" />
    </WidgetShell>
  );
};
