import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { relativeTime } from "@/lib/format";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";

import {
  WidgetShell,
  Stat,
  RowList,
  CHART,
  HeroAreaChart,
  DonutMix,
  IconListWidget,
} from "../common/hooks";

import {
  useGetVendorsSummaryQuery,
  useGetVendorsQuery,
  useGetSavedSearchesQuery,
  useGetVendorsByCategoryQuery,
  useGetVendorsProjectWiseQuery,
  useGetVendorsRequiringAttentionQuery,
  useGetVendorsOnboardingTrendQuery,
  useGetVendorsAvailabilityMixQuery,
  useGetVendorsRecentlyAddedQuery,
} from "../../api/vendor.api"; // ← adjust import path

/* -------- Vendors Widgets (RTK Query) -------- */

export const VendorsTotal = () => {
  const { data: s } = useGetVendorsSummaryQuery();
  return (
    <WidgetShell title="Total Vendors">
      <Stat value={s?.total ?? s?.total_vendors ?? 0} />
    </WidgetShell>
  );
};

export const VendorsVerified = () => {
  const { data: s } = useGetVendorsSummaryQuery();
  return (
    <WidgetShell title="Verified">
      <Stat value={s?.verified ?? 0} />
    </WidgetShell>
  );
};

export const VendorsAvailable = () => {
  const { data: s } = useGetVendorsSummaryQuery();
  return (
    <WidgetShell title="Available">
      <Stat value={s?.available ?? 0} />
    </WidgetShell>
  );
};

export const VendorsExpiring = () => {
  const { data: s } = useGetVendorsSummaryQuery();
  return (
    <WidgetShell title="Expiring Docs">
      <Stat value={s?.attention ?? 0} />
    </WidgetShell>
  );
};

