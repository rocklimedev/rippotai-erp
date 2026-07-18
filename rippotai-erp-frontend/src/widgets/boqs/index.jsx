import React from "react";
import { useNavigate } from "react-router-dom";
import { formatINRShort, relativeTime } from "@/lib/format";
import { Plus, AlertTriangle, FileText } from "lucide-react";
import {
  WidgetShell,
  Stat,
  RowList,
  StatusPill,
  HeroAreaChart,
  DonutMix,
  BarChartWidget,
  IconListWidget,
} from "../common/hooks";
import {
  useGetBoqSummaryQuery,
  useGetBoqProductivityQuery,
  useGetBoqsQuery,
  useGetBoqProjectWiseQuery,
  useGetBoqValueTrendQuery,
  useGetBoqMonthlyVolumeQuery,
  useGetBoqStatusMixQuery,
  useGetBoqRecentlyEditedQuery,
} from "../../api/boq.api";

/* ====================== STAT WIDGETS ====================== */

export const BoqTotalBoqs = () => {
  const { data: s } = useGetBoqSummaryQuery();
  return (
    <WidgetShell title="Total BOQs" href="/boq/all">
      <Stat value={s?.total ?? "…"} />
    </WidgetShell>
  );
};

export const BoqDraftBoqs = () => {
  const { data: s } = useGetBoqSummaryQuery();
  return (
    <WidgetShell title="Draft BOQs" href="/boq/all?status=draft">
      <Stat value={s?.drafts ?? "…"} />
    </WidgetShell>
  );
};

export const BoqAwaitingApproval = () => {
  const { data: s } = useGetBoqSummaryQuery();
  return (
    <WidgetShell
      title="Awaiting Approval"
      href="/boq/all?status=awaiting_approval"
    >
      <Stat value={s?.awaiting_approval ?? "…"} />
    </WidgetShell>
  );
};

export const BoqApprovedBoqs = () => {
  const { data: s } = useGetBoqSummaryQuery();
  return (
    <WidgetShell title="Approved BOQs" href="/boq/all?status=approved">
      <Stat value={s?.approved ?? "…"} />
    </WidgetShell>
  );
};

export const BoqValueSummary = () => {
  const { data: list } = useGetBoqsQuery();
  const totalApprovedValue = (list || [])
    .filter((b) => b.status === "approved")
    .reduce((sum, b) => sum + Number(b.total_value || 0), 0);

  return (
    <WidgetShell title="Approved BOQ Value">
      <Stat value={formatINRShort(totalApprovedValue)} />
    </WidgetShell>
  );
};

/* ====================== ACTION WIDGETS ====================== */

export const BoqQuickCreate = () => {
  const nav = useNavigate();
  return (
    <WidgetShell title="Create BOQ">
      <button
        onClick={() => nav("/boq/new")}
        className="w-full h-full rounded-xl bg-[#1F453B] hover:opacity-90 text-white text-[13px] font-semibold flex items-center justify-center gap-2"
      >
        <Plus size={15} /> New BOQ
      </button>
    </WidgetShell>
  );
};

/* ====================== LIST WIDGETS ====================== */

export const BoqRecentlyEdited = () => {
  const nav = useNavigate();
  const { data: list } = useGetBoqsQuery();

  const rows = (list || []).slice(0, 5).map((b) => ({
    id: b.id,
    title: b.title || b.project_name,
    subtitle: `${b.version ? `V${b.version}` : "V1"} · ${b.status?.replace("_", " ")}`,
    right: relativeTime(b.updated_at),
  }));

  return (
    <WidgetShell title="Recently Edited BOQs">
      <RowList rows={rows} onClick={(r) => nav(`/boq/${r.id}`)} />
    </WidgetShell>
  );
};

export const BoqRecentlyApproved = () => {
  const nav = useNavigate();
  const { data: list } = useGetBoqsQuery();

  const rows = (list || [])
    .filter((b) => b.status === "approved")
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      title: b.title || b.project_name,
      subtitle: b.version ? `V${b.version}` : "V1",
      right: formatINRShort(Number(b.total_value || 0)),
    }));

  return (
    <WidgetShell title="Recently Approved">
      <RowList
        rows={rows}
        onClick={(r) => nav(`/boq/${r.id}`)}
        empty="No approved BOQs yet"
      />
    </WidgetShell>
  );
};

export const BoqAttentionItems = () => {
  const { data: list } = useGetBoqsQuery();
  const drafts = (list || []).filter((b) => b.status === "draft");

  const rows = drafts.slice(0, 5).map((b) => ({
    id: b.id,
    title: b.title || b.project_name,
    subtitle: "Draft — needs review",
    right: <AlertTriangle size={12} className="text-[#333333] inline" />,
  }));

  return (
    <WidgetShell title="Items Requiring Attention">
      <RowList rows={rows} empty="All clear" />
    </WidgetShell>
  );
};

