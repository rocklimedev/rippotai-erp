import React from "react";
import { useNavigate } from "react-router-dom";
import { WidgetShell, Stat, RowList, useEndpoint } from "../common/hooks";

/* -------- Phase L: Admin (overview) widgets --------
 * Mirrors the shape of ./boqs, ./vendors, ./quots, ./materials, ./siteops,
 * ./ledger, ./designstudio, ./crm, ./calendar: small dashboard-grid widgets
 * backed by useEndpoint("/admin/dashboard").
 *
 * Expected shape of GET /admin/dashboard (adjust to match the real API):
 * {
 *   stats: {
 *     active_projects, active_projects_change,
 *     open_leads, open_leads_change,
 *     pending_approvals, pending_approvals_change,
 *     team_members, team_members_change,
 *   },
 *   projects: [{ id, name, client, stage, progress, status, manager, updated_at }],
 *   approvals: [{ id, title, description, priority }],
 *   pipeline: [{ label, value, percentage }],
 *   activity: [{ id, title, description, time, type }],
 *   team: [{ id, name, role, projects, tasks }],
 *   workflow_snapshot: [{ title, value }],
 * }
 */

/* ============================================================
   STAT WIDGETS
============================================================ */

export const AdminActiveProjects = () => {
  const nav = useNavigate();
  const d = useEndpoint("/admin/dashboard");
  return (
    <WidgetShell title="Active Projects" onClick={() => nav("/projects")}>
      <Stat value={d?.stats?.active_projects ?? "—"} sub="vs last month" />
    </WidgetShell>
  );
};

export const AdminOpenLeads = () => {
  const nav = useNavigate();
  const d = useEndpoint("/admin/dashboard");
  return (
    <WidgetShell title="Open Leads" onClick={() => nav("/crm/leads")}>
      <Stat value={d?.stats?.open_leads ?? "—"} sub="across all stages" />
    </WidgetShell>
  );
};

export const AdminPendingApprovals = () => {
  const nav = useNavigate();
  const d = useEndpoint("/admin/dashboard");
  return (
    <WidgetShell
      title="Pending Approvals"
      onClick={() => nav("/admin/approvals")}
    >
      <Stat
        value={d?.stats?.pending_approvals ?? "—"}
        sub="require attention"
      />
    </WidgetShell>
  );
};

export const AdminTeamMembers = () => {
  const nav = useNavigate();
  const d = useEndpoint("/admin/dashboard");
  return (
    <WidgetShell title="Team Members" onClick={() => nav("/admin/team")}>
      <Stat value={d?.stats?.team_members ?? "—"} sub="active users" />
    </WidgetShell>
  );
};

/* ============================================================
   LIST / ROW WIDGETS
============================================================ */

export const AdminProjectsList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/admin/dashboard");
  const rows = (d?.projects || []).slice(0, 6).map((p) => ({
    id: p.id,
    title: p.name,
    subtitle: `${p.client || "—"} · ${p.stage || "—"}`,
    right: p.progress != null ? `${p.progress}%` : p.status,
  }));
  return (
    <WidgetShell title="Active Projects">
      <RowList
        rows={rows}
        onClick={() => nav("/projects")}
        empty="No active projects yet"
      />
    </WidgetShell>
  );
};

export const AdminApprovalsList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/admin/dashboard");
  const rows = (d?.approvals || []).slice(0, 6).map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.description,
    right: a.priority,
  }));
  return (
    <WidgetShell title="Pending Approvals">
      <RowList
        rows={rows}
        onClick={() => nav("/admin/approvals")}
        empty="No items waiting for review"
      />
    </WidgetShell>
  );
};

export const AdminLeadPipeline = () => {
  const nav = useNavigate();
  const d = useEndpoint("/admin/dashboard");
  const rows = (d?.pipeline || []).map((p, i) => ({
    id: `${p.label}-${i}`,
    title: p.label,
    right: p.value,
  }));
  return (
    <WidgetShell title="Lead Pipeline">
      <RowList
        rows={rows}
        onClick={() => nav("/crm/leads")}
        empty="No pipeline data yet"
      />
    </WidgetShell>
  );
};

export const AdminRecentActivity = () => {
  const d = useEndpoint("/admin/dashboard");
  const rows = (d?.activity || []).slice(0, 6).map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.description,
    right: a.time,
  }));
  return (
    <WidgetShell title="Recent Activity">
      <RowList rows={rows} empty="No recent activity across the ERP" />
    </WidgetShell>
  );
};

export const AdminTeamList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/admin/dashboard");
  const rows = (d?.team || []).slice(0, 6).map((m) => ({
    id: m.id,
    title: m.name,
    subtitle: `${m.role || "—"} · ${m.projects ?? "—"} projects`,
    right: m.tasks != null ? `${m.tasks} tasks` : undefined,
  }));
  return (
    <WidgetShell title="Team Overview">
      <RowList
        rows={rows}
        onClick={() => nav("/admin/team")}
        empty="No team members found"
      />
    </WidgetShell>
  );
};

export const AdminWorkflowSnapshot = () => {
  const d = useEndpoint("/admin/dashboard");
  const rows = (d?.workflow_snapshot || []).map((w, i) => ({
    id: `${w.title}-${i}`,
    title: w.title,
    right: w.value,
  }));
  return (
    <WidgetShell title="Workflow Snapshot">
      <RowList rows={rows} empty="No workflow data yet" />
    </WidgetShell>
  );
};