export const VendorsByCategory = () => {
  const { data: v = [] } = useGetVendorsQuery({});
  const counts = {};
  v.forEach((x) => {
    const k = x.category || "Other";
    counts[k] = (counts[k] || 0) + 1;
  });

  const items = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const max = Math.max(1, ...items.map(([, c]) => c));

  return (
    <WidgetShell title="Vendors by Category">
      <div className="flex flex-col gap-2 mt-1">
        {items.map(([k, c]) => (
          <div key={k} className="text-[11.5px]">
            <div className="flex justify-between mb-0.5">
              <span className="text-[#333333] truncate">{k}</span>
              <span className="text-[#6B7B7C] font-semibold">{c}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1F453B]/8 overflow-hidden">
              <div
                style={{ width: `${(c / max) * 100}%`, background: "#000" }}
                className="h-full"
              />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-[12px] text-[#B5C4B6]">No vendors</div>
        )}
      </div>
    </WidgetShell>
  );
};

export const VendorsRecentlyAdded = () => {
  const nav = useNavigate();
  const { data: v = [] } = useGetVendorsQuery({});

  const rows = v.slice(0, 5).map((x) => ({
    id: x.id,
    title: x.name,
    subtitle: x.category,
    right: relativeTime(x.created_at),
  }));

  return (
    <WidgetShell title="Recently Added Vendors">
      <RowList rows={rows} onClick={(r) => nav(`/vendors/${r.id}`)} />
    </WidgetShell>
  );
};

export const VendorsPerformance = () => {
  const { data: v = [] } = useGetVendorsQuery({});

  const avgRating = v.length
    ? v.reduce((s, x) => s + (x.rating || 0), 0) / v.length
    : 0;
  const preferred = v.filter((x) => x.preferred).length;
  const withProjects = v.filter((x) => (x.completed_projects || 0) > 0).length;

  return (
    <WidgetShell title="Performance Summary" subtitle="across all vendors">
      <div className="grid grid-cols-3 gap-3 mt-1 h-full">
        <div>
          <div className="text-[10.5px] text-[#6B7B7C] uppercase font-semibold">
            Avg Rating
          </div>
          <div className="text-[34px] font-bold text-[#333333]">
            {avgRating.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] text-[#6B7B7C] uppercase font-semibold">
            Preferred
          </div>
          <div className="text-[34px] font-bold text-[#333333]">
            {preferred}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] text-[#6B7B7C] uppercase font-semibold">
            Active
          </div>
          <div className="text-[34px] font-bold text-[#333333]">
            {withProjects}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
};

export const VendorsSavedSearches = () => {
  const nav = useNavigate();
  const { data: s = [] } = useGetSavedSearchesQuery();

  const rows = s.slice(0, 5).map((x) => ({
    title: x.name,
    subtitle: x.filters_summary || "Saved filter",
  }));

  return (
    <WidgetShell title="Saved Vendor Searches">
      <RowList
        rows={rows}
        onClick={() => nav("/vendors")}
        empty="No saved searches"
      />
    </WidgetShell>
  );
};

/* -------- Phase 8 & 10 Widgets -------- */

export const VendorsCategoryWise = () => {
  const nav = useNavigate();
  const { data: items = [] } = useGetVendorsByCategoryQuery();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 7);
  const max = Math.max(1, ...items.map((r) => r.count));

  return (
    <WidgetShell
      title="Category-Wise Vendors"
      subtitle={`${items.length} categorie${items.length !== 1 ? "s" : ""}`}
    >
      <div className="flex flex-col gap-1.5 h-full overflow-y-auto pr-1">
        {visible.map((r) => (
          <button
            key={r.category}
            onClick={() =>
              nav(`/vendors/all?category=${encodeURIComponent(r.category)}`)
            }
            className="text-left group"
            data-testid={`vendor-cat-${r.category}`}
          >
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="font-semibold text-[#333333] truncate">
                {r.category}
              </span>
              <span className="text-[#6B7B7C]">
                <span className="font-semibold text-[#333333]">{r.count}</span>{" "}
                · {r.verified_count} verified
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#EAEEF0] overflow-hidden">
              <div
                style={{
                  width: `${(r.count / max) * 100}%`,
                  background: "#1F453B",
                }}
                className="h-full group-hover:opacity-80"
              />
            </div>
          </button>
        ))}
        {items.length > 7 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[10.5px] text-[#6B7B7C] font-semibold hover:text-[#333333] mt-1 text-left"
          >
            {expanded ? "Show less" : `Show ${items.length - 7} more`}
          </button>
        )}
        {items.length === 0 && (
          <div className="text-[12px] text-[#B5C4B6] py-6 text-center">
            No vendors yet
          </div>
        )}
      </div>
    </WidgetShell>
  );
};

export const VendorsProjectWise = () => {
  const nav = useNavigate();
  const { data: items = [] } = useGetVendorsProjectWiseQuery();

  return (
    <WidgetShell title="Project-Wise Assigned Vendors">
      <div className="overflow-y-auto h-full">
        <table className="w-full text-[15px]">
          <thead className="text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C] border-b border-[#D8E0DA]">
            <tr>
              <th className="text-left py-1.5">Project</th>
              <th className="text-center">Vendors</th>
              <th className="text-left">Categories</th>
              <th className="text-center">Availability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8E0DA]">
            {items.slice(0, 6).map((r) => (
              <tr
                key={r.project_id}
                onClick={() => nav(`/projects/${r.project_id}?tab=vendors`)}
                className="cursor-pointer hover:bg-[#EAEEF0]"
              >
                <td className="py-1.5 pr-2 truncate max-w-[130px] font-semibold text-[#333333]">
                  {r.project_name}
                </td>
                <td className="text-center text-[#333333] font-semibold">
                  {r.assigned_vendor_count}
                </td>
                <td className="pr-2">
                  <div className="flex flex-wrap gap-1">
                    {(r.categories || []).slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="text-[9.5px] px-1.5 py-0.5 rounded bg-[#EAEEF0] text-[#333333]"
                      >
                        {c}
                      </span>
                    ))}
                    {(r.categories || []).length > 3 && (
                      <span className="text-[9.5px] text-[#6B7B7C]">
                        +{(r.categories || []).length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-center">
                  <span
                    className={`text-[10px] font-semibold ${
                      r.availability_status === "available"
                        ? "text-[#333333]"
                        : "text-[#6B7B7C]"
                    }`}
                  >
                    {r.availability_status === "available"
                      ? "Available"
                      : "Limited"}
                  </span>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-[#B5C4B6] py-4">
                  No assignments
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
};

export const VendorsAttention = () => {
  const nav = useNavigate();
  const { data: d } = useGetVendorsRequiringAttentionQuery();
  const count = d?.count ?? 0;

  return (
    <WidgetShell
      title="Requiring Attention"
      action={
        count > 0 ? (
          <button
            onClick={() => nav("/vendors/all?filter=attention")}
            className="text-[10px] text-[#333333] font-semibold hover:underline"
          >
            Review →
          </button>
        ) : null
      }
    >
      <Stat value={count} />
    </WidgetShell>
  );
};

export const VendorsOnboardingTrend = () => (
  <HeroAreaChart
    title="Vendor Onboarding"
    subtitle="cumulative verified · 6 months"
    url="/dashboards/vendors/onboarding-trend?months=6" // still works if HeroAreaChart uses useGetVendorsOnboardingTrendQuery internally
    valueKey="cumulative_verified"
    currency={false}
  />
);

export const VendorsAvailabilityDonut = () => (
  <DonutMix
    title="Vendor Availability"
    subtitle="current mix"
    url="/dashboards/vendors/availability-mix"
    transform={(d) =>
      Object.entries(d)
        .map(([k, v]) => ({ name: k, value: v || 0 }))
        .filter((r) => r.value > 0)
    }
  />
);

export const VendorsCategoryBar = () => {
  const nav = useNavigate();
  const { data: items = [] } = useGetVendorsByCategoryQuery();
  const data = items.slice(0, 8).map((r) => ({ ...r, name: r.category }));

  return (
    <WidgetShell
      title="Category-Wise Vendors"
      subtitle={`top ${data.length} · click to open`}
    >
      <div className="h-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
            onClick={(e) => {
              const p = e?.activePayload?.[0]?.payload;
              if (p)
                nav(`/vendors/all?category=${encodeURIComponent(p.category)}`);
            }}
          >
            <CartesianGrid stroke={CHART.mist} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: CHART.muted, fontSize: 13 }}
              axisLine={{ stroke: CHART.stroke }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: CHART.muted, fontSize: 13 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${CHART.stroke}`,
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} fill={CHART.primary}>
              <LabelList
                dataKey="count"
                position="right"
                style={{ fill: CHART.primary, fontSize: 11, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetShell>
  );
};

export const VendorsRecentlyAddedList = () => {
  const nav = useNavigate();
  const { data: items = [] } = useGetVendorsRecentlyAddedQuery(5);

  return (
    <IconListWidget
      title="Recently Added Vendors"
      subtitle="last 5 onboarded"
      data={items} // ← prefer passing data directly if IconListWidget supports it
      iconFor={(r) => (
        <div className="text-[11px] font-bold">
          {(r.name || "?")
            .split(" ")
            .map((s) => s[0])
            .slice(0, 2)
            .join("")}
        </div>
      )}
      primary={(r) => r.name}
      secondary={(r) => r.category || "Uncategorised"}
      right={(r) => relativeTime(r.created_at)}
      onClick={(r) => nav(`/vendors/${r.id}`)}
    />
  );
};
