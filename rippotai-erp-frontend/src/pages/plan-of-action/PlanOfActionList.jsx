import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  Edit3,
  ClipboardList,
  Trash2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import {
  useFindAllPlanOfActionsQuery,
  useFindPlanOfActionsByProjectQuery,
  useUpdatePlanOfActionMutation,
  useDeletePlanOfActionMutation,
  usePublishPlanOfActionMutation,
} from "../../api/plan-of-actions.api";

export default function PlanOfActionList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // ------------------------------------------------------------
  // Project filter
  // ------------------------------------------------------------

  const projectFilter =
    new URLSearchParams(window.location.search).get("project_id") || "";

  // ------------------------------------------------------------
  // Get ALL plans
  // ------------------------------------------------------------

  const {
    data: allRows = [],
    isFetching: isFetchingAll,
    isLoading: isLoadingAll,
  } = useFindAllPlanOfActionsQuery(undefined, {
    skip: !!projectFilter,
  });

  // ------------------------------------------------------------
  // Get plans for specific project
  // ------------------------------------------------------------

  const {
    data: projectRows = [],
    isFetching: isFetchingProject,
    isLoading: isLoadingProject,
  } = useFindPlanOfActionsByProjectQuery(projectFilter, {
    skip: !projectFilter,
  });

  // ------------------------------------------------------------
  // Mutations
  // ------------------------------------------------------------

  const [updatePlanOfAction] = useUpdatePlanOfActionMutation();
  const [deletePlanOfAction] = useDeletePlanOfActionMutation();
  const [publishPlanOfAction] = usePublishPlanOfActionMutation();

  // ------------------------------------------------------------
  // Select dataset
  // ------------------------------------------------------------

  const rows = projectFilter ? projectRows : allRows;

  const isFetching = projectFilter ? isFetchingProject : isFetchingAll;

  const isLoading = projectFilter ? isLoadingProject : isLoadingAll;

  // ------------------------------------------------------------
  // Search
  // ------------------------------------------------------------

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((r) => {
      const title = r.title || "";

      const projectName = r.project_name || r.project?.name || "";

      const duration = r.total_duration_label || "";

      const status = r.status || "";

      return (
        title.toLowerCase().includes(term) ||
        projectName.toLowerCase().includes(term) ||
        duration.toLowerCase().includes(term) ||
        status.toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  const getStatus = (row) => {
    return row.status || (row.is_published ? "PUBLISHED" : "DRAFT");
  };

  const formatStatus = (status) => {
    return (status || "DRAFT")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-[#E8F4EC] text-[#276749]";

      case "APPROVED":
        return "bg-[#E8F4EC] text-[#276749]";

      case "IN_REVIEW":
        return "bg-[#FFF4DC] text-[#8A6500]";

      case "SUBMITTED":
        return "bg-[#EAF1F8] text-[#285A8F]";

      case "REJECTED":
        return "bg-[#FDECEC] text-[#B42318]";

      case "DRAFT":
      default:
        return "bg-[#F1F3F4] text-[#5F6B6D]";
    }
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
  ];

  // ------------------------------------------------------------
  // Clear project filter
  // ------------------------------------------------------------

  const clearProjectFilter = () => {
    nav("/plan-of-actions");
  };

  // ------------------------------------------------------------
  // Create
  // ------------------------------------------------------------

  const handleCreate = () => {
    if (projectFilter) {
      nav(`/crm/forms/plan-of-action?project_id=${projectFilter}`);
    } else {
      nav("/crm/forms/plan-of-action");
    }
  };

  // ------------------------------------------------------------
  // Update Status
  // ------------------------------------------------------------

  const handleStatusChange = async (row, status) => {
    if (!row?.id) return;

    const currentStatus = getStatus(row);

    if (currentStatus === status) return;

    try {
      setUpdatingStatusId(row.id);

      await updatePlanOfAction({
        id: row.id,
        status,
      }).unwrap();

      toast.success(`Plan status updated to ${formatStatus(status)}`);
    } catch (error) {
      console.error("Failed to update plan status:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to update plan status",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ------------------------------------------------------------
  // Delete
  // ------------------------------------------------------------

  const handleDelete = async (row) => {
    if (!row?.id) return;

    const title = row.title || "Untitled Plan";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(row.id);

      await deletePlanOfAction(row.id).unwrap();

      toast.success("Plan of Action deleted successfully");
    } catch (error) {
      console.error("Failed to delete Plan of Action:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to delete Plan of Action",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ------------------------------------------------------------
  // Publish
  // ------------------------------------------------------------

  const handlePublish = async (row) => {
    if (!row?.id) return;

    const confirmed = window.confirm(
      `Publish "${row.title || "Untitled Plan"}"?`,
    );

    if (!confirmed) return;

    try {
      setUpdatingStatusId(row.id);

      await publishPlanOfAction(row.id).unwrap();

      toast.success("Plan of Action published successfully");
    } catch (error) {
      console.error("Failed to publish Plan of Action:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to publish Plan of Action",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <Shell
      title="Plans of Action"
      subtitle={`${rows.length} plan${
        rows.length !== 1 ? "s" : ""
      }${projectFilter ? " for this project" : " across the workspace"}`}
      action={
        <button
          onClick={handleCreate}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#17382F] transition-colors"
          data-testid="plan-of-action-new-btn"
        >
          <Plus size={14} />
          New Plan of Action
        </button>
      }
    >
      {/* --------------------------------------------------------
          Filters
      --------------------------------------------------------- */}

      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search plans of action…"
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

      {/* --------------------------------------------------------
          Table
      --------------------------------------------------------- */}

      <Card>
        <div className="overflow-x-auto">
          <table
            className="w-full text-[14px]"
            data-testid="plan-of-action-table"
          >
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Plan
                </th>

                <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Project
                </th>

                <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Status
                </th>

                <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Phases
                </th>

                <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Duration
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
              {/* ------------------------------------------------
                  Rows
              ------------------------------------------------- */}

              {!isLoading &&
                filteredRows.map((r) => {
                  const status = getStatus(r);

                  const isUpdating = updatingStatusId === r.id;

                  const isDeleting = deletingId === r.id;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => nav(`/crm/plan-of-action/${r.id}`)}
                      className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer transition-colors"
                      data-testid={`plan-of-action-row-${r.id}`}
                    >
                      {/* Plan */}

                      <td className="px-3 py-2.5 font-semibold text-[#333333] max-w-[280px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <ClipboardList
                            size={14}
                            className="shrink-0 text-[#B5C4B6]"
                          />

                          <span className="truncate">
                            {r.title || "Untitled Plan"}
                          </span>
                        </div>
                      </td>

                      {/* Project */}

                      <td className="px-3 py-2.5 text-[#6B7B7C] max-w-[240px]">
                        <span className="truncate block">
                          {r.project_name || r.project?.name || "—"}
                        </span>
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
                            data-testid={`plan-of-action-status-${r.id}`}
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

                      {/* Phases */}

                      <td className="px-3 py-2.5 text-[#6B7B7C]">
                        {r.total_phases ?? r.phases?.length ?? 0}
                      </td>

                      {/* Duration */}

                      <td className="px-3 py-2.5 text-[#6B7B7C]">
                        {r.total_duration_label ||
                          (r.total_duration_min_days != null ||
                          r.total_duration_max_days != null
                            ? `${r.total_duration_min_days ?? "?"}-${
                                r.total_duration_max_days ?? "?"
                              } days`
                            : "—")}
                      </td>

                      {/* Updated */}

                      <td className="px-3 py-2.5 text-[#6B7B7C]">
                        {(
                          r.updated_at ||
                          r.updatedAt ||
                          r.created_at ||
                          r.createdAt ||
                          ""
                        ).slice(0, 10) || "—"}
                      </td>

                      {/* Actions */}

                      <td
                        className="px-3 py-2.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-0.5">
                          {/* View */}

                          <button
                            onClick={() => nav(`/crm/plan-of-action/${r.id}`)}
                            className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333] transition-colors"
                            title="View"
                            data-testid={`plan-of-action-view-${r.id}`}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit */}

                          <button
                            onClick={() =>
                              nav(`/crm/forms/plan-of-action/${r.id}/edit`)
                            }
                            className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333] transition-colors"
                            title="Edit"
                            data-testid={`plan-of-action-edit-${r.id}`}
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Publish */}

                          {status !== "PUBLISHED" && (
                            <button
                              onClick={() => handlePublish(r)}
                              disabled={isUpdating || isDeleting}
                              className="p-1.5 rounded hover:bg-[#E8F4EC] text-[#276749] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Publish"
                              data-testid={`plan-of-action-publish-${r.id}`}
                            >
                              {isUpdating ? (
                                <RefreshCw size={15} className="animate-spin" />
                              ) : (
                                <span className="text-[11px] font-bold">
                                  Publish
                                </span>
                              )}
                            </button>
                          )}

                          {/* Delete */}

                          <button
                            onClick={() => handleDelete(r)}
                            disabled={isDeleting || isUpdating}
                            className="p-1.5 rounded hover:bg-[#FDECEC] text-[#B42318] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                            data-testid={`plan-of-action-delete-${r.id}`}
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

              {/* ------------------------------------------------
                  Loading
              ------------------------------------------------- */}

              {isFetching && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw size={15} className="animate-spin" />
                      Loading plans of action...
                    </div>
                  </td>
                </tr>
              )}

              {/* ------------------------------------------------
                  Empty
              ------------------------------------------------- */}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    {q
                      ? "No plans of action match your search."
                      : projectFilter
                        ? "No plans of action found for this project."
                        : "No plans of action yet. Create the first one from a project."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
