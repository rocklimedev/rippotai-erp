import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Edit3,
  Package,
  ChevronDown,
  FolderKanban,
  RefreshCw,
} from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetMaterialRequirementsByProjectQuery } from "../../api/procuerment/material-requirement.api";

// Change this import path only if your projects API lives elsewhere.
import { useGetProjectsQuery } from "../../api/projects/project.api";

export default function MaterialRequirementList() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // ============================================================
  // PROJECTS
  // ============================================================

  const { data: projectsResponse, isLoading: projectsLoading } =
    useGetProjectsQuery();

  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) {
      return projectsResponse;
    }

    if (Array.isArray(projectsResponse?.data)) {
      return projectsResponse.data;
    }

    if (Array.isArray(projectsResponse?.items)) {
      return projectsResponse.items;
    }

    return [];
  }, [projectsResponse]);

  // ============================================================
  // SELECTED PROJECT
  // ============================================================

  const selectedProject = useMemo(() => {
    return projects.find(
      (project) => String(project.id) === String(selectedProjectId),
    );
  }, [projects, selectedProjectId]);

  // ============================================================
  // MATERIAL REQUIREMENTS FOR SELECTED PROJECT
  // ============================================================

  const {
    data: rows = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetMaterialRequirementsByProjectQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });

  // ============================================================
  // NORMALIZE ROWS
  // ============================================================

  const normalizedRows = useMemo(() => {
    if (Array.isArray(rows)) {
      return rows;
    }

    if (Array.isArray(rows?.data)) {
      return rows.data;
    }

    if (Array.isArray(rows?.items)) {
      return rows.items;
    }

    return [];
  }, [rows]);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) {
      return normalizedRows;
    }

    return normalizedRows.filter((r) => {
      const itemName =
        r.itemName ||
        r.item_name ||
        r.material?.name ||
        r.material?.materialName ||
        r.material?.material_name ||
        "";

      const category = r.category || "";

      const selection = r.selection || "";

      const style = r.style || "";

      const status = r.status || "";

      const materialCode =
        r.material?.materialCode || r.material?.material_code || "";

      return (
        String(itemName).toLowerCase().includes(term) ||
        String(category).toLowerCase().includes(term) ||
        String(selection).toLowerCase().includes(term) ||
        String(style).toLowerCase().includes(term) ||
        String(status).toLowerCase().includes(term) ||
        String(materialCode).toLowerCase().includes(term)
      );
    });
  }, [normalizedRows, q]);

  // ============================================================
  // PROJECT CHANGE
  // ============================================================

  const handleProjectChange = (e) => {
    const projectId = e.target.value;

    setSelectedProjectId(projectId);
    setQ("");
  };

  // ============================================================
  // CREATE
  // ============================================================

  const handleCreate = () => {
    if (!selectedProjectId) {
      return;
    }

    nav(`/procurement/requirements/new?project_id=${selectedProjectId}`);
  };

  // ============================================================
  // VIEW
  //
  // IMPORTANT:
  // This intentionally goes to the project-level route:
  //
  // /procurement/:projectId/material-requirements
  //
  // The individual requirement ID is NOT used here.
  // ============================================================

  const handleView = () => {
    if (!selectedProjectId) {
      return;
    }
    console.log(selectedProjectId);
    const route = `/procurement/${selectedProjectId}/material-requirements`;

    nav(route);
  };

  // ============================================================
  // EDIT
  // ============================================================

  const handleEdit = (id) => {
    if (!id) {
      return;
    }

    nav(`/procurement/requirements/${id}/edit`);
  };

  // ============================================================
  // PROJECT NAME
  // ============================================================

  const getProjectName = (project) => {
    return (
      project?.name ||
      project?.projectName ||
      project?.project_name ||
      project?.title ||
      "Untitled Project"
    );
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const stringValue = String(value);

    if (stringValue.length >= 10) {
      return stringValue.slice(0, 10);
    }

    return stringValue;
  };

  // ============================================================
  // FORMAT BUDGET
  // ============================================================

  const formatBudget = (value) => {
    if (value == null || value === "") {
      return "—";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return "—";
    }

    return `₹${number.toLocaleString("en-IN")}`;
  };

  return (
    <Shell
      title="Material Requirements"
      subtitle={
        selectedProject
          ? `${normalizedRows.length} requirement${
              normalizedRows.length !== 1 ? "s" : ""
            } for ${getProjectName(selectedProject)}`
          : "Select a project to view its material requirements"
      }
      action={
        <button
          onClick={handleCreate}
          disabled={!selectedProjectId}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          New Requirement
        </button>
      }
    >
      {/* ============================================================
          PROJECT SELECTOR
      ============================================================ */}

      <Card>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FolderKanban size={15} className="text-[#1F453B]" />

            <label className="text-[13px] font-semibold text-[#333333]">
              Project
            </label>
          </div>

          <div className="relative max-w-xl">
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              disabled={projectsLoading}
              className="w-full h-11 appearance-none rounded-lg border border-[rgba(31,69,59,0.16)] bg-white px-3 pr-10 text-[14px] text-[#333333] outline-none focus:border-[#1F453B] focus:ring-1 focus:ring-[#1F453B]/20 disabled:bg-[#F4F6F7] disabled:text-[#8A9596]"
            >
              <option value="">
                {projectsLoading ? "Loading projects..." : "Select a project"}
              </option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {getProjectName(project)}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7B7C]"
            />
          </div>

          {selectedProject && (
            <div className="text-[12px] text-[#6B7B7C]">
              Showing material requirements for{" "}
              <span className="font-semibold text-[#333333]">
                {getProjectName(selectedProject)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ============================================================
          NO PROJECT SELECTED
      ============================================================ */}

      {!selectedProjectId && (
        <Card>
          <div className="py-14 text-center">
            <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-[#F4F6F7] flex items-center justify-center">
              <FolderKanban size={18} className="text-[#B5C4B6]" />
            </div>

            <div className="text-[14px] font-semibold text-[#333333]">
              Select a project
            </div>

            <div className="mt-1 text-[13px] text-[#8A9596]">
              Select a project above to view its material requirements.
            </div>
          </div>
        </Card>
      )}

      {/* ============================================================
          SELECTED PROJECT
      ============================================================ */}

      {selectedProjectId && (
        <>
          {/* ========================================================
              TOOLBAR
          ======================================================== */}

          <div className="flex gap-3 flex-wrap items-center">
            <Input
              placeholder="Search material requirements…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-sm"
            />

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-10 px-3 rounded-lg border border-[rgba(31,69,59,0.14)] bg-white text-[#333333] text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#F4F6F7] disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={14}
                className={isFetching ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* ========================================================
              REQUIREMENTS TABLE
          ======================================================== */}

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead className="bg-[#F4F6F7]">
                  <tr>
                    <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Material
                    </th>

                    <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Category
                    </th>

                    <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Selection
                    </th>

                    <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Budget
                    </th>

                    <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Status
                    </th>

                    <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                      Updated
                    </th>

                    <th className="text-right px-3 py-3 w-[110px]">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {/* ==================================================
                      LOADING
                  ================================================== */}

                  {isFetching && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center text-[#B5C4B6] py-8"
                      >
                        Loading material requirements...
                      </td>
                    </tr>
                  )}

                  {/* ==================================================
                      ROWS
                  ================================================== */}

                  {!isFetching &&
                    filteredRows.map((r) => {
                      const itemName =
                        r.itemName ||
                        r.item_name ||
                        r.material?.name ||
                        r.material?.materialName ||
                        r.material?.material_name ||
                        "Untitled";

                      const category = r.category || "—";

                      const selection = r.selection || "—";

                      const budget = formatBudget(
                        r.budgetAmount ?? r.budget_amount,
                      );

                      const status = r.status || "DRAFT";

                      const updated =
                        r.updatedAt ||
                        r.updated_at ||
                        r.createdAt ||
                        r.created_at ||
                        "";

                      return (
                        <tr
                          key={r.id}
                          onClick={() => handleView()}
                          className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                        >
                          {/* MATERIAL */}

                          <td className="px-3 py-2.5 font-semibold text-[#333333]">
                            <div className="flex items-center gap-1.5">
                              <Package size={14} className="text-[#B5C4B6]" />

                              {itemName}
                            </div>
                          </td>

                          {/* CATEGORY */}

                          <td className="px-3 py-2.5 text-[#6B7B7C]">
                            {category}
                          </td>

                          {/* SELECTION */}

                          <td className="px-3 py-2.5 text-[#6B7B7C] max-w-[280px]">
                            <span className="truncate block">{selection}</span>
                          </td>

                          {/* BUDGET */}

                          <td className="px-3 py-2.5 text-[#6B7B7C]">
                            {budget}
                          </td>

                          {/* STATUS */}

                          <td className="px-3 py-2.5">
                            <span className="px-2 py-1 rounded-md bg-[#F4F6F7] text-[#333333] text-xs font-semibold">
                              {status}
                            </span>
                          </td>

                          {/* UPDATED */}

                          <td className="px-3 py-2.5 text-[#6B7B7C]">
                            {formatDate(updated)}
                          </td>

                          {/* ACTIONS */}

                          <td
                            className="px-3 py-2.5 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-0.5">
                              {/* VIEW */}

                              <button
                                type="button"
                                onClick={() => handleView()}
                                className="p-1.5 rounded hover:bg-[#EAEEF0]"
                                title="View project material requirements"
                              >
                                <Eye size={15} />
                              </button>

                              {/* EDIT */}

                              <button
                                type="button"
                                onClick={() => handleEdit(r.id)}
                                className="p-1.5 rounded hover:bg-[#EAEEF0]"
                                title="Edit"
                              >
                                <Edit3 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {/* ==================================================
                      EMPTY
                  ================================================== */}

                  {!isFetching && !filteredRows.length && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center text-[#B5C4B6] py-10"
                      >
                        {q
                          ? "No material requirements match your search."
                          : "No material requirements have been added to this project yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </Shell>
  );
}
