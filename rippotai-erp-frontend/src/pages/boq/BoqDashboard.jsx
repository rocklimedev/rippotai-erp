import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/lib/api";
import { formatINR, relativeTime } from "@/lib/format";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Plus,
  LayoutTemplate,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  Eye,
  Archive,
  Download,
  FolderKanban,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const STATUS_META = {
  draft: { label: "Draft", bg: "#B5C4B6", fg: "#6B7B7C" },
  in_progress: { label: "In Progress", bg: "#EAEEF0", fg: "#1F453B" },
  awaiting_approval: {
    label: "Awaiting Approval",
    bg: "#EAEEF0",
    fg: "#1F453B",
  },
  returned: { label: "Returned for Revision", bg: "#EAEEF0", fg: "#1F453B" },
  approved: { label: "Approved", bg: "#EAEEF0", fg: "#1F453B" },
  final: { label: "Final", bg: "#EAEEF0", fg: "#1F453B" },
  archived: { label: "Archived", bg: "#B5C4B6", fg: "#6B7B7C" },
};

function StatusChip({ status }) {
  const s = STATUS_META[status] || STATUS_META.draft;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

export default function BoqDashboard() {
  const nav = useNavigate();
  const location = useLocation();
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState(null);
  const [projects, setProjects] = useState([]);
  const initialStatus =
    new URLSearchParams(location.search).get("status") || "";
  const [filters, setFilters] = useState({
    project_id: "",
    status: initialStatus,
    q: "",
  });

  // React to browser back/forward changing ?status=
  useEffect(() => {
    const s = new URLSearchParams(location.search).get("status") || "";
    setFilters((f) => (f.status === s ? f : { ...f, status: s }));
  }, [location.search]);

  const load = () => {
    const params = new URLSearchParams();
    if (filters.project_id) params.set("project_id", filters.project_id);
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    api
      .get(`/boqs?${params.toString()}`)
      .then((r) => setRows(r.data))
      .catch(() => setRows([]));
  };

  useEffect(() => {
    api
      .get("/boqs/summary")
      .then((r) => setSummary(r.data))
      .catch(() => setSummary({}));
    api
      .get("/projects?limit=50")
      .then((r) => setProjects(r.data))
      .catch(() => {});
  }, []);
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [filters.project_id, filters.status, filters.q]);

  const filterByStatus = (status) => {
    const qs = status ? `?status=${status}` : "";
    nav(`/boq/all${qs}`);
  };

  const summaryCards = [
    { k: "total", l: "Total BOQs", v: summary?.total ?? "—", status: "" },
    {
      k: "drafts",
      l: "Draft BOQs",
      v: summary?.drafts ?? "—",
      status: "draft",
    },
    {
      k: "awaiting",
      l: "Awaiting Approval",
      v: summary?.awaiting ?? "—",
      status: "awaiting_approval",
    },
    {
      k: "approved",
      l: "Approved BOQs",
      v: summary?.approved ?? "—",
      status: "approved",
    },
    {
      k: "templates",
      l: "Templates",
      v: summary?.templates ?? "—",
      href: "/boq/templates",
    },
  ];

  const duplicate = async (id) => {
    try {
      const { data } = await api.post(`/boqs/${id}/duplicate-version`, {
        reason: "Revision",
        note: "",
      });
      toast.success(`Created ${data.version}`);
      nav(`/boq/${data.id}`);
    } catch (e) {
      toast.error("Failed to duplicate");
    }
  };

  const exportExcel = async (id) => {
    try {
      const res = await api.get(`/boqs/${id}/export/excel`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      const row = (rows || []).find((x) => x.id === id);
      a.href = url;
      a.download = `${row?.boq_number || `BOQ-${id}`}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${row?.boq_number || "BOQ"}.xlsx`);
    } catch (e) {
      toast.error("Export failed — retry");
    }
  };

  const downloadBoq = async (b) => {
    try {
      const res = await api.post(
        `/boqs/${b.id}/export/pdf`,
        {
          variant: "internal",
          show_rates: true,
          show_subtotals: true,
          include_terms: true,
          include_signatures: true,
          include_logo: true,
          include_location_column: true,
        },
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      const base = b.boq_number || `BOQ-${b.id}`;
      a.href = url;
      a.download = `${base}-internal.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${base}.pdf`);
    } catch (e) {
      toast.error("Download failed — retry");
    }
  };

  return (
    <div className="space-y-6" data-testid="boq-dashboard-page">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
            BOQ · Core Module
          </div>
          <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#333333]">
            Bill of Quantities
          </h1>
          <p className="text-[13.5px] text-[#6B7B7C] mt-1 max-w-2xl">
            Create project BOQs in minutes using predefined categories, items,
            units and rates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/boq/templates")}
            className="h-10 px-4 rounded-xl border border-[#B5C4B6] bg-white hover:bg-[#EAEEF0] text-[13px] font-semibold text-[#6B7B7C] flex items-center gap-2"
            data-testid="boq-templates-btn"
          >
            <LayoutTemplate size={15} /> Templates
          </button>
          <button
            onClick={() => toast.info("Excel import coming soon")}
            className="h-10 px-4 rounded-xl border border-[#B5C4B6] bg-white hover:bg-[#EAEEF0] text-[13px] font-semibold text-[#6B7B7C] flex items-center gap-2"
            data-testid="boq-import-btn"
          >
            <Upload size={15} /> Import Excel
          </button>
          <button
            onClick={() => nav("/boq/new")}
            className="h-10 px-4 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm"
            data-testid="boq-create-btn"
          >
            <Plus size={15} /> Create BOQ
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <section
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
        data-testid="boq-summary-strip"
      >
        {summaryCards.map((c) => (
          <button
            key={c.k}
            type="button"
            onClick={() => (c.href ? nav(c.href) : filterByStatus(c.status))}
            className="bc-card p-4 text-left hover:shadow-sm hover:border-[#1F453B] transition-shadow"
            data-testid={`boq-summary-${c.k}`}
          >
            <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
              {c.l}
            </div>
            <div className="text-[32px] font-bold text-[#333333] mt-1">
              {c.v}
            </div>
            {c.note && (
              <div className="text-[11px] text-[#7A2E1A] mt-0.5 font-medium">
                {c.note}
              </div>
            )}
          </button>
        ))}
      </section>

      {/* Filters */}
      <section className="bc-card p-4" data-testid="boq-filters">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5C4B6]"
            />
            <input
              className="bc-input pl-8"
              placeholder="Search by project name"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              data-testid="boq-filter-q"
            />
          </div>
          <select
            className="bc-input max-w-[220px]"
            value={filters.project_id}
            onChange={(e) =>
              setFilters((f) => ({ ...f, project_id: e.target.value }))
            }
            data-testid="boq-filter-project"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="bc-input max-w-[200px]"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
            data-testid="boq-filter-status"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="returned">Returned</option>
            <option value="approved">Approved</option>
            <option value="final">Final</option>
            <option value="archived">Archived</option>
          </select>
          <button
            className="h-10 px-3 rounded-lg border border-[#B5C4B6] hover:bg-[#EAEEF0] text-[12.5px] text-[#6B7B7C] flex items-center gap-1"
            onClick={() => setFilters({ project_id: "", status: "", q: "" })}
          >
            <Filter size={13} /> Clear
          </button>
        </div>
      </section>

      {/* Table */}
      <section className="bc-card overflow-hidden" data-testid="boq-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b border-[#B5C4B6]">
                <th className="px-3 py-3 font-semibold">BOQ Number</th>
                <th className="px-4 py-3 font-semibold">BOQ Title</th>
                <th className="px-3 py-3 font-semibold">Client</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold text-right">Cats</th>
                <th className="px-3 py-3 font-semibold text-right">Items</th>
                <th className="px-3 py-3 font-semibold text-right">Estimate</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="px-3 py-3 font-semibold w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows === null &&
                [1, 2, 3, 4].map((i) => (
                  <tr key={i} className="border-b border-[#B5C4B6]">
                    {Array(9)
                      .fill(0)
                      .map((_, j) => (
                        <td key={j} className="px-3 py-4">
                          <div className="bc-skeleton h-4 w-full" />
                        </td>
                      ))}
                  </tr>
                ))}
              {rows &&
                rows.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-[#B5C4B6] hover:bg-[#EAEEF0] cursor-pointer"
                    onClick={() => nav(`/boq/${b.id}`)}
                    data-testid={`boq-row-${b.id}`}
                  >
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className="text-[12px] font-mono font-bold text-[#333333] bg-[#EAEEF0] px-2 py-0.5 rounded"
                        data-testid={`boq-number-${b.id}`}
                      >
                        {b.boq_number || `BOQ-V${b.version || 1}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[220px]">
                      <div className="text-[13.5px] font-semibold text-[#333333]">
                        {b.project_name}
                      </div>
                      <div className="text-[11.5px] text-[#B5C4B6]">
                        {b.title || "BOQ"}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C]">
                      {b.client_name || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip status={b.status} />
                    </td>
                    <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C] text-right">
                      {b.category_count ?? 0}
                    </td>
                    <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C] text-right">
                      {b.item_count ?? 0}
                    </td>
                    <td className="px-3 py-3 text-[13px] font-semibold text-[#333333] text-right whitespace-nowrap">
                      {formatINR(b.final_total || b.total_amount || 0)}
                    </td>
                    <td className="px-3 py-3 text-[11.5px] text-[#B5C4B6] whitespace-nowrap">
                      {relativeTime(b.updated_at)}
                    </td>
                    <td
                      className="px-3 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => downloadBoq(b)}
                          title="Download BOQ (internal PDF)"
                          data-testid={`boq-row-download-${b.id}`}
                          className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                        >
                          <Download size={16} />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1.5 rounded hover:bg-[#EAEEF0]"
                              data-testid={`boq-row-actions-${b.id}`}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onClick={() => nav(`/boq/${b.id}`)}
                            >
                              <Eye size={13} className="mr-2" /> Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicate(b.id)}>
                              <Copy size={13} className="mr-2" /> Duplicate
                              Version
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => nav(`/boq/${b.id}/preview`)}
                            >
                              <Eye size={13} className="mr-2" /> Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadBoq(b)}>
                              <Download size={13} className="mr-2" /> Download
                              BOQ
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[#333333]">
                              <Archive size={13} className="mr-2" /> Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              {rows && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EAEEF0] flex items-center justify-center mb-3">
                      <FileSpreadsheet size={20} className="text-[#333333]" />
                    </div>
                    <div className="text-[14px] font-semibold text-[#333333]">
                      No BOQs match your filters
                    </div>
                    <div className="text-[12.5px] text-[#6B7B7C] mt-1">
                      Adjust filters or create your first BOQ.
                    </div>
                    <button
                      onClick={() => nav("/boq/new")}
                      className="mt-4 h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold"
                      data-testid="boq-empty-create-btn"
                    >
                      Create First BOQ
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
