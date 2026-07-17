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
