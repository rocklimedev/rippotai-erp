import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  Edit3,
  FileText,
  Trash2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import {
  useGetScopeOfWorkQuery,
  useUpdateScopeOfWorkMutation,
  useDeleteScopeOfWorkMutation,
} from "../../api/scope-of-work.api";

export default function ScopeOfWorkList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // ============================================================
  // OPTIONAL PROJECT FILTER
  // ============================================================

  const projectFilter =
    new URLSearchParams(window.location.search).get("project_id") || "";

  // ============================================================
  // GET ALL SCOPE OF WORK
  // ============================================================

  const { data, isFetching, isLoading, isError, error } =
    useGetScopeOfWorkQuery();

  // ============================================================
  // MUTATIONS
  // ============================================================

  const [updateScopeOfWork] = useUpdateScopeOfWorkMutation();

  const [deleteScopeOfWork] = useDeleteScopeOfWorkMutation();

  // ============================================================
  // NORMALIZE RESPONSE
  // ============================================================

  const rows = useMemo(() => {
    if (!data) {
      return [];
    }

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.scopeOfWork)) {
      return data.scopeOfWork;
    }

    if (Array.isArray(data.data)) {
      return data.data;
    }

    return data ? [data] : [];
  }, [data]);

  // ============================================================
  // PROJECT FILTER + SEARCH
  // ============================================================

  const filteredRows = useMemo(() => {
    let result = rows;

    // ----------------------------------------------------------
    // Project filter
    // ----------------------------------------------------------

    if (projectFilter) {
      result = result.filter((r) => {
        const rowProjectId = r.project_id || r.projectId || r.project?.id || "";

        return String(rowProjectId) === String(projectFilter);
      });
    }

    // ----------------------------------------------------------
    // Search
    // ----------------------------------------------------------

    const term = q.trim().toLowerCase();

    if (!term) {
      return result;
    }

    return result.filter((r) => {
      const projectName =
        r.project_name || r.projectName || r.project?.name || "";

      const status = r.status || "";

      const projectMode = r.project_mode || r.projectMode || "";

      const scopeSummary = r.scope_summary || r.scopeSummary || "";

      const version = r.version ?? "";

      return (
        String(projectName).toLowerCase().includes(term) ||
        String(status).toLowerCase().includes(term) ||
        String(projectMode).toLowerCase().includes(term) ||
        String(scopeSummary).toLowerCase().includes(term) ||
        String(version).includes(term)
      );
    });
  }, [rows, q, projectFilter]);

  // ============================================================
  // STATUS
  // ============================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "APPROVED":
      case "ACCEPTED":
        return "bg-[#E8F3EE] text-[#1F453B]";

      case "REVIEW":
      case "UNDER_REVIEW":
      case "IN_REVIEW":
        return "bg-[#EAF1F8] text-[#315A7D]";

      case "SUBMITTED":
        return "bg-[#FFF4DC] text-[#8A6500]";

      case "REJECTED":
      case "CANCELLED":
        return "bg-[#FBEAEA] text-[#9B3D3D]";

      case "DRAFT":
      default:
        return "bg-[#F4F6F7] text-[#6B7B7C]";
    }
  };

  const formatStatus = (status) => {
    return (status || "DRAFT")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const STATUS_OPTIONS = [
    {
      value: "DRAFT",
      label: "Draft",
    },
    {
      value: "IN_REVIEW",
      label: "In Review",
    },
    {
      value: "SUBMITTED",
      label: "Submitted",
    },
    {
      value: "APPROVED",
      label: "Approved",
    },
    {
      value: "REJECTED",
      label: "Rejected",
    },
    {
      value: "CANCELLED",
      label: "Cancelled",
    },
  ];

  // ============================================================
  // CLEAR PROJECT FILTER
  // ============================================================

  const clearProjectFilter = () => {
    nav("/scope-of-work");
  };

  // ============================================================
  // CREATE
  // ============================================================

  const handleCreate = () => {
    if (projectFilter) {
      nav(`/crm/forms/scope-of-work?project_id=${projectFilter}`);
      return;
    }

    nav("/crm/forms/scope-of-work");
  };

  // ============================================================
  // VIEW
  // ============================================================

  const handleView = (id) => {
    nav(`/crm/scope-of-work/${id}`);
  };

  // ============================================================
  // EDIT
  // ============================================================

  const handleEdit = (id) => {
    nav(`/crm/forms/scope-of-work/${id}/edit`);
  };

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  const handleStatusChange = async (row, status) => {
    if (!row?.id) {
      return;
    }

    const currentStatus = row.status || "DRAFT";

    if (currentStatus === status) {
      return;
    }

    try {
      setUpdatingStatusId(row.id);

      await updateScopeOfWork({
        id: row.id,
        body: {
          status,
        },
      }).unwrap();

      toast.success(`Scope of Work status updated to ${formatStatus(status)}`);
    } catch (err) {
      console.error("Failed to update Scope of Work status:", err);

      toast.error(
        err?.data?.message ||
          err?.message ||
          "Failed to update Scope of Work status",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (row) => {
    if (!row?.id) {
      return;
    }

    const projectName =
      row.project_name ||
      row.projectName ||
      row.project?.name ||
      "this Scope of Work";

    const confirmed = window.confirm(
      `Are you sure you want to delete the Scope of Work for "${projectName}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(row.id);

      await deleteScopeOfWork(row.id).unwrap();

      toast.success("Scope of Work deleted successfully");
    } catch (err) {
      console.error("Failed to delete Scope of Work:", err);

      toast.error(
        err?.data?.message || err?.message || "Failed to delete Scope of Work",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Shell
      title="Scope of Work"
      subtitle={
        projectFilter
          ? `${filteredRows.length} document${
              filteredRows.length !== 1 ? "s" : ""
            } for this project`
          : `${rows.length} document${rows.length !== 1 ? "s" : ""}`
      }
      action={
        <button
          onClick={handleCreate}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#17382F] transition-colors"
          data-testid="scope-of-work-new-btn"
        >
          <Plus size={14} />
          New Scope of Work
        </button>
      }
    >
      {/* ========================================================
          FILTERS
      ======================================================== */}

      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search scope of work..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        {projectFilter && (
          <button
            onClick={clearProjectFilter}
            className="text-[13px] text-[#333333] font-semibold hover:text-[#1F453B]"
          >
            Clear project filter ×
          </button>
        )}
      </div>

      {/* ========================================================
          ERROR
      ======================================================== */}

      {isError && (
        <Card>
          <div className="py-10 text-center">
            <div className="text-[14px] font-semibold text-[#9B3D3D]">
              Unable to load Scope of Work
            </div>

            <div className="mt-1 text-[13px] text-[#6B7B7C]">
              {error?.data?.message ||
                error?.error ||
                "Something went wrong while loading Scope of Work."}
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================
          TABLE
      ======================================================== */}

      {!isError && (
        <Card>
          <div className="overflow-x-auto">
            <table
              className="w-full text-[14px]"
              data-testid="scope-of-work-table"
            >
              <thead className="bg-[#F4F6F7]">
                <tr>
                  <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                    Scope of Work
                  </th>

                  <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                    Project
                  </th>

                  <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                    Mode
                  </th>

                  <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                    Version
                  </th>

                  <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                    Status
                  </th>

                  <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                    Updated
                  </th>

                  <th className="text-right px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C] w-[145px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* ==================================================
                    LOADING
                ================================================== */}

                {isLoading && (
                  <tr>
                    <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw size={15} className="animate-spin" />
                        Loading scope of work...
                      </div>
                    </td>
                  </tr>
                )}

                {/* ==================================================
                    ROWS
                ================================================== */}

                {!isLoading &&
                  !isFetching &&
                  filteredRows.map((r) => {
                    const projectName =
                      r.project_name || r.projectName || r.project?.name || "—";

                    const projectMode = r.project_mode || r.projectMode || "—";

                    const version = r.version ?? 1;

                    const status = r.status || "DRAFT";

                    const updated =
                      r.updated_at ||
                      r.updatedAt ||
                      r.created_at ||
                      r.createdAt ||
                      "";

                    const scopeSummary =
                      r.scope_summary || r.scopeSummary || "Scope of Work";

                    const isUpdating = updatingStatusId === r.id;

                    const isDeleting = deletingId === r.id;

                    return (
                      <tr
                        key={r.id}
                        onClick={() => handleView(r.id)}
                        className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer transition-colors"
                        data-testid={`scope-of-work-row-${r.id}`}
                      >
                        {/* Scope of Work */}

                        <td className="px-3 py-2.5 font-semibold text-[#333333] max-w-[320px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <FileText
                              size={14}
                              className="shrink-0 text-[#B5C4B6]"
                            />

                            <span className="truncate">{scopeSummary}</span>
                          </div>
                        </td>

                        {/* Project */}

                        <td className="px-3 py-2.5 text-[#6B7B7C] max-w-[240px]">
                          <span className="truncate block">{projectName}</span>
                        </td>

                        {/* Mode */}

                        <td className="px-3 py-2.5 text-[#6B7B7C]">
                          {projectMode}
                        </td>

                        {/* Version */}

                        <td className="px-3 py-2.5 text-[#6B7B7C]">
                          v{version}
                        </td>

                        {/* Status */}

                        <td
                          className="px-3 py-2.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-flex">
                            <select
                              value={status}
                              disabled={isUpdating}
                              onChange={(e) =>
                                handleStatusChange(r, e.target.value)
                              }
                              className={`
                                appearance-none
                                pl-3
                                pr-8
                                py-1.5
                                rounded-full
                                text-[11px]
                                font-bold
                                tracking-wide
                                border-0
                                outline-none
                                cursor-pointer
                                disabled:opacity-60
                                disabled:cursor-not-allowed
                                ${getStatusClass(status)}
                              `}
                              data-testid={`scope-of-work-status-${r.id}`}
                              title="Update status"
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>

                            {isUpdating ? (
                              <RefreshCw
                                size={12}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin pointer-events-none"
                              />
                            ) : (
                              <ChevronDown
                                size={12}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
                              />
                            )}
                          </div>
                        </td>

                        {/* Updated */}

                        <td className="px-3 py-2.5 text-[#6B7B7C]">
                          {String(updated).slice(0, 10) || "—"}
                        </td>

                        {/* Actions */}

                        <td
                          className="px-3 py-2.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-0.5">
                            {/* View */}

                            <button
                              onClick={() => handleView(r.id)}
                              className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333] transition-colors"
                              title="View"
                              data-testid={`scope-of-work-view-${r.id}`}
                            >
                              <Eye size={15} />
                            </button>

                            {/* Edit */}

                            <button
                              onClick={() => handleEdit(r.id)}
                              className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333] transition-colors"
                              title="Edit"
                              data-testid={`scope-of-work-edit-${r.id}`}
                            >
                              <Edit3 size={15} />
                            </button>

                            {/* Delete */}

                            <button
                              onClick={() => handleDelete(r)}
                              disabled={isDeleting || isUpdating}
                              className="p-1.5 rounded hover:bg-[#FBEAEA] text-[#9B3D3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                              data-testid={`scope-of-work-delete-${r.id}`}
                            >
                              {isDeleting ? (
                                <RefreshCw size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {/* ==================================================
                    FETCHING
                ================================================== */}

                {isFetching && !isLoading && (
                  <tr>
                    <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw size={15} className="animate-spin" />
                        Refreshing scope of work...
                      </div>
                    </td>
                  </tr>
                )}

                {/* ==================================================
                    EMPTY
                ================================================== */}

                {!isFetching && !isLoading && !filteredRows.length && (
                  <tr>
                    <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                      {q
                        ? "No scope of work documents match your search."
                        : projectFilter
                          ? "No scope of work found for this project."
                          : "No scope of work found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Shell>
  );
}
