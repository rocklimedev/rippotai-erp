import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
  RotateCcw,
  FileText,
  Download,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  useGetProjectsSummaryQuery,
  useGetProjectsQuery,
  useArchiveProjectMutation,
  useRestoreProjectMutation,
  useDeleteProjectMutation,
} from "../../api/project.api";

// -----------------------------------------------------------------------------
// STATUS
// -----------------------------------------------------------------------------

const STATUS_LABEL = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  on_hold: "On Hold",
};

const STATUS_TONE = {
  active: {
    bg: "#EAEEF0",
    fg: "#1F453B",
  },

  completed: {
    bg: "#EAEEF0",
    fg: "#1F453B",
  },

  archived: {
    bg: "#B5C4B6",
    fg: "#6B7B7C",
  },

  on_hold: {
    bg: "#B5C4B6",
    fg: "#6B7B7C",
  },
};

// -----------------------------------------------------------------------------
// DOCUMENT TEMPLATES
// -----------------------------------------------------------------------------

const DOCUMENT_TEMPLATES = [
  {
    id: "site-visit-schedule-template",
    name: "Site Visit Schedule Template",
    description:
      "Standard template for planning and recording project site visits.",
    type: "Template",
    format: "PDF",
    file: "/templates/site-visit-schedule-template.pdf",
  },
  {
    id: "how-we-work",
    name: "How We Work",
    description:
      "Overview of the standard project workflow, processes, responsibilities, and ways of working.",
    type: "Guideline",
    format: "PDF",
    file: "/templates/how-we-work.pdf",
  },
];

// -----------------------------------------------------------------------------
// STATUS CHIP
// -----------------------------------------------------------------------------

function StatusChip({ status }) {
  const t = STATUS_TONE[status] || STATUS_TONE.active;

  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{
        background: t.bg,
        color: t.fg,
      }}
    >
      {STATUS_LABEL[status] || status || "—"}
    </span>
  );
}

// -----------------------------------------------------------------------------
// DATE FORMATTER
// -----------------------------------------------------------------------------

