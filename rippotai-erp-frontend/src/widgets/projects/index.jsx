import React from "react";
import { useNavigate } from "react-router-dom";
import { relativeTime, daysUntil } from "@/lib/format";
import {
  WidgetShell,
  Stat,
  RowList,
  StatusPill,
  HeroAreaChart,
  DonutMix,
  BarChartWidget,
} from "../common/hooks";
import {
  useGetProjectsSummaryQuery,
  useGetProjectsFullQuery,
  useGetUpcomingMilestonesQuery,
  useGetRecentActivityQuery,
  useGetProjectsProgressQuery,
  useGetUpcomingMilestones4Query,
  useGetProjectsProgressTrendQuery,
  useGetProjectsPhaseMixQuery,
  useGetProjectsVarianceByProjectQuery,
} from "../../api/project.api";

/* -------- Projects stat / list widgets -------- */

export const ProjActive = () => {
  const { data: s } = useGetProjectsSummaryQuery();
  return (
    <WidgetShell title="Active Projects">
      <Stat value={s ? (s.active ?? 0) : "…"} />
    </WidgetShell>
  );
};

export const ProjOnTime = () => {
  const { data: s } = useGetProjectsSummaryQuery();
  return (
    <WidgetShell title="On-Time">
      <Stat value={s ? (s.on_time ?? 0) : "…"} />
    </WidgetShell>
  );
};

export const ProjAtRisk = () => {
  const { data: s } = useGetProjectsSummaryQuery();
  const v = s?.at_risk ?? 0;
  return (
    <WidgetShell title="At-Risk">
      <Stat value={s ? v : "…"} />
    </WidgetShell>
  );
};

export const ProjDelayed = () => {
  const { data: s } = useGetProjectsSummaryQuery();
  const v = s?.delayed ?? 0;
  return (
    <WidgetShell title="Delayed">
      <Stat value={s ? v : "…"} />
    </WidgetShell>
  );
};

export const ProjTotal = () => {
  const { data: s } = useGetProjectsSummaryQuery();
  return (
    <WidgetShell title="Total Projects">
      <Stat
        value={
          s
            ? (s.total ??
              (s.active || 0) +
                (s.on_time || 0) +
                (s.delayed || 0) +
                (s.at_risk || 0))
            : "…"
        }
      />
    </WidgetShell>
  );
};

export const ProjCurrentPhases = () => {
  const { data: list } = useGetProjectsFullQuery();
  const counts = {};
  (list || []).forEach((p) => {
    const k = p.current_phase || "—";
    counts[k] = (counts[k] || 0) + 1;
  });
  const rows = Object.entries(counts).map(([k, v]) => ({
    title: k,
    right: `${v} project${v !== 1 ? "s" : ""}`,
  }));
  return (
    <WidgetShell title="Current Phases">
      <RowList rows={rows} empty="No projects" />
    </WidgetShell>
  );
};

export const ProjUpcomingMilestones = () => {
  const nav = useNavigate();
  const { data: m } = useGetUpcomingMilestonesQuery(5);
  const rows = (m || []).slice(0, 5).map((x) => ({
    id: x.id || x.project_id,
    title: x.title || x.name,
    subtitle: x.project_name,
    right: daysUntil(x.due_date || x.planned_start),
  }));
  return (
    <WidgetShell title="Upcoming Milestones">
      <RowList
        rows={rows}
        onClick={(r) => nav(`/projects/${r.id}`)}
        empty="No milestones due"
      />
    </WidgetShell>
  );
};

export const ProjPendingWork = () => {
  const { data: list } = useGetProjectsFullQuery();
  const total = (list || []).reduce((s, p) => s + (p.pending_count || 0), 0);
  return (
    <WidgetShell title="Pending Work">
      <Stat value={total} />
    </WidgetShell>
  );
};

export const ProjHandoverReadiness = () => {
  const nav = useNavigate();
  const { data: list } = useGetProjectsFullQuery();
  const nearHandover = (list || [])
    .filter((p) => (p.progress || 0) >= 80)
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))
    .slice(0, 3);
  const rows = nearHandover.map((p) => ({
    id: p.id,
    title: p.name,
    subtitle: `${p.progress || 0}% complete`,
    right: <span className="text-[#333333] font-bold">{p.progress || 0}%</span>,
  }));
  return (
    <WidgetShell title="Handover Readiness">
      <RowList
        rows={rows}
        onClick={(r) => nav(`/projects/${r.id}/handover`)}
        empty="No projects near handover"
      />
    </WidgetShell>
  );
};

