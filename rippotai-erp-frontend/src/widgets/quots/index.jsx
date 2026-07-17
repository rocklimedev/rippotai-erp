import React from "react";
import { useNavigate } from "react-router-dom";
import { formatINRShort, relativeTime } from "@/lib/format";
import { Clock } from "lucide-react";
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
  useGetQuotationsSummaryQuery,
  useGetQuotationsQuery,
  useGetQuotationsProjectWiseQuery,
  useGetQuotationsExpiringSoonQuery,
  useGetQuotationsBoqVarianceQuery,
  useGetQuotationsValueTrendQuery,
  useGetQuotationsStatusMixQuery,
  useGetQuotationsVariationByProjectQuery,
} from "../../api/quotation.api";

/* -------- Quotations stat / list widgets -------- */

export const QuotTotal = () => {
  const { data: s } = useGetQuotationsSummaryQuery();
  return (
    <WidgetShell title="Total Estimates">
      <Stat value={s ? (s.total ?? 0) : "…"} />
    </WidgetShell>
  );
};

export const QuotAwaitingReview = () => {
  const { data: s } = useGetQuotationsSummaryQuery();
  return (
    <WidgetShell title="Awaiting Review">
      <Stat value={s ? (s.awaiting_review ?? 0) : "…"} />
    </WidgetShell>
  );
};

export const QuotAwaitingApproval = () => {
  const { data: s } = useGetQuotationsSummaryQuery();
  const v = s?.awaiting_approval ?? 0;
  return (
    <WidgetShell title="Awaiting Approval">
      <Stat value={s ? v : "…"} />
    </WidgetShell>
  );
};

export const QuotExpiringSoon = () => {
  const { data: s } = useGetQuotationsSummaryQuery();
  const v = s?.expiring_soon ?? 0;
  return (
    <WidgetShell title="Expiring Soon">
      <Stat value={s ? v : "…"} />
    </WidgetShell>
  );
};

export const QuotBoqVariation = () => {
  const { data: s } = useGetQuotationsSummaryQuery();
  const v = s?.avg_variation_pct;
  return (
    <WidgetShell title="BOQ Variation">
      <Stat value={s ? (v != null ? `${v}%` : "—") : "…"} />
    </WidgetShell>
  );
};

export const QuotDrafts = () => {
  const { data: s } = useGetQuotationsSummaryQuery();
  return (
    <WidgetShell title="Draft Estimates">
      <Stat value={s ? (s.drafts ?? s.awaiting_review ?? 0) : "…"} />
    </WidgetShell>
  );
};

export const QuotRecentlyReceived = () => {
  const nav = useNavigate();
  const { data: q } = useGetQuotationsQuery();
  const rows = (q || [])
    .filter((x) => x.status === "received" || x.status === "under_review")
    .slice(0, 5)
    .map((x) => ({
      id: x.id,
      title: x.quotation_number || x.title,
      subtitle: x.vendor_name,
      right: formatINRShort(x.total_amount || 0),
    }));
  return (
    <WidgetShell title="Recently Received">
      <RowList
        rows={rows}
        onClick={(r) => nav(`/quotations/${r.id}`)}
        empty="No new quotations"
      />
    </WidgetShell>
  );
};

export const QuotRecentComparisons = () => {
  const nav = useNavigate();
  const { data: q } = useGetQuotationsQuery();
  const rows = (q || [])
    .filter((x) => x.compared_at)
    .slice(0, 5)
    .map((x) => ({
      id: x.id,
      title: x.quotation_number,
      subtitle: x.project_name,
      right: relativeTime(x.compared_at),
    }));
  return (
    <WidgetShell title="Recent Comparisons">
      <RowList
        rows={rows}
        onClick={() => nav("/quotations")}
        empty="No comparisons yet"
      />
    </WidgetShell>
  );
};

export const QuotReturned = () => {
  const nav = useNavigate();
  const { data: q } = useGetQuotationsQuery();
  const rows = (q || [])
    .filter((x) => x.status === "returned")
    .slice(0, 5)
    .map((x) => ({
      id: x.id,
      title: x.quotation_number,
      subtitle: x.vendor_name,
    }));
  return (
    <WidgetShell title="Returned Estimates">
      <RowList
        rows={rows}
        onClick={(r) => nav(`/quotations/${r.id}`)}
        empty="None returned"
      />
    </WidgetShell>
  );
};

export const QuotSelected = () => {
  const nav = useNavigate();
  const { data: q } = useGetQuotationsQuery();
  const rows = (q || [])
    .filter((x) => x.status === "selected" || x.selected)
    .slice(0, 5)
    .map((x) => ({
      id: x.id,
      title: x.quotation_number,
      subtitle: x.vendor_name,
      right: formatINRShort(x.total_amount || 0),
    }));
  return (
    <WidgetShell title="Selected Estimates">
      <RowList
        rows={rows}
        onClick={(r) => nav(`/quotations/${r.id}`)}
        empty="None selected yet"
      />
    </WidgetShell>
  );
};

/* -------- Phase 8 project-wise / expiring / variance -------- */

