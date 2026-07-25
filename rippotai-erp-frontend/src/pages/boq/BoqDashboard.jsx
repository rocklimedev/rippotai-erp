import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useGetBoqsQuery,
  useDuplicateBoqVersionMutation,
  useCreateBoqNewVersionMutation,
  useLazyGetBoqVersionHistoryQuery,
  useCombineBoqsMutation,
  useDeleteBoqMutation,
  useExportBoqPdfMutation, // ← Added
} from "../../api/boq.api";
import { useGetProjectsQuery } from "../../api/project.api";
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
  FilePlus2,
  History,
  Eye,
  Trash2, // ← New icon for delete (replaces Archive)
  Download,
  Combine,
  Loader2,
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

const LOCKED_STATUSES = ["approved", "final", "awaiting_approval"];

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

  const [filters, setFilters] = useState({
    project_id: "",
    status: new URLSearchParams(location.search).get("status") || "",
    q: "",
  });

  const [selectedBoqs, setSelectedBoqs] = useState(new Set());
  // TODO: Replace this with real RTK Query when you add the endpoint
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    // Temporary fallback - replace with useGetBoqsSummaryQuery()
    // api.get("/boqs/summary").then(r => setSummary(r.data));
  }, []);
  // Sync with URL on back/forward navigation
  useEffect(() => {
    const statusFromUrl =
      new URLSearchParams(location.search).get("status") || "";
    setFilters((f) =>
      f.status === statusFromUrl ? f : { ...f, status: statusFromUrl },
    );
  }, [location.search]);

  // ==================== RTK Query ====================
  const { data: rows = [], isLoading: isBoqsLoading } = useGetBoqsQuery({
    project_id: filters.project_id || undefined,
    status: filters.status || undefined,
    q: filters.q || undefined,
  });

  const { data: projects = [] } = useGetProjectsQuery({
    limit: 100,
  });

  const [duplicateVersion, { isLoading: isDuplicating }] =
    useDuplicateBoqVersionMutation();
  const [createNewVersion, { isLoading: isVersioning }] =
    useCreateBoqNewVersionMutation();
  const [fetchVersionHistory] = useLazyGetBoqVersionHistoryQuery();
  const [combineBoqs, { isLoading: isCombining }] = useCombineBoqsMutation();
  const [deleteBoq, { isLoading: isDeleting }] = useDeleteBoqMutation();
  const [exportPdf] = useExportBoqPdfMutation(); // ← New
  const [exportingId, setExportingId] = useState(null); // which row's PDF is being generated

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

  // ==================== Combine Handler ====================
  const handleCombine = async () => {
    if (selectedBoqs.size < 2) {
      toast.error("Please select at least 2 BOQs to combine");
      return;
    }

    const title = window.prompt(
      "Enter a name for the combined BOQ:",
      `Combined BOQ - ${new Date().toLocaleDateString()}`,
    );

    if (title === null) return; // User cancelled

    try {
      const result = await combineBoqs({
        boqIds: Array.from(selectedBoqs),
        title: title.trim() || undefined,
      }).unwrap();

      toast.success("BOQs combined successfully!");
      setSelectedBoqs(new Set()); // Clear selection
      nav(`/boq/${result.id}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to combine BOQs");
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedBoqs);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedBoqs(newSet);
  };

  const selectAll = () => {
    if (selectedBoqs.size === rows.length) {
      setSelectedBoqs(new Set());
    } else {
      setSelectedBoqs(new Set(rows.map((b) => b.id)));
    }
  };

  // ==================== Existing Actions ====================
  const duplicate = async (id) => {
    const reason = window.prompt(
      "Reason for duplicating this version (optional):",
      "",
    );
    if (reason === null) return;

    try {
      const result = await duplicateVersion({
        id,
        reason: reason || undefined,
      }).unwrap();
      toast.success(`Created v${result?.version ?? "?"} as a new draft`);
      nav(`/boq/${result.id}`);
    } catch (e) {
      toast.error(e?.data?.message || "Failed to duplicate version");
    }
  };

  const createVersion = async (id) => {
    try {
      const result = await createNewVersion({ id }).unwrap();
      toast.success(`Created v${result?.version ?? "?"} draft to edit`);
      nav(`/boq/${result.id}`);
    } catch (e) {
      toast.error(e?.data?.message || "Failed to create a new version");
    }
  };

  const viewVersionHistory = async (id) => {
    try {
      const history = await fetchVersionHistory(id).unwrap();
      if (!history?.length) {
        toast.info("No version history yet");
        return;
      }
      const summaryText = history
        .map((v) => `v${v.version} — ${v.version_name}`)
        .join("\n");
      toast.message("Version history", { description: summaryText });
    } catch (e) {
      toast.error("Failed to load version history");
    }
  };

  const downloadBoq = async (b) => {
    const filename = `${b.boq_number || b.title || "BOQ"}.pdf`;
    setExportingId(b.id);
    try {
      await exportPdf({
        boqId: b.id,
        variant: "client",
        filename,
      }).unwrap();
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to export PDF");
    } finally {
      setExportingId(null);
    }
  };

  // ==================== Delete Handler ====================
  const handleDelete = async (b) => {
    const label = b.boq_number || b.title || "this BOQ";
    const confirmed = window.confirm(
      `Delete ${label}? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteBoq(b.id).unwrap();
      toast.success("BOQ deleted");
      setSelectedBoqs((prev) => {
        if (!prev.has(b.id)) return prev;
        const next = new Set(prev);
        next.delete(b.id);
        return next;
      });
    } catch (e) {
      toast.error(e?.data?.message || "Failed to delete BOQ");
    }
  };

  return (
    <div className="space-y-6" data-testid="boq-dashboard-page">
      {/* Header */}
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
          {/* Combine Button - Prominent when items selected */}
          {selectedBoqs.size >= 2 && (
            <button
              onClick={handleCombine}
              disabled={isCombining}
              className="h-10 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm"
            >
              <Combine size={16} />
              Combine {selectedBoqs.size} BOQs
            </button>
          )}

          <button
            onClick={() => nav("/boq/templates")}
            className="h-10 px-4 rounded-xl border border-[#B5C4B6] bg-white hover:bg-[#EAEEF0] text-[13px] font-semibold text-[#6B7B7C] flex items-center gap-2"
          >
            <LayoutTemplate size={15} /> Templates
          </button>
          <button
            onClick={() => toast.info("Excel import coming soon")}
            className="h-10 px-4 rounded-xl border border-[#B5C4B6] bg-white hover:bg-[#EAEEF0] text-[13px] font-semibold text-[#6B7B7C] flex items-center gap-2"
          >
            <Upload size={15} /> Import Excel
          </button>
          <button
            onClick={() => nav("/boq/new")}
            className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm"
          >
            <Plus size={15} /> Create BOQ
          </button>
        </div>
      </div>
      {/* Summary Cards */}
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
          >
            <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
              {c.l}
            </div>
            <div className="text-[32px] font-bold text-[#333333] mt-1">
              {c.v}
            </div>
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
            />
          </div>

          <select
            className="bc-input max-w-[220px]"
            value={filters.project_id}
            onChange={(e) =>
              setFilters((f) => ({ ...f, project_id: e.target.value }))
            }
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
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
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
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedBoqs.size === rows.length && rows.length > 0
                    }
                    onChange={selectAll}
                    className="rounded"
                  />
                </th>
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
              {isBoqsLoading &&
                [1, 2, 3, 4].map((i) => (
                  <tr key={i} className="border-b border-[#B5C4B6]">
                    {Array(10)
                      .fill(0)
                      .map((_, j) => (
                        <td key={j} className="px-3 py-4">
                          <div className="bc-skeleton h-4 w-full" />
                        </td>
                      ))}
                  </tr>
                ))}

              {!isBoqsLoading &&
                rows.map((b) => {
                  const isLocked =
                    b.locked || LOCKED_STATUSES.includes(b.status);
                  const isSelected = selectedBoqs.has(b.id);

                  return (
                    <tr
                      key={b.id}
                      className={`border-b border-[#B5C4B6] hover:bg-[#EAEEF0] cursor-pointer ${isSelected ? "bg-[#F0F7F4]" : ""}`}
                      onClick={() => nav(`/boq/${b.id}`)}
                    >
                      <td
                        className="px-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(b.id)}
                          className="rounded"
                        />
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-[12px] font-mono font-bold text-[#333333] bg-[#EAEEF0] px-2 py-0.5 rounded">
                          {b.boq_number || `BOQ-V${b.version || 1}`}
                        </span>
                        {b.boq_version?.version_name && (
                          <div className="text-[10px] text-[#B5C4B6] mt-0.5 truncate max-w-[100px]">
                            {b.boq_version.version_name}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 min-w-[220px]">
                        <div className="text-[13.5px] font-semibold text-[#333333]">
                          {b.project?.name || b.project_name}
                        </div>
                        <div className="text-[11.5px] text-[#B5C4B6]">
                          {b.title || "BOQ"}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C]">
                        {b.client_name || b.project?.client?.name || "—"}
                      </td>

                      <td className="px-3 py-3">
                        <StatusChip status={b.status} />
                      </td>

                      <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C] text-right">
                        {b.category_count ?? b.categories?.length ?? 0}
                      </td>

                      <td className="px-3 py-3 text-[12.5px] text-[#6B7B7C] text-right">
                        {b.item_count ?? 0}
                      </td>

                      <td className="px-3 py-3 text-[13px] font-semibold text-[#333333] text-right whitespace-nowrap">
                        {formatINR(
                          b.total_value ?? b.final_total ?? b.total_amount ?? 0,
                        )}
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
                            disabled={exportingId === b.id}
                            className="p-1.5 rounded hover:bg-[#EAEEF0] disabled:opacity-50"
                            title="Download PDF"
                          >
                            {exportingId === b.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded hover:bg-[#EAEEF0]">
                                <MoreHorizontal size={16} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem
                                onClick={() => nav(`/boq/${b.id}`)}
                              >
                                <Eye size={13} className="mr-2" /> Open
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isDuplicating}
                                onClick={() => duplicate(b.id)}
                              >
                                <Copy size={13} className="mr-2" /> Duplicate
                                Version
                              </DropdownMenuItem>
                              {isLocked && (
                                <DropdownMenuItem
                                  disabled={isVersioning}
                                  onClick={() => createVersion(b.id)}
                                >
                                  <FilePlus2 size={13} className="mr-2" />{" "}
                                  Create New Version
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => viewVersionHistory(b.id)}
                              >
                                <History size={13} className="mr-2" /> Version
                                History
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => nav(`/boq/${b.id}/preview`)}
                              >
                                <Eye size={13} className="mr-2" /> Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={exportingId === b.id}
                                onClick={() => downloadBoq(b)}
                              >
                                {exportingId === b.id ? (
                                  <Loader2
                                    size={13}
                                    className="mr-2 animate-spin"
                                  />
                                ) : (
                                  <Download size={13} className="mr-2" />
                                )}
                                Download BOQ (PDF)
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={isDeleting}
                                onClick={() => handleDelete(b)}
                                className="text-red-600 focus:text-red-700"
                              >
                                <Trash2 size={13} className="mr-2" /> Delete BOQ
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!isBoqsLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EAEEF0] flex items-center justify-center mb-3">
                      <FileSpreadsheet size={20} className="text-[#333333]" />
                    </div>
                    <div className="text-[14px] font-semibold text-[#333333]">
                      No BOQs match your filters
                    </div>
                    <button
                      onClick={() => nav("/boq/new")}
                      className="mt-4 h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold"
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
