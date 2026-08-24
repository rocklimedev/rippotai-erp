import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit3, FileText } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetScopeOfWorkQuery } from "../../api/scope-of-work.api";

export default function ScopeOfWorkList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  // ============================================================
  // OPTIONAL PROJECT FILTER
  // ============================================================

  const projectFilter =
    new URLSearchParams(window.location.search).get("project_id") || "";

  // ============================================================
  // GET ALL SCOPE OF WORK
  //
  // GET /scope-of-work
  //
  // No projectId is required.
  // ============================================================

  const { data, isFetching, isLoading, isError, error } =
    useGetScopeOfWorkQuery();

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
    // Filter by project if project_id exists in URL
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
      nav(`/documents/forms/scope-of-work?project_id=${projectFilter}`);
      return;
    }

    nav("/documents/forms/scope-of-work");
  };

  // ============================================================
  // VIEW
  // ============================================================

  const handleView = (id) => {
    nav(`/documents/scope-of-work/${id}`);
  };

  // ============================================================
  // EDIT
  // ============================================================

  const handleEdit = (id) => {
    nav(`/scope-of-work/${id}/edit`);
  };

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
        return "bg-[#EAF1F8] text-[#315A7D]";

      case "REJECTED":
      case "CANCELLED":
        return "bg-[#FBEAEA] text-[#9B3D3D]";

      case "DRAFT":
      default:
        return "bg-[#F4F6F7] text-[#6B7B7C]";
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
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
          data-testid="scope-of-work-new-btn"
        >
          <Plus size={14} />
          New Scope of Work
        </button>
      }
    >
      {/* ========================================================
          FILTERS
      ========================================================= */}

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
            className="text-[13px] text-[#333333] font-semibold"
          >
            Clear project filter ×
          </button>
        )}
      </div>

      {/* ========================================================
          ERROR
      ========================================================= */}

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
      ========================================================= */}

      {!isError && (
        <Card>
          <div className="overflow-x-auto">
            <table
              className="w-full text-[14px]"
              data-testid="scope-of-work-table"
            >
              <thead className="bg-[#F4F6F7]">
                <tr>
                  <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                    Scope of Work
                  </th>

                  <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                    Project
                  </th>

                  <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                    Mode
                  </th>

                  <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                    Version
                  </th>

                  <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                    Status
                  </th>

                  <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                    Updated
                  </th>

                  <th className="text-right px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C] w-[110px]">
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
                      Loading scope of work...
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

                    return (
                      <tr
                        key={r.id}
                        onClick={() => handleView(r.id)}
                        className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
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

                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold tracking-wide ${getStatusClass(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
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
                            <button
                              onClick={() => handleView(r.id)}
                              className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                              title="View"
                              data-testid={`scope-of-work-view-${r.id}`}
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              onClick={() => handleEdit(r.id)}
                              className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                              title="Edit"
                              data-testid={`scope-of-work-edit-${r.id}`}
                            >
                              <Edit3 size={15} />
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
                      Loading scope of work...
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
