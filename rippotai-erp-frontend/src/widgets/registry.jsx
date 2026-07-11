import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  formatINR,
  formatINRShort,
  relativeTime,
  daysUntil,
} from "@/lib/format";
import {
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  FileText,
  Building2,
  Users,
  Package,
} from "lucide-react";
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
const CHART = {
  primary: "#B8A99A",
  sage: "#9DB1A6",
  sageSoft: "#A0A4A8",
  mist: "#EAEEF0",
  muted: "#6B7B7C",
  stroke: "rgba(51,51,51,0.12)",
};
const DONUT_SEGMENTS = [
  "#B8A99A",
  "#9DB1A6",
  "#A0A4A8",
  "#C2A98E",
  "#A8AC85",
  "#98A8B5",
];
const CHART_SERIES = [
  "#B8A99A",
  "#9DB1A6",
  "#A0A4A8",
  "#C2A98E",
  "#A8AC85",
  "#98A8B5",
];

const MONTH_LABEL = (yyyymm) => {
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

function Stat({ value, delta, deltaDirection, note }) {
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

function RowList({ rows, empty = "No items yet", onClick }) {
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

/* -------- BOQ widgets -------- */

function useBoqSummary() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api
      .get("/boqs/summary")
      .then((r) => setS(r.data))
      .catch(() => setS({}));
  }, []);
  return s;
}
function useBoqProductivity() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api
      .get("/boq/productivity")
      .then((r) => setS(r.data))
      .catch(() => setS({}));
  }, []);
  return s;
}
function useBoqList() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api
      .get("/boqs")
      .then((r) => setS(r.data))
      .catch(() => setS([]));
  }, []);
  return s;
}