function formatDate(value) {
  if (!value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// -----------------------------------------------------------------------------
// DOCUMENTS VIEW
// -----------------------------------------------------------------------------

function DocumentsView() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[#EAEEF0] flex items-center justify-center">
            <FileText size={18} className="text-[#1F453B]" />
          </div>

          <div>
            <h2 className="text-[15px] font-semibold text-[#333333]">
              Project Documents
            </h2>

            <p className="text-[12px] text-[#6B7B7C] mt-0.5">
              Approved templates and documents available for download.
            </p>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="border border-[#B5C4B6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-[#EAEEF0]">
              <tr className="border-b border-[#B5C4B6]">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[#6B7B7C] font-semibold">
                  Document
                </th>

                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[#6B7B7C] font-semibold">
                  Type
                </th>

                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[#6B7B7C] font-semibold">
                  Format
                </th>

                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-[#6B7B7C] font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {DOCUMENT_TEMPLATES.map((document) => (
                <tr
                  key={document.id}
                  className="border-b border-[#EAEEF0] last:border-b-0 hover:bg-[#F8FAF9] transition-colors"
                >
                  {/* Document */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#EAEEF0] flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-[#1F453B]" />
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-[#333333]">
                          {document.name}
                        </div>

                        <div className="text-[11px] text-[#6B7B7C] mt-0.5">
                          {document.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-4 text-[#6B7B7C]">{document.type}</td>

                  {/* Format */}
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#EAEEF0] text-[#1F453B] text-[10px] font-bold">
                      {document.format}
                    </span>
                  </td>

                  {/* Download */}
                  <td className="px-4 py-4 text-right">
                    <a
                      href={document.file}
                      download
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold hover:bg-[#16362F] transition-colors"
                      data-testid={`download-document-${document.id}`}
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// PROJECTS DASHBOARD
// -----------------------------------------------------------------------------

export default function ProjectsDashboard() {
  const nav = useNavigate();

  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  // ---------------------------------------------------------------------------
  // PROJECT QUERIES
  // ---------------------------------------------------------------------------

  const {
    data: summary,
    isFetching: summaryLoading,
    isError: summaryError,
  } = useGetProjectsSummaryQuery();

  const {
    data: rows = [],
    isFetching: rowsLoading,
    isError: rowsError,
  } = useGetProjectsQuery();

  // ---------------------------------------------------------------------------
  // PROJECT MUTATIONS
  // ---------------------------------------------------------------------------

  const [archiveProject] = useArchiveProjectMutation();
  const [restoreProject] = useRestoreProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  // ---------------------------------------------------------------------------
  // ERROR HANDLING
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (summaryError || rowsError) {
      toast.error("Failed to load projects");
    }
  }, [summaryError, rowsError]);

  const loading = summaryLoading || rowsLoading;

  // ---------------------------------------------------------------------------
  // FILTER PROJECTS
  // ---------------------------------------------------------------------------

  const filtered = rows.filter((r) => {
    if (tab === "active" && r.status !== "active") {
      return false;
    }

    if (tab === "completed" && r.status !== "completed") {
      return false;
    }

    if (tab === "on_hold" && r.status !== "on_hold") {
      return false;
    }

    if (tab === "archived" && r.status !== "archived") {
      return false;
    }

    if (
      q &&
      !r.name?.toLowerCase().includes(q.toLowerCase()) &&
      !r.client?.name?.toLowerCase().includes(q.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // ---------------------------------------------------------------------------
  // ARCHIVE
  // ---------------------------------------------------------------------------

  const handleArchive = async (id, name) => {
    if (!window.confirm(`Archive project "${name}"?`)) {
      return;
    }

    try {
      await archiveProject({
        id,
        archived_by: "current_user",
      }).unwrap();

      toast.success(`Project "${name}" has been archived`);
    } catch (err) {
      toast.error("Failed to archive project");
    }
  };

  // ---------------------------------------------------------------------------
  // RESTORE
  // ---------------------------------------------------------------------------

  const handleRestore = async (id, name) => {
    if (!window.confirm(`Restore project "${name}"?`)) {
      return;
    }

    try {
      await restoreProject(id).unwrap();

      toast.success(`Project "${name}" has been restored`);
    } catch (err) {
      toast.error("Failed to restore project");
    }
  };

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `PERMANENTLY DELETE "${name}"?\n\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteProject(id).unwrap();

      toast.success(`Project "${name}" deleted successfully`);
    } catch (err) {
      toast.error("Failed to delete project");
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-[1440px] mx-auto p-6 space-y-5">
      {/* =====================================================================
          HEADER
      ====================================================================== */}

      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-[34px] font-bold text-[#333333] tracking-tight">
            Projects
          </h1>

          <p className="text-[13.5px] text-[#6B7B7C] mt-1 max-w-[620px]">
            Manage every project from initial briefing to final handover through
            one connected workspace.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => nav("/projects/new")}
            className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#16362F] transition-colors"
            data-testid="btn-create-project"
          >
            <Plus size={14} />
            Create Project
          </button>
        </div>
      </div>

      {/* =====================================================================
          SUMMARY
      ====================================================================== */}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            ["Total", summary.total],
            ["Active", summary.active],
            ["On Time", summary.on_time],
            ["Delayed", summary.delayed],
            ["Awaiting Action", summary.awaiting_action],
            ["Near Handover", summary.near_handover],
            ["Completed", summary.completed],
          ].map(([label, value]) => (
            <div
              key={label}
              className="bg-white border border-[#B5C4B6] rounded-xl p-4"
              data-testid={`project-summary-${label
                .replace(/\s+/g, "-")
                .toLowerCase()}`}
            >
              <div className="text-[11px] uppercase tracking-wider text-[#B5C4B6]">
                {label}
              </div>

              <div className="text-[34px] font-bold text-[#333333] mt-1 leading-none">
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          MAIN CONTENT
      ====================================================================== */}

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white border border-[#B5C4B6] rounded-xl overflow-hidden">
          {/* =================================================================
              TABS
          ================================================================== */}

          <div className="border-b border-[#B5C4B6] flex gap-1 p-2 overflow-x-auto">
            {[
              ["all", "All"],
              ["active", "Active"],
              ["completed", "Completed"],
              ["on_hold", "On Hold"],
              ["archived", "Archived"],
              ["documents", "Documents"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                data-testid={`project-tab-${key}`}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap transition-colors ${
                  tab === key
                    ? "bg-[#EAEEF0] text-[#333333]"
                    : "text-[#6B7B7C] hover:bg-[#EAEEF0]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* =================================================================
              CONTENT
          ================================================================== */}

          <div className="p-4">
            {/* ===============================================================
                DOCUMENTS
            ================================================================ */}

            {tab === "documents" ? (
              <DocumentsView />
            ) : (
              <>
                {/* =============================================================
                    SEARCH
                ============================================================= */}

                <div className="relative mb-3 max-w-md">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5C4B6]"
                  />

                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search projects…"
                    className="w-full pl-9 pr-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0] outline-none focus:ring-2 focus:ring-[#1F453B]/10"
                    data-testid="project-search"
                  />
                </div>

                {/* =============================================================
                    PROJECT TABLE
                ============================================================= */}

                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-[12.5px]">
                    <colgroup>
                      <col className="w-auto" />
                      <col className="w-[18%]" />
                      <col className="w-[14%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-10" />
                    </colgroup>

                    <thead className="text-[11px] uppercase text-[#B5C4B6]">
                      <tr className="border-b border-[#B5C4B6]">
                        <th className="text-left py-2 pr-3">Project</th>

                        <th className="text-left py-2 pr-3">Client</th>

                        <th className="text-left py-2 pr-3">Type</th>

                        <th className="text-left py-2 pr-3">Status</th>

                        <th className="text-left py-2 pr-3">ECD</th>

                        <th className="w-10"></th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Loading */}
                      {loading && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-6 text-center text-[#B5C4B6]"
                          >
                            Loading…
                          </td>
                        </tr>
                      )}

                      {/* Empty */}
                      {!loading && filtered.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-6 text-center text-[#B5C4B6]"
                          >
                            No projects match.
                          </td>
                        </tr>
                      )}

                      {/* Projects */}
                      {filtered.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-[#EAEEF0] hover:bg-[#EAEEF0] group transition-colors"
                        >
                          {/* -------------------------------------------------
                              PROJECT
                          -------------------------------------------------- */}

                          <td
                            className="py-2.5 pr-3 cursor-pointer truncate"
                            onClick={() => nav(`/projects/${p.id}`)}
                          >
                            <div className="font-semibold text-[#333333] truncate">
                              {p.name}
                            </div>

                            <div className="text-[11px] text-[#B5C4B6] truncate">
                              {p.slug || ""}
                            </div>
                          </td>

                          {/* -------------------------------------------------
                              CLIENT
                          -------------------------------------------------- */}

                          <td
                            className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer truncate"
                            onClick={() => nav(`/projects/${p.id}`)}
                          >
                            {p.client?.name || "—"}
                          </td>

                          {/* -------------------------------------------------
                              TYPE
                          -------------------------------------------------- */}

                          <td
                            className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer truncate"
                            onClick={() => nav(`/projects/${p.id}`)}
                          >
                            {p.project_type?.name || "—"}
                          </td>

                          {/* -------------------------------------------------
                              STATUS
                          -------------------------------------------------- */}

                          <td
                            className="py-2.5 pr-3 cursor-pointer"
                            onClick={() => nav(`/projects/${p.id}`)}
                          >
                            <StatusChip status={p.status} />
                          </td>

                          {/* -------------------------------------------------
                              ECD
                          -------------------------------------------------- */}

                          <td
                            className="py-2.5 pr-3 text-[#6B7B7C] cursor-pointer truncate"
                            onClick={() => nav(`/projects/${p.id}`)}
                          >
                            {formatDate(p.expected_completion_date)}
                          </td>

                          {/* -------------------------------------------------
                              ACTIONS
                          -------------------------------------------------- */}

                          <td className="py-2.5">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 rounded-lg hover:bg-[#EAEEF0] text-[#6B7B7C] hover:text-[#333333] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                                  data-testid={`project-actions-${p.id}`}
                                >
                                  <MoreHorizontal size={18} />
                                </button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end" className="w-48">
                                {/* View */}
                                <DropdownMenuItem
                                  onSelect={() => nav(`/projects/${p.id}`)}
                                >
                                  <Edit size={16} className="mr-2" />
                                  View
                                </DropdownMenuItem>

                                {/* Edit */}
                                <DropdownMenuItem
                                  onSelect={() => nav(`/projects/${p.id}/edit`)}
                                >
                                  <Edit size={16} className="mr-2" />
                                  Edit
                                </DropdownMenuItem>

                                {/* Archive / Restore */}
                                {p.status !== "archived" ? (
                                  <DropdownMenuItem
                                    onSelect={() => handleArchive(p.id, p.name)}
                                    className="text-amber-700"
                                  >
                                    <Archive size={16} className="mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onSelect={() => handleRestore(p.id, p.name)}
                                    className="text-emerald-700"
                                  >
                                    <RotateCcw size={16} className="mr-2" />
                                    Restore
                                  </DropdownMenuItem>
                                )}

                                {/* Delete */}
                                <DropdownMenuItem
                                  onSelect={() => handleDelete(p.id, p.name)}
                                  className="text-red-600"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
