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