const BoqTotalBoqs = () => {
  const s = useBoqSummary();
  return (
    <WidgetShell title="Total BOQs" href="/boq/all">
      <Stat value={s ? (s.total ?? s.total_boqs ?? 0) : "…"} />
    </WidgetShell>
  );
};
const BoqDraftBoqs = () => {
  const s = useBoqSummary();
  return (
    <WidgetShell title="Draft BOQs" href="/boq/all?status=draft">
      <Stat value={s ? (s.drafts ?? 0) : "…"} />
    </WidgetShell>
  );
};
const BoqAwaitingApproval = () => {
  const s = useBoqSummary();
  const v = s?.awaiting_approval ?? 0;
  return (
    <WidgetShell
      title="Awaiting Approval"
      href="/boq/all?status=awaiting_approval"
    >
      <Stat value={s ? v : "…"} />
    </WidgetShell>
  );
};
const BoqApprovedBoqs = () => {
  const s = useBoqSummary();
  return (
    <WidgetShell title="Approved BOQs" href="/boq/all?status=approved">
      <Stat value={s ? (s.approved ?? 0) : "…"} />
    </WidgetShell>
  );
};
const BoqAvgCreationTime = () => {
  const p = useBoqProductivity();
  return (
    <WidgetShell title="Avg BOQ Time">
      <Stat value={p ? `${p.avg_creation_time_minutes ?? 0} min` : "…"} />
    </WidgetShell>
  );
};
const BoqHoursSaved = () => {
  const p = useBoqProductivity();
  return (
    <WidgetShell title="Hours Saved">
      <Stat value={p ? (p.hours_saved ?? 0) : "…"} />
    </WidgetShell>
  );
};
const BoqQuickCreate = () => {
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

const BoqRecentlyEdited = () => {
  const nav = useNavigate();
  const list = useBoqList();
  const rows = (list || []).slice(0, 5).map((b) => ({
    id: b.id,
    title: b.title || b.project_name,
    subtitle: `${b.version || "V1"} · ${b.status?.replace("_", " ")}`,
    right: relativeTime(b.updated_at),
  }));
  return (
    <WidgetShell title="Recently Edited BOQs">
      <RowList rows={rows} onClick={(r) => nav(`/boq/${r.id}`)} />
    </WidgetShell>
  );
};

const BoqValueSummary = () => {
  const list = useBoqList();
  const approved = (list || []).filter((b) => b.status === "approved");
  const total = approved.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  return (
    <WidgetShell title="Approved BOQ Value">
      <Stat value={formatINRShort(total)} />
    </WidgetShell>
  );
};

const BoqRecentlyApproved = () => {
  const nav = useNavigate();
  const list = useBoqList();
  const rows = (list || [])
    .filter((b) => b.status === "approved")
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      title: b.title || b.project_name,
      subtitle: b.version || "V1",
      right: formatINRShort(b.total_amount || 0),
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

const BoqAttentionItems = () => {
  const list = useBoqList();
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

const BoqVersionActivity = () => {
  const p = useBoqProductivity();
  const series = p?.monthly_series || [];
  const max = Math.max(1, ...series.map((s) => s.count || 0));
  return (
    <WidgetShell title="Version Activity" subtitle="BOQs per month">
      <div className="flex items-end justify-between gap-2 h-full pt-2 pb-1">
        {series.map((s, i) => {
          const h = ((s.count || 0) / max) * 100;
          const current = i === series.length - 1;
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
                    height: `${Math.max(6, h)}%`,
                    background: current ? "#1F453B" : "#000",
                  }}
                  className="w-full max-w-[24px] rounded-t"
                />
              </div>
              <div className="text-[9.5px] text-[#6B7B7C] font-medium">
                {s.month}
              </div>
              <div className="text-[10px] text-[#333333] font-bold">
                {s.count || 0}
              </div>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
};

/* -------- Projects widgets -------- */

function useProjectSummary() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api
      .get("/projects/summary")
      .then((r) => setS(r.data))
      .catch(() => setS({}));
  }, []);
  return s;
}
function useMilestones() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api
      .get("/milestones/upcoming?limit=5")
      .then((r) => setS(r.data))
      .catch(() => setS([]));
  }, []);
  return s;
}
function useProjects() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api
      .get("/projects/full")
      .then((r) => setS(r.data))
      .catch(() => setS([]));
  }, []);
  return s;
}
function useActivity() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api
      .get("/activity/recent?limit=10")
      .then((r) => setS(r.data))
      .catch(() => setS([]));
  }, []);
  return s;
}

const ProjActive = () => {
  const s = useProjectSummary();
  return (
    <WidgetShell title="Active Projects">
      <Stat value={s ? (s.active ?? 0) : "…"} />
    </WidgetShell>
  );
};
const ProjOnTime = () => {
  const s = useProjectSummary();
  return (
    <WidgetShell title="On-Time">
      <Stat value={s ? (s.on_time ?? 0) : "…"} />
    </WidgetShell>
  );
};
const ProjAtRisk = () => {
  const s = useProjectSummary();
  const v = s?.at_risk ?? 0;
  return (
    <WidgetShell title="At-Risk">
      <Stat value={s ? v : "…"} />
    </WidgetShell>
  );
};
const ProjDelayed = () => {
  const s = useProjectSummary();
  const v = s?.delayed ?? 0;
  return (
    <WidgetShell title="Delayed">
      <Stat value={s ? v : "…"} />
    </WidgetShell>
  );
};

