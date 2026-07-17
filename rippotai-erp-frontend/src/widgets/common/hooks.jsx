import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { formatINR, formatINRShort } from "@/lib/format";
import { ArrowUp, ArrowDown, ChevronRight, FileText } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts";

/* --------- Chart palette (muted, theme-blending — Phase F) --------- */
export const CHART = {
  primary: "#B8A99A",
  sage: "#9DB1A6",
  sageSoft: "#A0A4A8",
  mist: "#EAEEF0",
  muted: "#6B7B7C",
  stroke: "rgba(51,51,51,0.12)",
};
export const DONUT_SEGMENTS = [
  "#B8A99A",
  "#9DB1A6",
  "#A0A4A8",
  "#C2A98E",
  "#A8AC85",
  "#98A8B5",
];
export const CHART_SERIES = [
  "#B8A99A",
  "#9DB1A6",
  "#A0A4A8",
  "#C2A98E",
  "#A8AC85",
  "#98A8B5",
];

export const MONTH_LABEL = (yyyymm) => {
  if (!yyyymm) return "";
  const [, m] = String(yyyymm).split("-");
  return [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][(parseInt(m, 10) || 1) - 1];
};

/* -------- Shared widget primitives -------- */

export function WidgetShell({
  title,
  subtitle,
  children,
  action,
  dense,
  href,
}) {
  const nav = useNavigate();
  const clickable = !!href;
  const onClick = clickable ? () => nav(href) : undefined;
  const onKey = clickable
    ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          nav(href);
        }
      }
    : undefined;
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onKey}
      data-testid={
        clickable
          ? `widget-link-${title.toLowerCase().replace(/\s+/g, "-")}`
          : undefined
      }
      className={`h-full w-full nm-raised rounded-[16px] p-5 flex flex-col overflow-hidden ${clickable ? "cursor-pointer hover:shadow-md hover:border-[#1F453B] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#1F453B]/40" : ""}`}
    >
      <div className="flex items-start justify-between pb-2.5 mb-2.5 border-b border-[rgba(31,69,59,0.08)] shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <div
            title={title}
            className="text-[12px] uppercase tracking-[0.16em] text-[#6B7B7C] font-semibold truncate"
          >
            {title}
          </div>
          {/* Phase G: widget subtitles removed globally. Title-only headers. */}
        </div>
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      </div>
      <div
        className={`flex-1 min-h-0 min-w-0 ${dense ? "" : "overflow-hidden"}`}
      >
        {children}
      </div>
    </div>
  );
}

export function Stat({ value, delta, deltaDirection, note }) {
  return (
    <div className="flex flex-col justify-end h-full min-w-0">
      <div
        title={String(value)}
        className="bc-stat-number text-[36px] xl:text-[40px] font-semibold"
        style={{ color: "#333333", fontFamily: "Poppins" }}
      >
        {value}
      </div>
      {(delta !== undefined || note) && (
        <div className="mt-2 flex items-center gap-1.5 text-[15px] min-w-0">
          {deltaDirection === "up" && (
            <ArrowUp
              size={15}
              className="shrink-0"
              style={{ color: "#333333" }}
            />
          )}
          {deltaDirection === "down" && (
            <ArrowDown
              size={15}
              className="shrink-0"
              style={{ color: "#6B7B7C" }}
            />
          )}
          {delta !== undefined && (
            <span
              title={String(delta)}
              className="font-semibold truncate"
              style={{ color: "#333333" }}
            >
              {delta}
            </span>
          )}
          {/* Phase G: note text under value removed. */}
        </div>
      )}
    </div>
  );
}

export function RowList({ rows, empty = "No items yet", onClick }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-[12px] text-[#B5C4B6] py-6 text-center">{empty}</div>
    );
  }
  return (
    <div className="flex flex-col divide-y divide-[#D8E0DA] min-w-0 h-full overflow-y-auto">
      {rows.map((r, i) => (
        <button
          key={r.id || i}
          onClick={() => onClick && onClick(r)}
          className="flex items-center gap-3 py-2 px-1 text-left hover:bg-[#D8E0DA]/60 rounded-md min-w-0 w-full shrink-0"
        >
          <div className="flex-1 min-w-0">
            <div
              title={r.title}
              className="text-[12.5px] font-semibold text-[#333333] truncate"
            >
              {r.title}
            </div>
            {r.subtitle && (
              <div
                title={r.subtitle}
                className="text-[11px] text-[#6B7B7C] truncate"
              >
                {r.subtitle}
              </div>
            )}
          </div>
          {r.right && (
            <div
              title={String(r.right)}
              className="text-[11.5px] text-[#6B7B7C] shrink-0 whitespace-nowrap max-w-[120px] truncate"
            >
              {r.right}
            </div>
          )}
          {onClick && (
            <ChevronRight size={13} className="text-[#B5C4B6] shrink-0" />
          )}
        </button>
      ))}
    </div>
  );
}

