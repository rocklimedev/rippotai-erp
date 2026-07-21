import React from "react";
import { useNavigate } from "react-router-dom";
import { formatINR } from "@/lib/format";
import { ArrowUp, ArrowDown } from "lucide-react";
import { WidgetShell, Stat, RowList, BarChartWidget } from "../common/hooks";
import { useGetReviewQuery } from "../../api/leads.api";

/* Every widget below shares this one call — RTK Query dedupes it, so
 * dropping all 5 Leads widgets on a dashboard still only fires 1 request. */
const useLeadsReview = () => useGetReviewQuery(7);

/* ====================== STAT WIDGETS ====================== */

export const LeadsKpiRow = () => {
  const { data, isLoading } = useLeadsReview();

  if (isLoading || !data) {
    return (
      <WidgetShell title="Lead Metrics">
        <div className="text-[12px] text-[#B5C4B6] py-6 text-center">
          Loading…
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell title="Lead Metrics">
      <div
        className="grid gap-4 h-full"
        style={{ gridTemplateColumns: `repeat(${data.kpis.length || 1}, 1fr)` }}
      >
        {data.kpis.map((k) => (
          <div key={k.label} className="flex flex-col justify-end min-w-0">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C] font-semibold truncate">
              {k.label}
            </div>
            <Stat value={k.value} note={k.sub} />
          </div>
        ))}
      </div>
    </WidgetShell>
  );
};

/* ====================== CHARTS ====================== */

export const LeadsConversionByStage = () => {
  const { data, isLoading } = useLeadsReview();
  const rows = (data?.convBars || []).map((b) => ({
    label: b.label,
    pct: b.pct,
  }));

  return (
    <BarChartWidget
      title="Conversion Rate by Stage"
      data={rows}
      isLoading={isLoading}
      xKey="label"
      yKey="pct"
      horizontal
      formatValue={(v) => `${v}%`}
    />
  );
};

export const LeadsAvgTimeInStage = () => {
  const { data, isLoading } = useLeadsReview();
  const rows = data?.timeBars || [];
  const maxAvg = 14;

  if (isLoading || !data) {
    return (
      <WidgetShell title="Average Time in Stage">
        <div className="text-[12px] text-[#B5C4B6] py-6 text-center">
          Loading…
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell title="Average Time in Stage">
      <div className="flex flex-col gap-3.5 h-full overflow-y-auto">
        {rows.map((b) => {
          const warn = b.avgDays > 9;
          const pct = Math.min(100, (b.avgDays / maxAvg) * 100);
          return (
            <div key={b.label} className="flex flex-col gap-1.5 shrink-0">
              <div className="flex justify-between text-[12px]">
                <span className="text-[#6B7B7C]">{b.label}</span>
                <span
                  className="font-medium"
                  style={{ color: warn ? "#a3701a" : "#333333" }}
                >
                  {b.avgDays} d
                </span>
              </div>
              <div className="h-2 rounded-[4px] overflow-hidden bg-[#EAEEF0]">
                <div
                  className="h-full rounded-[4px]"
                  style={{
                    width: `${pct}%`,
                    background: warn ? "#c98f2b" : "#1F453B",
                  }}
                />
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="text-[11.5px] text-[#B5C4B6] py-4 text-center">
            No data
          </div>
        )}
      </div>
    </WidgetShell>
  );
};

export const LeadsBySource = () => {
  const { data, isLoading } = useLeadsReview();
  const rows = data?.sourceRows || [];
  const maxSource = Math.max(1, ...rows.map((s) => s.count || 0));

  if (isLoading || !data) {
    return (
      <WidgetShell title="Leads by Source">
        <div className="text-[12px] text-[#B5C4B6] py-6 text-center">
          Loading…
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell title="Leads by Source">
      <div className="flex flex-col gap-3.5 h-full overflow-y-auto">
        {rows.map((s) => (
          <div key={s.label} className="flex flex-col gap-1.5 shrink-0">
            <div className="flex justify-between text-[12px]">
              <span className="text-[#6B7B7C]">{s.label}</span>
              <span className="text-[#333333] font-medium">
                {s.count} leads · {s.won} won
              </span>
            </div>
            <div className="h-2 rounded-[4px] overflow-hidden bg-[#EAEEF0]">
              <div
                className="h-full rounded-[4px]"
                style={{
                  width: `${(s.count / maxSource) * 100}%`,
                  background: "#1F453B",
                }}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-[11.5px] text-[#B5C4B6] py-4 text-center">
            No data
          </div>
        )}
      </div>
    </WidgetShell>
  );
};

/* ====================== LIST WIDGETS ====================== */

export const LeadsStuckLeads = () => {
  const nav = useNavigate();
  const { data, isLoading } = useLeadsReview();

  const rows = (data?.stuckRows || []).map((r) => ({
    id: r.id,
    title: r.name,
    subtitle: `${r.stage} · ${r.owner}`,
    right: (
      <span style={{ color: "#a3701a", fontWeight: 600 }}>{r.days} d</span>
    ),
  }));

  if (isLoading) {
    return (
      <WidgetShell title="Stuck Leads" subtitle=">7 days">
        <div className="text-[12px] text-[#B5C4B6] py-6 text-center">
          Loading…
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell title="Stuck Leads" subtitle=">7 days">
      <RowList
        rows={rows}
        onClick={(r) => nav(`/leads/${r.id}`)}
        empty="No stuck leads"
      />
    </WidgetShell>
  );
};