const ProjCurrentPhases = () => {
  const list = useProjects();
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

const ProjUpcomingMilestones = () => {
  const nav = useNavigate();
  const m = useMilestones();
  const rows = (m || [])
    .slice(0, 5)
    .map((x) => ({
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

const ProjPendingWork = () => {
  const list = useProjects();
  const total = (list || []).reduce((s, p) => s + (p.pending_count || 0), 0);
  return (
    <WidgetShell title="Pending Work">
      <Stat value={total} />
    </WidgetShell>
  );
};

const ProjHandoverReadiness = () => {
  const nav = useNavigate();
  const list = useProjects();
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

const ProjTimelineVariance = () => {
  const list = useProjects();
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

const ProjRecentActivity = () => {
  const a = useActivity();
  const rows = (a || [])
    .slice(0, 8)
    .map((x) => ({
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

/* -------- Vendors widgets -------- */

function useVendorSummary() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api
      .get("/vendors/summary")
      .then((r) => setS(r.data))
      .catch(() => setS({}));
  }, []);
  return s;
}
function useVendors() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api
      .get("/vendors")
      .then((r) => setS(r.data))
      .catch(() => setS([]));
  }, []);
  return s;
}
function useSavedSearches() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api
      .get("/vendors/saved-searches")
      .then((r) => setS(r.data))
      .catch(() => setS([]));
  }, []);
  return s;
}

const VendorsTotal = () => {
  const s = useVendorSummary();
  return (
    <WidgetShell title="Total Vendors">
      <Stat value={s ? (s.total ?? s.total_vendors ?? 0) : "…"} />
    </WidgetShell>
  );
};
const VendorsVerified = () => {
  const s = useVendorSummary();
  return (
    <WidgetShell title="Verified">
      <Stat value={s ? (s.verified ?? 0) : "…"} />
    </WidgetShell>
  );
};
const VendorsAvailable = () => {
  const s = useVendorSummary();
  return (
    <WidgetShell title="Available">
      <Stat value={s ? (s.available ?? 0) : "…"} />
    </WidgetShell>
  );
};
const VendorsExpiring = () => {
  const s = useVendorSummary();
  const v = s?.attention ?? 0;
  return (
    <WidgetShell title="Expiring Docs">
      <Stat value={s ? v : "…"} />
    </WidgetShell>
  );
};
const VendorsByCategory = () => {
  const v = useVendors();
  const counts = {};
  (v || []).forEach((x) => {
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
const VendorsRecentlyAdded = () => {
  const nav = useNavigate();
  const v = useVendors();
  const rows = (v || [])
    .slice(0, 5)
    .map((x) => ({
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
const VendorsPerformance = () => {
  const v = useVendors();
  const list = v || [];
  const avgRating = list.length
    ? list.reduce((s, x) => s + (x.rating || 0), 0) / list.length
    : 0;
  const preferred = list.filter((x) => x.preferred).length;
  const withProjects = list.filter(
    (x) => (x.completed_projects || 0) > 0,
  ).length;
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
const VendorsSavedSearches = () => {
  const nav = useNavigate();
  const s = useSavedSearches();
  const rows = (s || [])
    .slice(0, 5)
    .map((x) => ({
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

/* -------- Quotations widgets -------- */

function useQuotSummary() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api
      .get("/quotations/summary")
      .then((r) => setS(r.data))
      .catch(() => setS({}));
  }, []);
  return s;
}
function useQuotations() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api
      .get("/quotations")
      .then((r) => setS(r.data))
      .catch(() => setS([]));
  }, []);
  return s;
}

const QuotTotal = () => {
  const s = useQuotSummary();
  return (
    <WidgetShell title="Total Estimates">
      <Stat value={s ? (s.total ?? 0) : "…"} />
    </WidgetShell>
  );
};
const QuotAwaitingReview = () => {
  const s = useQuotSummary();
  return (
    <WidgetShell title="Awaiting Review">
      <Stat value={s ? (s.awaiting_review ?? 0) : "…"} />
    </WidgetShell>
  );
};
const QuotAwaitingApproval = () => {
  const s = useQuotSummary();
  const v = s?.awaiting_approval ?? 0;
  return (
    <WidgetShell title="Awaiting Approval">
      <Stat value={s ? v : "…"} />
    </WidgetShell>
  );
};
const QuotExpiringSoon = () => {
  const s = useQuotSummary();
  const v = s?.expiring_soon ?? 0;
  return (
    <WidgetShell title="Expiring Soon">
      <Stat value={s ? v : "…"} />
    </WidgetShell>
  );
};
const QuotBoqVariation = () => {
  const s = useQuotSummary();
  const v = s?.avg_variation_pct;
  return (
    <WidgetShell title="BOQ Variation">
      <Stat value={s ? (v != null ? `${v}%` : "—") : "…"} />
    </WidgetShell>
  );
};
const QuotRecentlyReceived = () => {
  const nav = useNavigate();
  const q = useQuotations();
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
const QuotRecentComparisons = () => {
  const nav = useNavigate();
  const q = useQuotations();
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
const QuotReturned = () => {
  const nav = useNavigate();
  const q = useQuotations();
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
const QuotSelected = () => {
  const nav = useNavigate();
  const q = useQuotations();
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

/* -------- Phase F: Calendar / Notes / Tasks widgets -------- */
const CalendarTodayW = () => {
  const d = useEndpoint("/calendar/dashboard");
  return (
    <WidgetShell title="Today">
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-[36px] font-bold text-[#333333] leading-none">
          {d?.today?.length ?? "—"}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">events today</div>
      </div>
    </WidgetShell>
  );
};
const CalendarUpcomingW = () => {
  const nav = useNavigate();
  const d = useEndpoint("/calendar/dashboard");
  const rows = (d?.upcoming || [])
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      title: e.title,
      subtitle: `${e.type.replace(/_/g, " ")} · ${e.project_name || "General"}`,
      right: (e.starts_at || "").slice(5, 10),
    }));
  return (
    <WidgetShell title="Upcoming Events">
      <RowList
        rows={rows}
        onClick={() => nav("/calendar/team")}
        empty="No events in the next 7 days"
      />
    </WidgetShell>
  );
};
const NotesRecentW = () => {
  const nav = useNavigate();
  const d = useEndpoint("/notes-dashboard");
  const rows = (d?.recent || [])
    .slice(0, 5)
    .map((n) => ({
      id: n.id,
      title: n.title,
      subtitle: `${n.kind} · ${n.author}`,
      right: n.pinned ? "📌" : "",
    }));
  return (
    <WidgetShell title="Recent Notes">
      <RowList
        rows={rows}
        onClick={() => nav("/notes/all")}
        empty="No notes yet"
      />
    </WidgetShell>
  );
};
const NotesPinnedW = () => {
  const d = useEndpoint("/notes-dashboard");
  return (
    <WidgetShell title="Pinned">
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-[36px] font-bold text-[#333333] leading-none">
          {d?.pinned?.length ?? "—"}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">pinned notes</div>
      </div>
    </WidgetShell>
  );
};
const TasksDueTodayW = () => {
  const d = useEndpoint("/tasks/dashboard");
  return (
    <WidgetShell title="Due Today">
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-[36px] font-bold text-[#333333] leading-none">
          {d?.due_today ?? "—"}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">tasks due today</div>
      </div>
    </WidgetShell>
  );
};
const TasksOverdueW = () => {
  const d = useEndpoint("/tasks/dashboard");
  return (
    <WidgetShell title="Overdue">
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-[36px] font-bold text-[#B04D26] leading-none">
          {d?.overdue ?? "—"}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">need attention</div>
      </div>
    </WidgetShell>
  );
};
const TasksMineW = () => {
  const nav = useNavigate();
  const d = useEndpoint("/tasks/dashboard");
  const rows = (d?.mine || [])
    .slice(0, 6)
    .map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: `${t.priority} · ${t.project_name || "General"}`,
      right: (t.due_date || "").slice(5, 10),
    }));
  return (
    <WidgetShell title="My Tasks">
      <RowList
        rows={rows}
        onClick={() => nav("/tasks/mine")}
        empty="No open tasks assigned to you"
      />
    </WidgetShell>
  );
};

const DocumentsRecent = () => {
  const nav = useNavigate();
  const d = useEndpoint("/documents?limit=6");
  const rows = (d || []).slice(0, 6).map((x) => ({
    id: x.id,
    title: x.title || x.filename,
    subtitle: `${x.category || "—"} · ${x.uploaded_by_name || x.uploaded_by || "unknown"}`,
    right: (x.document_date || x.created_at || "").slice(5, 10),
  }));
  return (
    <WidgetShell title="Recent Documents">
      <RowList
        rows={rows}
        empty="No documents yet"
        onClick={() => nav("/documents/all")}
      />
    </WidgetShell>
  );
};

const DocumentsPending = () => {
  const d = useEndpoint("/documents?status=pending&limit=100");
  const count = Array.isArray(d) ? d.length : 0;
  return (
    <WidgetShell title="Pending Uploads">
      <Stat value={count} />
    </WidgetShell>
  );
};

function StubWidget({ title, message }) {
  return (
    <WidgetShell title={title}>
      <div className="h-full flex items-center justify-center text-[11.5px] text-[#B5C4B6] text-center px-2">
        {message}
      </div>
    </WidgetShell>
  );
}

/* -------- Phase 8 project-wise + category-wise widgets -------- */

function useEndpoint(url, deps = []) {
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

const STATUS_PILL = {
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
const StatusPill = ({ s }) => {
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

const BoqProjectWise = () => {
  const nav = useNavigate();
  const rows = useEndpoint("/dashboards/boq/project-wise");
  if (rows === null)
    return (
      <WidgetShell title="Project-Wise BOQs">
        <div className="text-[12px] text-[#B5C4B6] py-6 text-center">
          Loading…
        </div>
      </WidgetShell>
    );
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
                data-testid={`boq-project-row-${r.project_id}`}
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

const QuotProjectWise = () => {
  const nav = useNavigate();
  const rows = useEndpoint("/dashboards/quotations/project-wise");
  if (rows === null)
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

const ProjProjectWiseProgress = () => {
  const nav = useNavigate();
  const rows = useEndpoint("/dashboards/projects/progress");
  if (rows === null)
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

const ProjUpcomingMilestones4 = () => {
  const nav = useNavigate();
  const rows = useEndpoint("/dashboards/projects/upcoming-milestones?limit=4");
  const items = rows || [];
  return (
    <WidgetShell title="Upcoming Milestones">
      <div className="flex flex-col divide-y divide-[#D8E0DA] h-full overflow-y-auto">
        {items.length === 0 && (
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

const VendorsCategoryWise = () => {
  const nav = useNavigate();
  const rows = useEndpoint("/dashboards/vendors/by-category");
  const items = rows || [];
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
            data-testid="vendor-cat-toggle"
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

const VendorsProjectWise = () => {
  const nav = useNavigate();
  const rows = useEndpoint("/dashboards/vendors/project-wise");
  const items = rows || [];
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
                data-testid={`vendor-project-row-${r.project_id}`}
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
                        +{r.categories.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-center">
                  <span
                    className={`text-[10px] font-semibold ${r.availability_status === "available" ? "text-[#333333]" : "text-[#6B7B7C]"}`}
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

const VendorsAttention = () => {
  const nav = useNavigate();
  const d = useEndpoint("/dashboards/vendors/requiring-attention");
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
      <Stat value={d ? count : "…"} />
    </WidgetShell>
  );
};

const QuotProjectWiseExpiring = () => {
  const nav = useNavigate();
  const rows = useEndpoint(
    "/dashboards/quotations/expiring-soon?within_days=7",
  );
  const items = rows || [];
  return (
    <WidgetShell title="Expiring Soon" subtitle="within 7 days">
      <div className="flex flex-col divide-y divide-[#D8E0DA] h-full overflow-y-auto">
        {items.length === 0 && (
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

const QuotBoqVariance = () => {
  const d = useEndpoint("/dashboards/quotations/boq-variance");
  const v = d?.avg_variation_pct;
  return (
    <WidgetShell title="BOQ vs Estimate" subtitle="avg variation">
      <Stat value={d ? (v != null ? `${v > 0 ? "+" : ""}${v}%` : "—") : "…"} />
    </WidgetShell>
  );
};

const QuotDrafts = () => {
  const s = useQuotSummary();
  return (
    <WidgetShell title="Draft Estimates">
      <Stat value={s ? (s.drafts ?? s.awaiting_review ?? 0) : "…"} />
    </WidgetShell>
  );
};
const ProjTotal = () => {
  const s = useProjectSummary();
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

/* ==========================================================
 * Phase 10 — Modern dashboard visuals (hero area / donut / bar / list-with-icons)
 * ========================================================== */

function HeroAreaChart({
  title,
  subtitle,
  url,
  valueKey = "total_value",
  currency = true,
}) {
  const data = useEndpoint(url);
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
  const gid = `heroGrad-${(url || "x").replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <WidgetShell title={title} subtitle={subtitle}>
      <div className="flex flex-col h-full">
        <div className="flex items-baseline gap-3 mb-2 shrink-0">
          <div
            className="text-[44px] font-semibold text-[#333333] tracking-tight leading-none"
            style={{ fontFamily: "Poppins" }}
            data-testid={`hero-value-${url}`}
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

function StatCardWithTrend({ title, value, deltaLabel, up = true, testid }) {
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

function DonutMix({ title, subtitle, url, transform }) {
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

function BarChartWidget({
  title,
  subtitle,
  url,
  xKey = "label",
  yKey = "count",
  labelKey,
  horizontal = false,
  referenceZero = false,
  formatValue,
}) {
  const data = useEndpoint(url);
  const rows = (data || []).map((d) => ({
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

function IconListWidget({
  title,
  subtitle,
  url,
  iconFor,
  primary,
  secondary,
  right,
  onClick,
  empty = "No entries",
}) {
  const data = useEndpoint(url);
  const rows = data || [];
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

/* ------- Concrete widgets per app ------- */

// BOQ
const BoqValueTrend = () => (
  <HeroAreaChart
    title="BOQ Value Trend"
    subtitle="last 6 months"
    url="/dashboards/boq/value-trend?months=6"
  />
);
const BoqMonthlyVolume = () => (
  <BarChartWidget
    title="Monthly BOQ Volume"
    subtitle="new BOQs / month"
    url="/dashboards/boq/monthly-volume?months=6"
    yKey="count"
  />
);
const BoqStatusDonut = () => (
  <DonutMix
    title="BOQs by Status"
    subtitle="lifecycle split"
    url="/dashboards/boq/status-mix"
    transform={(d) => [
      { name: "Draft", value: d.draft || 0 },
      { name: "Awaiting Approval", value: d.awaiting_approval || 0 },
      { name: "Approved", value: d.approved || 0 },
      { name: "Archived", value: d.archived || 0 },
    ]}
  />
);
const BoqRecentlyEditedList = () => {
  const nav = useNavigate();
  return (
    <IconListWidget
      title="Recently Edited BOQs"
      subtitle="last 5 touched"
      url="/dashboards/boq/recently-edited?limit=5"
      iconFor={() => <FileText size={16} />}
      primary={(r) => r.boq_number || r.title}
      secondary={(r) => r.project_name || "—"}
      right={(r) => relativeTime(r.updated_at)}
      onClick={(r) => nav(`/boq/${r.id}`)}
    />
  );
};

// Quotations
const QuotValueTrend = () => (
  <HeroAreaChart
    title="Estimate Value Trend"
    subtitle="last 6 months"
    url="/dashboards/quotations/value-trend?months=6"
  />
);
const QuotStatusDonut = () => (
  <DonutMix
    title="Estimates by Status"
    subtitle="workflow split"
    url="/dashboards/quotations/status-mix"
    transform={(d) =>
      Object.entries(d)
        .map(([k, v]) => ({ name: k, value: v || 0 }))
        .filter((r) => r.value > 0)
    }
  />
);
const QuotVarianceBar = () => (
  <BarChartWidget
    title="BOQ vs Estimate"
    subtitle="avg variation % · top 6"
    url="/dashboards/quotations/variation-by-project?limit=6"
    xKey="project_name"
    yKey="avg_variation_pct"
    horizontal
    referenceZero
    formatValue={(v) => `${v}%`}
  />
);
const QuotExpiringSoonList = () => {
  const nav = useNavigate();
  return (
    <IconListWidget
      title="Expiring Soon"
      subtitle="within 7 days"
      url="/dashboards/quotations/expiring-soon?within_days=7"
      iconFor={() => <Clock size={16} />}
      primary={(r) => r.quotation_number || r.vendor_name}
      secondary={(r) => r.vendor_name || r.project_name}
      right={(r) => `${r.days_left}d`}
      onClick={(r) => nav(`/quotations/${r.id}`)}
    />
  );
};

// Projects
const ProjProgressTrend = () => (
  <HeroAreaChart
    title="Portfolio Progress Trend"
    subtitle="avg % complete · 6 months"
    url="/dashboards/projects/progress-trend?months=6"
    valueKey="avg_progress"
    currency={false}
  />
);
const ProjPhaseDonut = () => (
  <DonutMix
    title="Projects by Phase"
    subtitle="portfolio split"
    url="/dashboards/projects/phase-mix"
    transform={(d) =>
      Object.entries(d)
        .map(([k, v]) => ({ name: k, value: v || 0 }))
        .filter((r) => r.value > 0)
    }
  />
);
const ProjVarianceBar = () => (
  <BarChartWidget
    title="Timeline Variance"
    subtitle="schedule variance % · top 6"
    url="/dashboards/projects/variance-by-project?limit=6"
    xKey="project_name"
    yKey="variance_pct"
    horizontal
    referenceZero
    formatValue={(v) => `${v}%`}
  />
);

// Vendors
const VendorsOnboardingTrend = () => (
  <HeroAreaChart
    title="Vendor Onboarding"
    subtitle="cumulative verified · 6 months"
    url="/dashboards/vendors/onboarding-trend?months=6"
    valueKey="cumulative_verified"
    currency={false}
  />
);
const VendorsAvailabilityDonut = () => (
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
const VendorsCategoryBar = () => {
  const nav = useNavigate();
  const rows = useEndpoint("/dashboards/vendors/by-category");
  const items = rows || [];
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
const VendorsRecentlyAddedList = () => {
  const nav = useNavigate();
  return (
    <IconListWidget
      title="Recently Added Vendors"
      subtitle="last 5 onboarded"
      url="/dashboards/vendors/recently-added?limit=5"
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

/* -------- Registry -------- */

export const WIDGETS = {
  // BOQ
  "boq.total_boqs": BoqTotalBoqs,
  "boq.draft_boqs": BoqDraftBoqs,
  "boq.awaiting_approval": BoqAwaitingApproval,
  "boq.approved_boqs": BoqApprovedBoqs,
  "boq.project_wise": BoqProjectWise,
  "boq.recently_edited": BoqRecentlyEditedList,
  "boq.value_trend": BoqValueTrend,
  "boq.status_donut": BoqStatusDonut,
  "boq.monthly_volume": BoqMonthlyVolume,
  "boq.value_summary": BoqValueSummary,
  "boq.attention_items": BoqAttentionItems,
  "boq.version_activity": BoqVersionActivity,
  "boq.quick_create": BoqQuickCreate,
  // legacy keys kept for back-compat with saved layouts
  "boq.avg_creation_time": BoqAvgCreationTime,
  "boq.hours_saved": BoqHoursSaved,
  "boq.recently_approved": BoqRecentlyApproved,
  // Projects
  "projects.total": ProjTotal,
  "projects.active": ProjActive,
  "projects.on_time": ProjOnTime,
  "projects.at_risk": ProjAtRisk,
  "projects.delayed": ProjDelayed,
  "projects.progress_trend": ProjProgressTrend,
  "projects.phase_donut": ProjPhaseDonut,
  "projects.variance_bar": ProjVarianceBar,
  "projects.project_wise_progress": ProjProjectWiseProgress,
  "projects.upcoming_milestones": ProjUpcomingMilestones4,
  "projects.current_phases": ProjCurrentPhases,
  "projects.pending_work": ProjPendingWork,
  "projects.handover_readiness": ProjHandoverReadiness,
  "projects.timeline_variance": ProjTimelineVariance,
  "projects.recent_activity": ProjRecentActivity,
  // Vendors
  "vendors.total": VendorsTotal,
  "vendors.verified": VendorsVerified,
  "vendors.available": VendorsAvailable,
  "vendors.attention": VendorsAttention,
  "vendors.onboarding_trend": VendorsOnboardingTrend,
  "vendors.availability_donut": VendorsAvailabilityDonut,
  "vendors.category_bar": VendorsCategoryBar,
  "vendors.category_wise": VendorsCategoryWise,
  "vendors.project_wise": VendorsProjectWise,
  "vendors.recently_added": VendorsRecentlyAddedList,
  "vendors.expiring_docs": VendorsExpiring,
  "vendors.performance": VendorsPerformance,
  // legacy
  "vendors.by_category": VendorsByCategory,
  "vendors.saved_searches": VendorsSavedSearches,
  // Quotations
  "quot.total": QuotTotal,
  "quot.awaiting_approval": QuotAwaitingApproval,
  "quot.drafts": QuotDrafts,
  "quot.selected": QuotSelected,
  "quot.value_trend": QuotValueTrend,
  "quot.status_donut": QuotStatusDonut,
  "quot.variance_bar": QuotVarianceBar,
  "quot.project_wise": QuotProjectWise,
  "quot.expiring_soon": QuotExpiringSoonList,
  "quot.boq_variation": QuotBoqVariance,
  "quot.recently_received": QuotRecentlyReceived,
  "quot.recent_comparisons": QuotRecentComparisons,
  "quot.returned": QuotReturned,
  // legacy
  "quot.awaiting_review": QuotAwaitingReview,
  // Placeholder app stubs
  "clients.total": () => (
    <StubWidget
      title="Total Clients"
      message="Activates when Clients app launches"
    />
  ),
  "clients.recent": () => (
    <StubWidget
      title="Recent Clients"
      message="This widget will activate when Clients launches"
    />
  ),
  "calendar.today": CalendarTodayW,
  "calendar.upcoming": CalendarUpcomingW,
  "chats.unread": () => (
    <StubWidget title="Unread" message="Activates when Chats launches" />
  ),
  "chats.mentions": () => (
    <StubWidget title="My Mentions" message="Activates when Chats launches" />
  ),
  "tasks.due_today": TasksDueTodayW,
  "tasks.overdue": TasksOverdueW,
  "tasks.mine": TasksMineW,
  "notes.recent": NotesRecentW,
  "notes.pinned": NotesPinnedW,
  "documents.recent": DocumentsRecent,
  "documents.pending": DocumentsPending,
  "activity.recent": () => (
    <StubWidget
      title="Recent Activity"
      message="Activates when Activity launches"
    />
  ),
  "activity.mine": () => (
    <StubWidget
      title="My Activity"
      message="Activates when Activity launches"
    />
  ),
  "inventory.total_items": () => (
    <StubWidget
      title="Total Items"
      message="Activates when Inventory launches"
    />
  ),
  "inventory.low_stock": () => (
    <StubWidget title="Low Stock" message="Activates when Inventory launches" />
  ),
};