export const QuotProjectWise = () => {
  const nav = useNavigate();
  const { data: rows, isLoading } = useGetQuotationsProjectWiseQuery();

  if (isLoading || !rows)
    return (
      <WidgetShell title="Project-Wise Estimates">
        <div className="text-[12px] text-[#B5C4B6] py-6 text-center">
          Loading…
        </div>
      </WidgetShell>
    );

  return (
    <WidgetShell
      title="Project-Wise Estimates"
      subtitle={`${rows.length} project${rows.length !== 1 ? "s" : ""}`}
    >
      <div className="overflow-y-auto h-full">
        <table className="w-full text-[15px]">
          <thead className="text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C] border-b border-[#D8E0DA]">
            <tr>
              <th className="text-left py-1.5">Project</th>
              <th className="text-center">Quots</th>
              <th className="text-right">Value</th>
              <th className="text-center">Vendors</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8E0DA]">
            {rows.slice(0, 6).map((r) => (
              <tr
                key={r.project_id}
                onClick={() => nav(`/projects/${r.project_id}?tab=quotations`)}
                className="cursor-pointer hover:bg-[#EAEEF0]"
                data-testid={`quot-project-row-${r.project_id}`}
              >
                <td className="py-1.5 pr-2 truncate max-w-[140px] font-semibold text-[#333333]">
                  {r.project_name}
                </td>
                <td className="text-center text-[#6B7B7C]">
                  {r.quotation_count}
                </td>
                <td className="text-right font-semibold text-[#333333]">
                  {formatINRShort(r.combined_value)}
                </td>
                <td className="text-center text-[#6B7B7C]">{r.vendor_count}</td>
                <td className="text-center">
                  <StatusPill s={r.latest_status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-[#B5C4B6] py-4">
                  No quotations yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
};

export const QuotProjectWiseExpiring = () => {
  const nav = useNavigate();
  const { data: rows, isLoading } = useGetQuotationsExpiringSoonQuery(7);
  const items = rows || [];
  return (
    <WidgetShell title="Expiring Soon" subtitle="within 7 days">
      <div className="flex flex-col divide-y divide-[#D8E0DA] h-full overflow-y-auto">
        {!isLoading && items.length === 0 && (
          <div className="text-[11.5px] text-[#B5C4B6] py-4 text-center">
            No quotations expiring
          </div>
        )}
        {items.slice(0, 5).map((q) => (
          <button
            key={q.id}
            onClick={() => nav(`/quotations/${q.id}`)}
            className="py-1.5 text-left hover:bg-[#EAEEF0] rounded px-1"
            data-testid={`quot-expiring-${q.id}`}
          >
            <div className="text-[11.5px] font-semibold text-[#333333] truncate">
              {q.quotation_number || q.vendor_name}
            </div>
            <div className="flex justify-between text-[10.5px]">
              <span className="text-[#6B7B7C] truncate">{q.vendor_name}</span>
              <span className="text-[#333333] font-semibold">
                {q.days_left}d
              </span>
            </div>
          </button>
        ))}
      </div>
    </WidgetShell>
  );
};

export const QuotBoqVariance = () => {
  const { data: d } = useGetQuotationsBoqVarianceQuery();
  const v = d?.avg_variation_pct;
  return (
    <WidgetShell title="BOQ vs Estimate" subtitle="avg variation">
      <Stat value={d ? (v != null ? `${v > 0 ? "+" : ""}${v}%` : "—") : "…"} />
    </WidgetShell>
  );
};

/* -------- Phase 10 charts -------- */

export const QuotValueTrend = () => {
  const { data, isLoading } = useGetQuotationsValueTrendQuery(6);
  return (
    <HeroAreaChart
      title="Estimate Value Trend"
      subtitle="last 6 months"
      data={data}
      isLoading={isLoading}
    />
  );
};

export const QuotStatusDonut = () => {
  const { data, isLoading } = useGetQuotationsStatusMixQuery();
  const mix = data
    ? Object.entries(data)
        .map(([k, v]) => ({ name: k, value: v || 0 }))
        .filter((r) => r.value > 0)
    : undefined;
  return (
    <DonutMix
      title="Estimates by Status"
      subtitle="workflow split"
      data={mix}
      isLoading={isLoading}
    />
  );
};

export const QuotVarianceBar = () => {
  const { data, isLoading } = useGetQuotationsVariationByProjectQuery(6);
  return (
    <BarChartWidget
      title="BOQ vs Estimate"
      subtitle="avg variation % · top 6"
      data={data}
      isLoading={isLoading}
      xKey="project_name"
      yKey="avg_variation_pct"
      horizontal
      referenceZero
      formatValue={(v) => `${v}%`}
    />
  );
};

export const QuotExpiringSoonList = () => {
  const nav = useNavigate();
  const { data, isLoading } = useGetQuotationsExpiringSoonQuery(7);
  return (
    <IconListWidget
      title="Expiring Soon"
      subtitle="within 7 days"
      data={data}
      isLoading={isLoading}
      iconFor={() => <Clock size={16} />}
      primary={(r) => r.quotation_number || r.vendor_name}
      secondary={(r) => r.vendor_name || r.project_name}
      right={(r) => `${r.days_left}d`}
      onClick={(r) => nav(`/quotations/${r.id}`)}
    />
  );
};
