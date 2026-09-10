import React, { useCallback, useMemo, useState } from "react";
import { Eye, Plus, Search, Filter, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useGetProjectsQuery } from "../../api/projects/project.api";
import {
  useGetPlannerTaskTreeQuery,
  useListProjectFloorsQuery,
} from "../../api/documents/project-planner.api";

// ============================================================
// MODULES
// NOTE: keep this in sync with the backend `PlannerModule` enum
// (@/common/enums/project-planner.enum). Labels here are a
// placeholder set for a residential construction checklist.
// ============================================================

const PLANNER_MODULES = [
  { value: "civil", label: "Civil Works" },
  { value: "interior", label: "Interior Finishing" },
  { value: "mep", label: "MEP (Electrical & Plumbing)" },
  { value: "landscaping", label: "Landscaping" },
];

// ============================================================
// STATS HELPERS
// ============================================================

const flattenTasks = (tree) =>
  (tree || []).flatMap((task) => [task, ...(task.children || [])]);

const computeStats = (tree, floorCount) => {
  const tasks = flattenTasks(tree);

  const totalTasks = tasks.length;

  const totalCells = totalTasks * floorCount;

  const completedCells = tasks.reduce((sum, task) => {
    const completed = (task.floor_progress || []).filter(
      (progress) => progress.completed_date,
    ).length;

    return sum + completed;
  }, 0);

  const percent =
    totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0;

  return { totalTasks, totalCells, completedCells, percent };
};

const instanceKey = (projectId, moduleValue) => `${projectId}:${moduleValue}`;

// ============================================================
// PROBE
// One per (project, module) combination. Renders nothing — it
// only fetches that combination's task tree, computes stats, and
// reports them up to the parent so the flat table can be built
// from initialized instances only. A fixed PLANNER_MODULES array
// per project keeps the number of hook calls per rendered probe
// fixed, so this stays within the rules of hooks.
// ============================================================