export const ProjTimelineVariance = () => {
  const { data: list } = useGetProjectsFullQuery();
  const items = (list || []).slice(0, 6);
  const max = Math.max(
    1,
    ...items.map((p) => Math.abs(p.schedule_variance || 0)),
  );
  return (
    <WidgetShell title="Timeline Variance" subtitle="days ahead / behind">
      <div className="flex flex-col gap-2 mt-1">
        {items.map((p) => {
          const v = p.schedule_variance || 0;
          const isNeg = v < 0;
          const w = (Math.abs(v) / max) * 100;
          return (
            <div key={p.id} className="text-[11.5px]">
              <div className="flex justify-between mb-0.5">
                <span className="text-[#333333] truncate max-w-[70%]">
                  {p.name}
                </span>
                <span
                  className={
                    isNeg
                      ? "text-[#333333] font-semibold"
                      : "text-[#333333] font-semibold"
                  }
                >
                  {isNeg ? "" : "+"}
                  {v}d
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1F453B]/8 overflow-hidden">
                <div
                  style={{
                    width: `${w}%`,
                    background: isNeg ? "#1F453B" : "#000",
                  }}
                  className="h-full"
                />
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="text-[12px] text-[#B5C4B6]">No data</div>
        )}
      </div>
    </WidgetShell>
  );
};

export const ProjRecentActivity = () => {
  const { data: a } = useGetRecentActivityQuery(10);
  const rows = (a || []).slice(0, 8).map((x) => ({
    title: x.description || x.action,
    subtitle: x.project_name || x.user_name,
    right: relativeTime(x.created_at),
  }));
  return (
    <WidgetShell title="Recent Project Activity">
      <RowList rows={rows} empty="No activity" />
    </WidgetShell>
  );
};

/* -------- Phase 8 project-wise progress table + milestones -------- */

export const ProjProjectWiseProgress = () => {
  const nav = useNavigate();
  const { data: rows, isLoading } = useGetProjectsProgressQuery();

  if (isLoading || !rows)
    return (
      <WidgetShell title="Project-Wise Progress">
        <div className="text-[12px] text-[#B5C4B6] py-6 text-center">
          Loading…
        </div>
      </WidgetShell>
    );

  return (
    <WidgetShell
      title="Project-Wise Progress"
      subtitle={`${rows.length} project${rows.length !== 1 ? "s" : ""}`}
    >
      <div className="overflow-y-auto h-full">
        <table className="w-full text-[15px]">
          <thead className="text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C] border-b border-[#D8E0DA]">
            <tr>
              <th className="text-left py-1.5">Project</th>
              <th className="text-left">Client</th>
              <th className="text-left">Phase</th>
              <th className="text-left">Progress</th>
              <th className="text-left">Next</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8E0DA]">
            {rows.map((r) => (
              <tr
                key={r.project_id}
                onClick={() => nav(`/projects/${r.project_id}`)}
                className="cursor-pointer hover:bg-[#EAEEF0]"
                data-testid={`proj-progress-row-${r.project_id}`}
              >
                <td className="py-1.5 pr-2 truncate max-w-[140px] font-semibold text-[#333333]">
                  {r.name}
                </td>
                <td className="text-[#6B7B7C] truncate max-w-[100px]">
                  {r.client || "—"}
                </td>
                <td className="text-[#6B7B7C] truncate max-w-[80px]">
                  {r.current_phase || "—"}
                </td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className="w-14 h-1.5 rounded-full bg-[#EAEEF0] overflow-hidden">
                      <div
                        style={{
                          width: `${r.progress_pct}%`,
                          background: "#1F453B",
                        }}
                        className="h-full"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-[#333333]">
                      {r.progress_pct}%
                    </span>
                  </div>
                </td>
                <td className="text-[#6B7B7C] truncate max-w-[110px]">
                  {r.next_milestone_name || "—"}
                </td>
                <td className="text-center">
                  <StatusPill s={r.timeline_status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-[#B5C4B6] py-4">
                  No projects
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
};

export const ProjUpcomingMilestones4 = () => {
  const nav = useNavigate();
  const { data: rows, isLoading } = useGetUpcomingMilestones4Query(4);
  const items = rows || [];

  return (
    <WidgetShell title="Upcoming Milestones">
      <div className="flex flex-col divide-y divide-[#D8E0DA] h-full overflow-y-auto">
        {!isLoading && items.length === 0 && (
          <div className="text-[12px] text-[#B5C4B6] py-6 text-center">
            No upcoming milestones
          </div>
        )}
        {items.map((m) => (
          <button
            key={m.id}
            onClick={() => nav(`/projects/${m.project_id}?tab=timeline`)}
            className="flex items-center gap-2 py-2 text-left hover:bg-[#EAEEF0] rounded px-1"
            data-testid={`upcoming-milestone-${m.id}`}
          >
            <div className="w-7 h-7 rounded-full bg-[#1F453B] text-white text-[10px] font-bold flex items-center justify-center">
              {m.assignee_initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[#333333] truncate">
                {m.title}
              </div>
              <div className="text-[10.5px] text-[#6B7B7C] truncate">
                {m.project_name}
              </div>
            </div>
            <div className="text-[10.5px] text-[#6B7B7C]">
              {daysUntil(m.due_date)}
            </div>
          </button>
        ))}
      </div>
    </WidgetShell>
  );
};

/* -------- Phase 10 charts -------- */

export const ProjProgressTrend = () => {
  const { data, isLoading } = useGetProjectsProgressTrendQuery(6);
  return (
    <HeroAreaChart
      title="Portfolio Progress Trend"
      subtitle="avg % complete · 6 months"
      data={data}
      isLoading={isLoading}
      valueKey="avg_progress"
      currency={false}
    />
  );
};

export const ProjPhaseDonut = () => {
  const { data, isLoading } = useGetProjectsPhaseMixQuery();
  const mix = data
    ? Object.entries(data)
        .map(([k, v]) => ({ name: k, value: v || 0 }))
        .filter((r) => r.value > 0)
    : undefined;
  return (
    <DonutMix
      title="Projects by Phase"
      subtitle="portfolio split"
      data={mix}
      isLoading={isLoading}
    />
  );
};

export const ProjVarianceBar = () => {
  const { data, isLoading } = useGetProjectsVarianceByProjectQuery(6);
  return (
    <BarChartWidget
      title="Timeline Variance"
      subtitle="schedule variance % · top 6"
      data={data}
      isLoading={isLoading}
      xKey="project_name"
      yKey="variance_pct"
      horizontal
      referenceZero
      formatValue={(v) => `${v}%`}
    />
  );
};