export function StubWidget({ title, message }) {
  return (
    <WidgetShell title={title}>
      <div className="h-full flex items-center justify-center text-[11.5px] text-[#B5C4B6] text-center px-2">
        {message}
      </div>
    </WidgetShell>
  );
}

/* -------- Generic polling data hook used by every dashboard endpoint -------- */

export function useEndpoint(url, deps = []) {
  const [d, setD] = useState(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const fetchOnce = () =>
      api
        .get(url)
        .then((r) => {
          if (!cancelled) setD(r.data);
        })
        .catch(() => {});
    fetchOnce();
    // Poll every 30s while tab is visible
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") fetchOnce();
    }, 30000);
    // Refetch on window focus
    const onFocus = () => {
      if (document.visibilityState === "visible") fetchOnce();
    };
    // Refetch when a mutation elsewhere in the app requests a dashboard refresh
    const onRefresh = () => fetchOnce();
    window.addEventListener("focus", onFocus);
    window.addEventListener("bc:dashboard-refresh", onRefresh);
    return () => {
      cancelled = true;
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("bc:dashboard-refresh", onRefresh);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [url, nonce, ...deps]);
  return d;
}

/* -------- Status pill used by every project-wise / table widget -------- */

export const STATUS_PILL = {
  approved: { bg: "#D8E0DA", fg: "#333333", label: "Approved" },
  draft: { bg: "#EAEEF0", fg: "#6B7B7C", label: "Draft" },
  awaiting_approval: { bg: "#EAEEF0", fg: "#333333", label: "Pending" },
  returned: { bg: "#EAEEF0", fg: "#333333", label: "Returned" },
  received: { bg: "#D8E0DA", fg: "#333333", label: "Received" },
  selected: { bg: "#D8E0DA", fg: "#333333", label: "Selected" },
  under_review: { bg: "#EAEEF0", fg: "#333333", label: "Review" },
  on_track: { bg: "#D8E0DA", fg: "#333333", label: "On Track" },
  at_risk: { bg: "#EAEEF0", fg: "#333333", label: "At Risk" },
  delayed: { bg: "#B5C4B6", fg: "#333333", label: "Delayed" },
};
export const StatusPill = ({ s }) => {
  const m = STATUS_PILL[s] || {
    bg: "#EAEEF0",
    fg: "#6B7B7C",
    label: (s || "").replace("_", " "),
  };
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
};

/* ==========================================================
 * Phase 10 — Modern dashboard visuals (hero area / donut / bar / list-with-icons)
 * ========================================================== */

