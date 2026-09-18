import React from "react";
import { useNavigate } from "react-router-dom";
import { WidgetShell, Stat, RowList, useEndpoint } from "../common/hooks";

/* -------- Phase J: Design Studio widgets --------
 * Mirrors the shape of ./boqs, ./vendors, ./quots, ./materials, ./siteops, ./ledger, ./calendar:
 * small dashboard-grid widgets backed by useEndpoint("/design-studio/dashboard").
 *
 * Expected shape of GET /design-studio/dashboard (adjust to match the real API):
 * {
 *   overview: {
 *     active_projects, active_projects_change,
 *     design_tasks, design_tasks_change,
 *     pending_approvals, pending_approvals_change,
 *     team_utilization, team_utilization_change,
 *   },
 *   project_stats: { concept, design_development, working_drawings, completed },
 *   projects: [{ id, name, client, type, stage, progress, priority, due_date, team }],
 *   approvals: [{ id, title, project_name, type, submitted_by, submitted_at, status }],
 *   tasks: [{ id, title, project_name, assignee, due_date, priority, status }],
 *   upcoming: [{ id, title, date, type, priority }],
 *   team: [{ id, name, role, active_tasks, completed, utilization }],
 *   activity: [{ id, user, action, target, project_name, time }],
 * }
 */

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

/* ============================================================
   STAT WIDGETS
============================================================ */

export const DesignActiveProjects = () => {
  const nav = useNavigate();
  const d = useEndpoint("/design-studio/dashboard");
  return (
    <WidgetShell
      title="Active Projects"
      onClick={() => nav("/crm/design/projects")}
    >
      <Stat
        value={d?.overview?.active_projects ?? "—"}
        sub="currently in design production"
      />
    </WidgetShell>
  );
};

export const DesignDesignTasks = () => {
  const nav = useNavigate();
  const d = useEndpoint("/design-studio/dashboard");
  return (
    <WidgetShell title="Design Tasks" onClick={() => nav("/crm/design/tasks")}>
      <Stat value={d?.overview?.design_tasks ?? "—"} sub="open design tasks" />
    </WidgetShell>
  );
};

export const DesignPendingApprovals = () => {
  const nav = useNavigate();
  const d = useEndpoint("/design-studio/dashboard");
  return (
    <WidgetShell
      title="Pending Approvals"
      onClick={() => nav("/crm/design/approvals")}
    >
      <Stat
        value={d?.overview?.pending_approvals ?? "—"}
        sub="waiting for review"
      />
    </WidgetShell>
  );
};

export const DesignTeamUtilization = () => {
  const d = useEndpoint("/design-studio/dashboard");
  return (
    <WidgetShell title="Team Utilization">
      <Stat
        value={
          d?.overview?.team_utilization != null
            ? `${d.overview.team_utilization}%`
            : "—"
        }
        sub="average team workload"
      />
    </WidgetShell>
  );
};

export const DesignPipelineStages = () => {
  const nav = useNavigate();
  const d = useEndpoint("/design-studio/dashboard");
  const rows = [
    { id: "concept", title: "Concept", value: d?.project_stats?.concept },
    {
      id: "design_development",
      title: "Design Development",
      value: d?.project_stats?.design_development,
    },
    {
      id: "working_drawings",
      title: "Working Drawings",
      value: d?.project_stats?.working_drawings,
    },
    { id: "completed", title: "Completed", value: d?.project_stats?.completed },
  ].map((s) => ({ id: s.id, title: s.title, right: s.value ?? "—" }));
  return (
    <WidgetShell title="Design Pipeline">
      <RowList
        rows={rows}
        onClick={() => nav("/crm/design/projects")}
        empty="No pipeline data yet"
      />
    </WidgetShell>
  );
};

/* ============================================================
   LIST / ROW WIDGETS
============================================================ */

export const DesignProjectsList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/design-studio/dashboard");
  const rows = (d?.projects || []).slice(0, 6).map((p) => ({
    id: p.id,
    title: p.name,
    subtitle: `${p.client || "—"} · ${p.stage || "—"}`,
    right: p.progress != null ? `${p.progress}%` : undefined,
  }));
  return (
    <WidgetShell title="Design Projects">
      <RowList
        rows={rows}
        onClick={() => nav("/crm/design/projects")}
        empty="No design projects yet"
      />
    </WidgetShell>
  );
};

export const DesignApprovalsList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/design-studio/dashboard");
  const rows = (d?.approvals || []).slice(0, 6).map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: `${a.project_name || "—"} · ${a.type || "—"}`,
    right: a.submitted_by,
  }));
  return (
    <WidgetShell title="Pending Approvals">
      <RowList
        rows={rows}
        onClick={() => nav("/crm/design/approvals")}
        empty="No approvals pending review"
      />
    </WidgetShell>
  );
};

export const DesignTasksList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/design-studio/dashboard");
  const rows = (d?.tasks || []).slice(0, 6).map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: `${t.project_name || "—"} · ${t.assignee || "—"}`,
    right: t.priority,
  }));
  return (
    <WidgetShell title="Design Tasks">
      <RowList
        rows={rows}
        onClick={() => nav("/crm/design/tasks")}
        empty="No open design tasks"
      />
    </WidgetShell>
  );
};

export const DesignUpcomingDeadlines = () => {
  const nav = useNavigate();
  const d = useEndpoint("/design-studio/dashboard");
  const rows = (d?.upcoming || []).slice(0, 6).map((u) => ({
    id: u.id,
    title: u.title,
    subtitle: `${u.type || "—"} · ${formatDate(u.date)}`,
    right: u.priority,
  }));
  return (
    <WidgetShell title="Upcoming Deadlines">
      <RowList
        rows={rows}
        onClick={() => nav("/crm/calendar")}
        empty="No upcoming deadlines"
      />
    </WidgetShell>
  );
};

export const DesignTeamWorkload = () => {
  const d = useEndpoint("/design-studio/dashboard");
  const rows = (d?.team || []).slice(0, 6).map((m) => ({
    id: m.id,
    title: m.name,
    subtitle: `${m.role || "—"} · ${m.active_tasks ?? "—"} active tasks`,
    right: m.utilization != null ? `${m.utilization}%` : undefined,
  }));
  return (
    <WidgetShell title="Studio Workload">
      <RowList rows={rows} empty="No team workload data yet" />
    </WidgetShell>
  );
};

export const DesignRecentActivity = () => {
  const d = useEndpoint("/design-studio/dashboard");
  const rows = (d?.activity || []).slice(0, 6).map((a) => ({
    id: a.id,
    title: `${a.user} ${a.action}`,
    subtitle: `${a.target || "—"} · ${a.project_name || "—"}`,
    right: a.time,
  }));
  return (
    <WidgetShell title="Recent Activity">
      <RowList rows={rows} empty="No recent studio activity" />
    </WidgetShell>
  );
};
