import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  Edit3,
  FileText,
  MapPin,
  CalendarDays,
  RefreshCw,
  Trash2,
  Check,
  ChevronDown,
} from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";
import {
  useGetProjectBriefsQuery,
  useUpdateProjectBriefStatusMutation,
  useDeleteProjectBriefMutation,
} from "../../api/brief.api";

export default function ProjectBriefList() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // =========================================================
  // PROJECT FILTER
  // =========================================================

  const projectFilter =
    new URLSearchParams(window.location.search).get("projectId") ||
    new URLSearchParams(window.location.search).get("project_id") ||
    "";

  // =========================================================
  // API
  // =========================================================

  const {
    data: rows = [],
    isFetching,
    isLoading,
  } = useGetProjectBriefsQuery(projectFilter || undefined);

  const [updateProjectBriefStatus] = useUpdateProjectBriefStatusMutation();

  const [deleteProjectBrief] = useDeleteProjectBriefMutation();

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((brief) => {
      const searchable = [
        brief.project?.name,
        brief.projectName,
        brief.siteAddress,
        brief.propertyType,
        brief.relationshipToClient,
        brief.referredBySource,
        brief.status,
        brief.budgetCurrency,
        brief.fundingStage,
        brief.siteType,
        brief.ownershipStatus,
        brief.version,
      ]
        .filter(
          (value) => value !== null && value !== undefined && value !== "",
        )
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [rows, q]);

  // =========================================================
  // HELPERS
  // =========================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getProjectName = (brief) => {
    return (
      brief.project?.name ||
      brief.projectName ||
      brief.siteAddress ||
      "Untitled Project"
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "SIGNED_OFF":
        return "bg-[#E8F4EC] text-[#276749]";

      case "APPROVED":
        return "bg-[#E8F4EC] text-[#276749]";

      case "SUBMITTED":
        return "bg-[#EAF1F8] text-[#285A8F]";

      case "IN_REVIEW":
        return "bg-[#FFF4DC] text-[#8A6500]";

      case "REJECTED":
        return "bg-[#FDECEC] text-[#B42318]";

      case "DRAFT":
      default:
        return "bg-[#F1F3F4] text-[#5F6B6D]";
    }
  };

  const formatStatus = (status) => {
    return (status || "DRAFT")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // =========================================================
  // STATUS OPTIONS
  // =========================================================

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
      value: "SIGNED_OFF",
      label: "Signed Off",
    },
    {
      value: "REJECTED",
      label: "Rejected",
    },
  ];

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  const handleStatusChange = async (brief, status) => {
    if (!brief?.id) {
      return;
    }

    if ((brief.status || "DRAFT") === status) {
      return;
    }

    try {
      setUpdatingStatusId(brief.id);

      await updateProjectBriefStatus({
        id: brief.id,
        status,
      }).unwrap();

      toast.success(`Project brief status updated to ${formatStatus(status)}`);
    } catch (error) {
      console.error("Failed to update project brief status:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to update project brief status",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (brief) => {
    if (!brief?.id) {
      return;
    }

    const projectName = getProjectName(brief);

    const confirmed = window.confirm(
      `Are you sure you want to delete "${projectName}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(brief.id);

      await deleteProjectBrief(brief.id).unwrap();

      toast.success("Project brief deleted successfully");
    } catch (error) {
      console.error("Failed to delete project brief:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to delete project brief",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Shell
      title="Project Briefs"
      subtitle={`${rows.length} brief${
        rows.length !== 1 ? "s" : ""
      } across the workspace`}
      action={
        <button
          onClick={() => nav("/crm/forms/project-brief")}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#17382F] transition-colors"
          data-testid="project-brief-new-btn"
        >
          <Plus size={15} />
          New Project Brief
        </button>
      }
    >
      {/* =====================================================
          FILTER BAR
          ===================================================== */}

      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search project briefs…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        {projectFilter && (
          <button
            onClick={() => nav("/crm/brief/all")}
            className="text-[13px] text-[#333333] font-semibold hover:text-[#1F453B]"
          >
            Clear project filter ×
          </button>
        )}
      </div>

      {/* =====================================================
          TABLE
          ===================================================== */}

      <Card>
        <div className="overflow-x-auto">
          <table
            className="w-full text-[14px]"
            data-testid="project-brief-table"
          >
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Project
                </th>

                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Version
                </th>

                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Status
                </th>

                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Site
                </th>

                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Brief Date
                </th>

                <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7B7C] w-[160px]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {/* =================================================
                  LOADING
                  ================================================= */}

              {isFetching && !rows.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#8A9697]">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw size={15} className="animate-spin" />
                      Loading project briefs...
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((brief) => {
                  const currentStatus = brief.status || "DRAFT";
                  const isUpdating = updatingStatusId === brief.id;
                  const isDeleting = deletingId === brief.id;

                  return (
                    <tr
                      key={brief.id}
                      onClick={() => nav(`/crm/brief/${brief.id}`)}
                      className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F8FAF9] cursor-pointer transition-colors"
                      data-testid={`project-brief-row-${brief.id}`}
                    >
                      {/* =================================================
                          PROJECT
                          ================================================= */}

                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5 min-w-[220px]">
                          <div className="w-8 h-8 rounded-lg bg-[#EEF3F0] flex items-center justify-center shrink-0">
                            <FileText size={15} className="text-[#1F453B]" />
                          </div>

                          <div className="min-w-0">
                            <div className="font-semibold text-[#333333] truncate max-w-[280px]">
                              {getProjectName(brief)}
                            </div>

                            <div className="text-[12px] text-[#8A9697] mt-0.5">
                              {brief.propertyType ||
                                brief.siteType ||
                                "Project Brief"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* =================================================
                          VERSION
                          ================================================= */}

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#F1F3F4] text-[#4E5A5C] text-[12px] font-semibold">
                          v{brief.version ?? 1}
                        </span>
                      </td>

                      {/* =================================================
                          STATUS
                          ================================================= */}

                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative inline-flex">
                          <select
                            value={currentStatus}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleStatusChange(brief, e.target.value)
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
                              ${getStatusClass(currentStatus)}
                            `}
                            data-testid={`project-brief-status-${brief.id}`}
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

                      {/* =================================================
                          SITE
                          ================================================= */}

                      <td className="px-4 py-3">
                        <div className="flex items-start gap-1.5 max-w-[280px]">
                          <MapPin
                            size={14}
                            className="text-[#9AA7A8] mt-0.5 shrink-0"
                          />

                          <span className="text-[#667375] truncate">
                            {brief.siteAddress || "No site address"}
                          </span>
                        </div>
                      </td>

                      {/* =================================================
                          DATE
                          ================================================= */}

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[#667375] whitespace-nowrap">
                          <CalendarDays size={14} className="text-[#9AA7A8]" />

                          {formatDate(
                            brief.briefDate ||
                              brief.updatedAt ||
                              brief.createdAt,
                          )}
                        </div>
                      </td>

                      {/* =================================================
                          ACTIONS
                          ================================================= */}

                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          {/* VIEW */}

                          <button
                            onClick={() => nav(`/crm/brief/${brief.id}`)}
                            className="p-1.5 rounded-md hover:bg-[#EAEEF0] text-[#333333] transition-colors"
                            title="View"
                            data-testid={`project-brief-view-${brief.id}`}
                          >
                            <Eye size={15} />
                          </button>

                          {/* EDIT */}

                          <button
                            onClick={() => nav(`/crm/brief/${brief.id}/edit`)}
                            className="p-1.5 rounded-md hover:bg-[#EAEEF0] text-[#333333] transition-colors"
                            title="Edit"
                            data-testid={`project-brief-edit-${brief.id}`}
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* DELETE */}

                          <button
                            onClick={() => handleDelete(brief)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-md hover:bg-[#FDECEC] text-[#B42318] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                            data-testid={`project-brief-delete-${brief.id}`}
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
                })
              )}

              {/* =================================================
                  EMPTY STATE
                  ================================================= */}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-xl bg-[#F1F4F2] flex items-center justify-center mb-3">
                        <FileText size={20} className="text-[#A8B5B0]" />
                      </div>

                      <div className="text-[14px] font-semibold text-[#4F5B5D]">
                        {q
                          ? "No matching project briefs"
                          : "No project briefs yet"}
                      </div>

                      <div className="text-[12px] text-[#8A9697] mt-1">
                        {q
                          ? "Try a different search term."
                          : "Create the first brief from a project."}
                      </div>
                    </div>
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