export function HeroAreaChart({
  title,
  subtitle,
  data,
  isLoading,
  valueKey = "total_value",
  currency = true,
}) {
  const series = (data || []).map((d) => ({
    ...d,
    label: MONTH_LABEL(d.month),
    _v: Number(d[valueKey] || 0),
  }));
  const last = series[series.length - 1];
  const latestValue = last ? last._v : 0;
  const prev = series.length > 1 ? series[series.length - 2]._v : 0;
  const deltaPct = prev > 0 ? ((latestValue - prev) / prev) * 100 : 0;
  const up = deltaPct >= 0;
  const gid = `heroGrad-${(title || "x").replace(/[^a-zA-Z0-9]/g, "")}`;

  if (isLoading) {
    return (
      <WidgetShell title={title} subtitle={subtitle}>
        <div className="text-[12px] text-[#B5C4B6] py-6 text-center">
          Loading…
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell title={title} subtitle={subtitle}>
      <div className="flex flex-col h-full">
        <div className="flex items-baseline gap-3 mb-2 shrink-0">
          <div
            className="text-[44px] font-semibold text-[#333333] tracking-tight leading-none"
            style={{ fontFamily: "Poppins" }}
            data-testid={`hero-value-${title}`}
          >
            {currency ? formatINRShort(latestValue) : latestValue}
          </div>
          <div
            className={`inline-flex items-center gap-1 text-[15px] font-semibold ${up ? "text-[#333333]" : "text-[#6B7B7C]"}`}
          >
            {up ? <ArrowUp size={15} /> : <ArrowDown size={15} />}{" "}
            {Math.abs(deltaPct).toFixed(1)}%
            <span className="text-[#6B7B7C] font-normal">vs prev</span>
          </div>
        </div>
        <div className="flex-1 min-h-[130px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 6, right: 8, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={CHART.primary}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={CHART.primary}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={CHART.mist}
                vertical={false}
                strokeDasharray="0"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: CHART.muted, fontSize: 13 }}
                axisLine={{ stroke: CHART.stroke }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART.muted, fontSize: 13 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (currency ? formatINRShort(v) : v)}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${CHART.stroke}`,
                  fontSize: 12,
                }}
                formatter={(v) => [currency ? formatINR(v) : v, ""]}
                labelFormatter={(l) => l}
              />
              <Area
                type="monotone"
                dataKey="_v"
                stroke={CHART.primary}
                strokeWidth={2}
                fill={`url(#${gid})`}
                activeDot={{
                  r: 5,
                  fill: CHART.primary,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </WidgetShell>
  );
}
export function StatCardWithTrend({
  title,
  value,
  deltaLabel,
  up = true,
  testid,
}) {
  return (
    <WidgetShell title={title}>
      <div className="flex flex-col justify-center h-full">
        <div
          className="text-[28px] font-semibold text-[#333333] leading-tight"
          data-testid={testid}
        >
          {value ?? "—"}
        </div>
        {deltaLabel != null && (
          <div
            className={`inline-flex items-center gap-1 text-[11.5px] font-semibold mt-1 ${up ? "text-[#333333]" : "text-[#6B7B7C]"}`}
          >
            {up ? <ArrowUp size={13} /> : <ArrowDown size={13} />} {deltaLabel}
          </div>
        )}
      </div>
    </WidgetShell>
  );
}

export function DonutMix({ title, subtitle, url, transform }) {
  const raw = useEndpoint(url);
  const rows = raw
    ? transform
      ? transform(raw)
      : Object.entries(raw).map(([k, v]) => ({ name: k, value: v }))
    : [];
  const total = rows.reduce((s, r) => s + (r.value || 0), 0);
  return (
    <WidgetShell title={title} subtitle={subtitle}>
      <div className="flex gap-4 h-full items-center">
        <div
          className="relative flex-shrink-0"
          style={{ width: 170, height: 170 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="value"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
              >
                {rows.map((_, i) => (
                  <Cell
                    key={i}
                    fill={DONUT_SEGMENTS[i % DONUT_SEGMENTS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: `1px solid ${CHART.stroke}`,
                  fontSize: 12,
                }}
                formatter={(v, n) => [v, n]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[#6B7B7C]">
              Total
            </div>
            <div
              className="text-[32px] font-semibold text-[#333333] leading-none"
              style={{ fontFamily: "Poppins" }}
            >
              {total}
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-full pr-1">
          {rows.map((r, i) => {
            const pct = total ? ((r.value / total) * 100).toFixed(0) : 0;
            return (
              <div
                key={r.name}
                className="flex items-center gap-2 text-[14px]"
                data-testid={`donut-legend-${r.name}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{
                    background: DONUT_SEGMENTS[i % DONUT_SEGMENTS.length],
                  }}
                />
                <span className="flex-1 text-[#333333] capitalize truncate">
                  {String(r.name).replace(/_/g, " ")}
                </span>
                <span className="text-[#6B7B7C]">
                  {r.value} · {pct}%
                </span>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="text-[11.5px] text-[#B5C4B6]">No data</div>
          )}
        </div>
      </div>
    </WidgetShell>
  );
}

export function BarChartWidget({
  title,
  subtitle,
  data,
  isLoading,
  xKey = "label",
  yKey = "count",
  labelKey,
  horizontal = false,
  referenceZero = false,
  formatValue,
}) {
  const rows = (Array.isArray(data) ? data : []).map((d) => ({
    ...d,
    label:
      d.label ||
      MONTH_LABEL(d.month) ||
      d[labelKey] ||
      d.project_name ||
      d.category ||
      "",
  }));
  const lastIdx = rows.length - 1;

  if (isLoading) {
    return (
      <WidgetShell title={title} subtitle={subtitle}>
        <div className="text-[12px] text-[#B5C4B6] py-6 text-center">
          Loading…
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell title={title} subtitle={subtitle}>
      <div className="h-full min-h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 4, right: 8, left: 6, bottom: 4 }}
            layout={horizontal ? "vertical" : "horizontal"}
          >
            <CartesianGrid
              stroke={CHART.mist}
              strokeDasharray="0"
              {...(horizontal ? { horizontal: false } : { vertical: false })}
            />
            {horizontal ? (
              <>
                <XAxis
                  type="number"
                  tick={{ fill: CHART.muted, fontSize: 12 }}
                  axisLine={{ stroke: CHART.stroke }}
                  tickLine={false}
                  tickFormatter={formatValue}
                />
                <YAxis
                  dataKey={xKey}
                  type="category"
                  tick={{ fill: CHART.muted, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                  interval={0}
                  tickFormatter={(v) =>
                    typeof v === "string" && v.length > 18
                      ? v.slice(0, 17) + "…"
                      : v
                  }
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={xKey}
                  tick={{ fill: CHART.muted, fontSize: 12 }}
                  axisLine={{ stroke: CHART.stroke }}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(v) =>
                    typeof v === "string" && v.length > 12
                      ? v.slice(0, 11) + "…"
                      : v
                  }
                />
                <YAxis
                  tick={{ fill: CHART.muted, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatValue}
                  width={44}
                />
              </>
            )}
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${CHART.stroke}`,
                fontSize: 12,
              }}
              formatter={(v) => [formatValue ? formatValue(v) : v, ""]}
            />
            {referenceZero && (
              <ReferenceLine
                {...(horizontal ? { x: 0 } : { y: 0 })}
                stroke={CHART.stroke}
              />
            )}
            <Bar
              dataKey={yKey}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            >
              {rows.map((r, i) => {
                const v = Number(r[yKey] || 0);
                const negative = referenceZero && v < 0;
                const fill =
                  i === lastIdx
                    ? CHART.primary
                    : negative
                      ? CHART.muted
                      : CHART.primary;
                return (
                  <Cell
                    key={i}
                    fill={fill}
                    stroke={i === lastIdx ? CHART.sage : "none"}
                    strokeWidth={i === lastIdx ? 2 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetShell>
  );
}

export function IconListWidget({
  title,
  subtitle,
  data,
  isLoading,
  iconFor,
  primary,
  secondary,
  right,
  onClick,
  empty = "No entries",
}) {
  const rows = Array.isArray(data) ? data : [];

  if (isLoading) {
    return (
      <WidgetShell title={title} subtitle={subtitle}>
        <div className="text-[11.5px] text-[#B5C4B6] py-4 text-center">
          Loading…
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell title={title} subtitle={subtitle}>
      <div className="flex flex-col divide-y divide-[#EAEEF0] h-full overflow-y-auto">
        {rows.length === 0 && (
          <div className="text-[11.5px] text-[#B5C4B6] py-4 text-center">
            {empty}
          </div>
        )}
        {rows.slice(0, 6).map((r, i) => (
          <button
            key={r.id || i}
            onClick={() => onClick && onClick(r)}
            className="flex items-center gap-2.5 py-2 text-left hover:bg-[#F4F6F7] rounded px-1"
            data-testid={`iconlist-${title}-${r.id || i}`}
          >
            <div className="w-9 h-9 rounded-lg border border-[rgba(31,69,59,0.12)] bg-white flex items-center justify-center flex-shrink-0 text-[#333333]">
              {iconFor ? iconFor(r) : <FileText size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-[#333333] truncate">
                {primary(r)}
              </div>
              <div className="text-[10.5px] text-[#6B7B7C] truncate">
                {secondary(r)}
              </div>
            </div>
            {right && (
              <div className="text-[10.5px] text-[#6B7B7C] font-semibold whitespace-nowrap">
                {right(r)}
              </div>
            )}
          </button>
        ))}
      </div>
    </WidgetShell>
  );
}