const PlannerInstanceProbe = ({ project, module, floorCount, onStats }) => {
  const { data: tree, isLoading } = useGetPlannerTaskTreeQuery(
    { projectId: project.id, module: module.value },
    { skip: !project.id },
  );

  const stats = useMemo(
    () => computeStats(tree, floorCount),
    [tree, floorCount],
  );

  const isInitialized = stats.totalTasks > 0;

  React.useEffect(() => {
    onStats(instanceKey(project.id, module.value), {
      project,
      module,
      floorCount,
      isInitialized,
      isLoading,
      ...stats,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.totalTasks, stats.percent, isInitialized, isLoading, floorCount]);

  return null;
};

// ============================================================
// PER-PROJECT FLOOR LOOKUP
// Floors are project-wide, so this is fetched once per project
// and passed down to that project's module probes.
// ============================================================

const ProjectProbes = ({ project, onStats }) => {
  const { data: floors } = useListProjectFloorsQuery(project.id, {
    skip: !project.id,
  });

  const floorCount = Array.isArray(floors) ? floors.length : 0;

  return (
    <>
      {PLANNER_MODULES.map((module) => (
        <PlannerInstanceProbe
          key={module.value}
          project={project}
          module={module}
          floorCount={floorCount}
          onStats={onStats}
        />
      ))}
    </>
  );
};

// ============================================================
// COMPONENT
// ============================================================

const ProjectPlannerList = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statsByKey, setStatsByKey] = useState({});

  // ============================================================
  // API
  // ============================================================

  const { data: projects = [], isLoading: isLoadingProjects } =
    useGetProjectsQuery();

  const handleStats = useCallback((key, stats) => {
    setStatsByKey((current) => ({ ...current, [key]: stats }));
  }, []);

  // ============================================================
  // FLATTEN INTO PLANNER INSTANCES
  // ============================================================

  const allStats = Object.values(statsByKey);

  const stillProbing = allStats.some((stat) => stat.isLoading);

  const instances = useMemo(() => {
    return allStats
      .filter((stat) => stat.isInitialized)
      .sort(
        (a, b) =>
          (a.project?.name || "").localeCompare(b.project?.name || "") ||
          a.module.label.localeCompare(b.module.label),
      );
  }, [allStats]);

  // ============================================================
  // FILTER
  // ============================================================

  const filteredInstances = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return instances.filter((instance) => {
      const matchesModule =
        moduleFilter === "all" || instance.module.value === moduleFilter;

      if (!matchesModule) return false;

      if (!searchValue) return true;

      return (
        String(instance.project?.name || "")
          .toLowerCase()
          .includes(searchValue) ||
        instance.module.label.toLowerCase().includes(searchValue)
      );
    });
  }, [instances, search, moduleFilter]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const projectsWithPlannerCount = new Set(
    instances.map((instance) => instance.project.id),
  ).size;

  const completedCount = instances.filter(
    (instance) => instance.percent === 100,
  ).length;

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleView = (instance) => {
    navigate(
      `/projects/${instance.project.id}/planner/${instance.module.value}`,
    );
  };

  const handleCreate = () => {
    navigate("/projects/planner/create");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="w-full space-y-6">
      {/* Hidden probes — fetch stats for every project/module combo */}

      {!isLoadingProjects &&
        projects.map((project) => (
          <ProjectProbes
            key={project.id}
            project={project}
            onStats={handleStats}
          />
        ))}

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Project Planners
            </h1>

            <p className="text-sm text-gray-500">
              Every initialized site checklist, across all projects
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Planner
        </button>
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by project or module..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              className="h-10 min-w-[200px] appearance-none rounded-lg border border-gray-200 bg-white pl-10 pr-8 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="all">All Modules</option>

              {PLANNER_MODULES.map((module) => (
                <option key={module.value} value={module.value}>
                  {module.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Planners Initialized
          </p>

          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {stillProbing ? "…" : instances.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Projects With A Planner
          </p>

          <p className="mt-1 text-2xl font-semibold text-blue-600">
            {stillProbing ? "…" : projectsWithPlannerCount} / {projects.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Fully Completed
          </p>

          <p className="mt-1 text-2xl font-semibold text-green-600">
            {stillProbing ? "…" : completedCount}
          </p>
        </div>
      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Project
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Module
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Floors
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tasks
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Progress
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {/* Loading */}

              {(isLoadingProjects || stillProbing) && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading project planners...
                  </td>
                </tr>
              )}

              {/* Empty */}

              {!isLoadingProjects &&
                !stillProbing &&
                filteredInstances.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Layers className="mb-3 h-10 w-10 text-gray-300" />

                        <p className="text-sm font-medium text-gray-700">
                          No planners found
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {instances.length === 0
                            ? "No project has an initialized checklist yet."
                            : "Try changing your search or filters."}
                        </p>

                        <button
                          type="button"
                          onClick={handleCreate}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                        >
                          <Plus className="h-4 w-4" />
                          New Planner
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

              {/* Rows */}

              {!isLoadingProjects &&
                !stillProbing &&
                filteredInstances.map((instance) => {
                  const key = instanceKey(
                    instance.project.id,
                    instance.module.value,
                  );

                  return (
                    <tr key={key} className="transition hover:bg-gray-50">
                      {/* Project */}

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleView(instance)}
                          className="font-medium text-primary hover:underline"
                        >
                          {instance.project?.name || "Untitled Project"}
                        </button>
                      </td>

                      {/* Module */}

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {instance.module.label}
                      </td>

                      {/* Floors */}

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {instance.floorCount} floor
                        {instance.floorCount === 1 ? "" : "s"}
                      </td>

                      {/* Tasks */}

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {instance.totalTasks}
                      </td>

                      {/* Progress */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${instance.percent}%` }}
                            />
                          </div>

                          <span className="text-xs font-medium text-gray-600">
                            {instance.percent}%
                          </span>
                        </div>
                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleView(instance)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            FOOTER
        ==================================================== */}

        {!isLoadingProjects &&
          !stillProbing &&
          filteredInstances.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-5 py-3">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                  {filteredInstances.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-700">
                  {instances.length}
                </span>{" "}
                planners
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default ProjectPlannerList;