export const BoqRecentlyEditedList = () => {
  const nav = useNavigate();
  const { data, isLoading } = useGetBoqRecentlyEditedQuery(5);

  return (
    <IconListWidget
      title="Recently Edited BOQs"
      subtitle="last 5 touched"
      data={data}
      isLoading={isLoading}
      iconFor={() => <FileText size={16} />}
      primary={(r) => r.boq_number || r.title}
      secondary={(r) => r.project_name || "—"}
      right={(r) => relativeTime(r.updated_at)}
      onClick={(r) => nav(`/boq/${r.id}`)}
    />
  );
};

/* ====================== PROJECT WISE ====================== */

export const BoqProjectWise = () => {
  const nav = useNavigate();
  const { data: rows, isLoading } = useGetBoqProjectWiseQuery();

  if (isLoading || !rows) {
    return (
      <WidgetShell title="Project-Wise BOQs">
        <div className="text-[12px] text-[#B5C4B6] py-6 text-center">
          Loading…
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell
      title="Project-Wise BOQs"
      subtitle={`${rows.length} project${rows.length !== 1 ? "s" : ""}`}
    >
      <div className="overflow-y-auto h-full">
        <table className="w-full text-[15px]">
          <thead className="text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C] border-b border-[#D8E0DA]">
            <tr>
              <th className="text-left py-1.5">Project</th>
              <th className="text-center">BOQs</th>
              <th className="text-right">Value</th>
              <th className="text-center">Ver</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8E0DA]">
            {rows.slice(0, 6).map((r) => (
              <tr
                key={r.project_id}
                onClick={() => nav(`/projects/${r.project_id}?tab=boq`)}
                className="cursor-pointer hover:bg-[#EAEEF0]"
              >
                <td className="py-1.5 pr-2 truncate max-w-[140px] font-semibold text-[#333333]">
                  {r.project_name}
                </td>
                <td className="text-center text-[#6B7B7C]">{r.boq_count}</td>
                <td className="text-right font-semibold text-[#333333]">
                  {formatINRShort(r.total_value)}
                </td>
                <td className="text-center text-[#6B7B7C]">
                  V{r.latest_version}
                </td>
                <td className="text-center">
                  <StatusPill s={r.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-[#B5C4B6] py-4">
                  No BOQs yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
};

/* ====================== CHARTS ====================== */

export const BoqValueTrend = () => {
  const { data, isLoading } = useGetBoqValueTrendQuery();
  return (
    <HeroAreaChart
      title="BOQ Value Trend"
      subtitle="last 6 months"
      data={data}
      isLoading={isLoading}
    />
  );
};

export const BoqMonthlyVolume = () => {
  const { data, isLoading } = useGetBoqMonthlyVolumeQuery();
  return (
    <BarChartWidget
      title="Monthly BOQ Volume"
      subtitle="new BOQs / month"
      data={data}
      isLoading={isLoading}
      yKey="count"
    />
  );
};

export const BoqStatusDonut = () => {
  const { data, isLoading } = useGetBoqStatusMixQuery();

  const mix = data
    ? [
        { name: "Draft", value: data.draft || 0 },
        { name: "Awaiting Approval", value: data.awaiting_approval || 0 },
        { name: "Approved", value: data.approved || 0 },
        { name: "Archived", value: data.archived || 0 },
      ]
    : undefined;

  return (
    <DonutMix
      title="BOQs by Status"
      subtitle="lifecycle split"
      data={mix}
      isLoading={isLoading}
    />
  );
};

export const BoqVersionActivity = () => {
  const { data: p } = useGetBoqProductivityQuery();
  const series = p?.monthly_series || [];

  return (
    <WidgetShell title="Version Activity" subtitle="BOQs per month">
      <div className="flex items-end justify-between gap-2 h-full pt-2 pb-1">
        {series.map((s, i) => {
          const count = s.count || 0;
          const max = Math.max(1, ...series.map((item) => item.count || 0));
          const height = (count / max) * 100 || 6;

          const isCurrent = i === series.length - 1;

          return (
            <div
              key={s.month || i}
              className="flex-1 flex flex-col items-center gap-1.5 min-w-0"
            >
              <div
                className="w-full flex items-end justify-center"
                style={{ height: "70%" }}
              >
                <div
                  style={{
                    height: `${Math.max(6, height)}%`,
                    background: isCurrent ? "#1F453B" : "#000",
                  }}
                  className="w-full max-w-[24px] rounded-t"
                />
              </div>
              <div className="text-[9.5px] text-[#6B7B7C] font-medium">
                {s.month}
              </div>
              <div className="text-[10px] text-[#333333] font-bold">
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
};
export const BoqAvgCreationTime = () => {
  const { data: p } = useGetBoqProductivityQuery();
  return (
    <WidgetShell title="Avg BOQ Time">
      <Stat value={p ? `${p.avg_creation_time_minutes ?? 0} min` : "…"} />
    </WidgetShell>
  );
};
export const BoqHoursSaved = () => {
  const { data: p } = useGetBoqProductivityQuery();
  return (
    <WidgetShell title="Hours Saved">
      <Stat value={p ? (p.hours_saved ?? 0) : "…"} />
    </WidgetShell>
  );
};
