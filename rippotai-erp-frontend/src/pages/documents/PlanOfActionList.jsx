import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit3, ClipboardList } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import {
  useFindAllPlanOfActionsQuery,
  useFindPlanOfActionsByProjectQuery,
} from "../../api/plan-of-actions.api";

export default function PlanOfActionList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  // ------------------------------------------------------------
  // Project filter
  // ------------------------------------------------------------

  const projectFilter =
    new URLSearchParams(window.location.search).get("project_id") || "";

  // ------------------------------------------------------------
  // Get ALL plans
  //
  // Only runs when there is no project filter.
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
  //
  // Only runs when project_id exists.
  // ------------------------------------------------------------

  const {
    data: projectRows = [],
    isFetching: isFetchingProject,
    isLoading: isLoadingProject,
  } = useFindPlanOfActionsByProjectQuery(projectFilter, {
    skip: !projectFilter,
  });

  // ------------------------------------------------------------
  // Select correct dataset
  // ------------------------------------------------------------

  const rows = projectFilter ? projectRows : allRows;

  const isFetching = projectFilter ? isFetchingProject : isFetchingAll;

  const isLoading = projectFilter ? isLoadingProject : isLoadingAll;

  // ------------------------------------------------------------
  // Client-side search
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

      return (
        title.toLowerCase().includes(term) ||
        projectName.toLowerCase().includes(term) ||
        duration.toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

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
      nav(`/documents/forms/plan-of-action?project_id=${projectFilter}`);
    } else {
      nav("/documents/forms/plan-of-action");
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
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
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
            className="text-[13px] text-[#333333] font-semibold"
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
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Plan
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Project
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Phases
                </th>

                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Duration
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
              {/* ------------------------------------------------
                  Rows
              ------------------------------------------------- */}

              {!isLoading &&
                filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => nav(`/documents/plan-of-action/${r.id}`)}
                    className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
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
                        <button
                          onClick={() =>
                            nav(`/documents/plan-of-action/${r.id}`)
                          }
                          className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                          title="View"
                          data-testid={`plan-of-action-view-${r.id}`}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => nav(`/plan-of-actions/${r.id}/edit`)}
                          className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                          title="Edit"
                          data-testid={`plan-of-action-edit-${r.id}`}
                        >
                          <Edit3 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {/* ------------------------------------------------
                  Loading
              ------------------------------------------------- */}

              {isFetching && (
                <tr>
                  <td colSpan={6} className="text-center text-[#B5C4B6] py-8">
                    Loading plans of action...
                  </td>
                </tr>
              )}

              {/* ------------------------------------------------
                  Empty
              ------------------------------------------------- */}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={6} className="text-center text-[#B5C4B6] py-8">
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
