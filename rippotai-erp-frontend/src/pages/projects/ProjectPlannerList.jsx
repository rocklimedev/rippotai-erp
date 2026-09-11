import React, { useCallback, useMemo, useState } from "react";

import {
  Eye,
  Plus,
  Search,
  Filter,
  Layers,
  ClipboardList,
  Truck,
  Building2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useGetProjectsQuery } from "../../api/projects/project.api";

import {
  useGetProjectPlannersQuery,
  useGetProjectLocationsQuery,
  useGetPlannerByIdQuery,
} from "../../api/documents/project-planner.api";

// ============================================================
// PLANNER TYPES
// ============================================================

const PLANNER_TYPES = [
  {
    value: "CONSULTANCY",
    label: "Consultancy",
  },
  {
    value: "PMC",
    label: "PMC",
  },
  {
    value: "VENDOR_PROCUREMENT",
    label: "Vendor & Procurement",
  },
];

// ============================================================
// HELPERS
// ============================================================

const unwrapArray = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const unwrapObject = (data) => {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    if (
      data.data &&
      typeof data.data === "object" &&
      !Array.isArray(data.data)
    ) {
      return data.data;
    }

    return data;
  }

  return null;
};

const getPlannerLabel = (type) => {
  return PLANNER_TYPES.find((item) => item.value === type)?.label || type;
};

// ============================================================
// LOCATION HELPERS
// ============================================================

const flattenLocations = (locations = []) => {
  const result = [];

  const walk = (items) => {
    items.forEach((location) => {
      result.push(location);

      if (Array.isArray(location.children) && location.children.length) {
        walk(location.children);
      }
    });
  };

  walk(locations);

  return result;
};

const countFloors = (locationTree) => {
  return flattenLocations(locationTree).filter(
    (location) => location.type === "FLOOR",
  ).length;
};

// ============================================================
// PROGRESS
// ============================================================

const statusToProgress = (status) => {
  switch (status) {
    case "COMPLETED":
      return 100;

    case "IN_PROGRESS":
      return 50;

    case "NOT_APPLICABLE":
      return null;

    case "ON_HOLD":
    case "NOT_STARTED":
    default:
      return 0;
  }
};

const computeTaskPlannerStats = (items) => {
  const list = Array.isArray(items) ? items : [];

  const applicableItems = list.filter(
    (item) => item.status !== "NOT_APPLICABLE",
  );

  const totalItems = list.length;

  const completedItems = applicableItems.filter(
    (item) => item.status === "COMPLETED",
  ).length;

  const progress =
    applicableItems.length > 0
      ? Math.round(
          applicableItems.reduce(
            (sum, item) => sum + Number(item.progress_pct || 0),
            0,
          ) / applicableItems.length,
        )
      : 0;

  return {
    totalItems,
    completedItems,
    progress,
  };
};

const computeProcurementStats = (items) => {
  const list = Array.isArray(items) ? items : [];

  const applicableItems = list.filter(
    (item) => item.status !== "NOT_APPLICABLE",
  );

  const completedItems = applicableItems.filter(
    (item) => item.status === "COMPLETED",
  ).length;

  const progressValues = applicableItems
    .map((item) => statusToProgress(item.status))
    .filter((value) => value !== null);

  const progress =
    progressValues.length > 0
      ? Math.round(
          progressValues.reduce((sum, value) => sum + value, 0) /
            progressValues.length,
        )
      : 0;

  return {
    totalItems: list.length,

    completedItems,

    progress,
  };
};

// ============================================================
// PLANNER INSTANCE PROBE
// ============================================================

function PlannerInstanceProbe({ planner, project, floorCount, onStats }) {
  const {
    data: plannerResponse,

    isLoading,
    isFetching,
  } = useGetPlannerByIdQuery(planner.id, {
    skip: !planner?.id,
  });

  const plannerData = unwrapObject(plannerResponse);

  const stats = useMemo(() => {
    if (!plannerData) {
      return {
        totalItems: 0,
        completedItems: 0,
        progress: 0,
      };
    }

    if (planner.type === "VENDOR_PROCUREMENT") {
      return computeProcurementStats(plannerData.procurement_items);
    }

    return computeTaskPlannerStats(plannerData.items);
  }, [plannerData, planner.type]);

  const key = `${project.id}:${planner.id}`;

  React.useEffect(() => {
    onStats(key, {
      key,

      project,

      planner: {
        ...planner,
        ...(plannerData || {}),
      },

      plannerType: planner.type,

      plannerLabel: getPlannerLabel(planner.type),

      floorCount,

      totalItems: stats.totalItems,

      completedItems: stats.completedItems,

      percent: stats.progress,

      isLoading: isLoading || isFetching,
    });
  }, [
    key,
    project,
    planner,
    plannerData,
    floorCount,
    stats.totalItems,
    stats.completedItems,
    stats.progress,
    isLoading,
    isFetching,
    onStats,
  ]);

  return null;
}

// ============================================================
// PROJECT PROBE
// ============================================================

function ProjectPlannerProbe({ project, onStats, onProjectStatus }) {
  const {
    data: plannersResponse,

    isLoading: isLoadingPlanners,

    isFetching: isFetchingPlanners,
  } = useGetProjectPlannersQuery(project.id, {
    skip: !project?.id,
  });

  const {
    data: locationsResponse,

    isLoading: isLoadingLocations,

    isFetching: isFetchingLocations,
  } = useGetProjectLocationsQuery(project.id, {
    skip: !project?.id,
  });

  const planners = unwrapArray(plannersResponse);

  const locationTree = unwrapArray(locationsResponse);

  const floorCount = useMemo(() => countFloors(locationTree), [locationTree]);

  const isLoading =
    isLoadingPlanners ||
    isFetchingPlanners ||
    isLoadingLocations ||
    isFetchingLocations;

  React.useEffect(() => {
    onProjectStatus(project.id, {
      isLoading,

      plannerIds: planners.map((planner) => planner.id),
    });
  }, [project.id, planners, isLoading, onProjectStatus]);

  return (
    <>
      {planners.map((planner) => (
        <PlannerInstanceProbe
          key={planner.id}
          planner={planner}
          project={project}
          floorCount={floorCount}
          onStats={onStats}
        />
      ))}
    </>
  );
}

// ============================================================
// COMPONENT
// ============================================================

const ProjectPlannerList = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [plannerFilter, setPlannerFilter] = useState("all");

  const [statsByKey, setStatsByKey] = useState({});

  const [projectProbeStatus, setProjectProbeStatus] = useState({});

  // ============================================================
  // API
  // ============================================================

  const {
    data: projectsResponse,

    isLoading: isLoadingProjects,

    isFetching: isFetchingProjects,
  } = useGetProjectsQuery();

  const projects = unwrapArray(projectsResponse);

  // ============================================================
  // PROBE CALLBACKS
  // ============================================================

  const handleStats = useCallback((key, stats) => {
    setStatsByKey((current) => ({
      ...current,

      [key]: stats,
    }));
  }, []);

  const handleProjectStatus = useCallback((projectId, status) => {
    setProjectProbeStatus((current) => ({
      ...current,

      [projectId]: status,
    }));

    /**
     * Remove stale planner rows if a planner
     * was deleted from a project.
     */
    setStatsByKey((current) => {
      const next = {
        ...current,
      };

      Object.keys(next).forEach((key) => {
        const entry = next[key];

        if (entry?.project?.id !== projectId) {
          return;
        }

        if (!status.plannerIds.includes(entry?.planner?.id)) {
          delete next[key];
        }
      });

      return next;
    });
  }, []);

  // ============================================================
  // ALL PLANNER INSTANCES
  // ============================================================

  const instances = useMemo(() => {
    return Object.values(statsByKey)
      .filter((instance) => instance?.planner?.id)
      .sort(
        (a, b) =>
          String(a.project?.name || "").localeCompare(
            String(b.project?.name || ""),
          ) ||
          String(a.plannerLabel || "").localeCompare(
            String(b.plannerLabel || ""),
          ),
      );
  }, [statsByKey]);

  // ============================================================
  // LOADING
  // ============================================================

  const projectProbeValues = Object.values(projectProbeStatus);

  const projectQueriesReady =
    projects.length === 0 ||
    projects.every((project) => projectProbeStatus[project.id]);

  const stillProbingProjects =
    !projectQueriesReady ||
    projectProbeValues.some((status) => status.isLoading);

  const stillLoadingPlannerDetails = instances.some(
    (instance) => instance.isLoading,
  );

  const stillLoading =
    isLoadingProjects ||
    isFetchingProjects ||
    stillProbingProjects ||
    stillLoadingPlannerDetails;

  // ============================================================
  // FILTERING
  // ============================================================

  const filteredInstances = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return instances.filter((instance) => {
      const matchesPlanner =
        plannerFilter === "all" || instance.plannerType === plannerFilter;

      if (!matchesPlanner) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      return (
        String(instance.project?.name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(instance.plannerLabel || "")
          .toLowerCase()
          .includes(searchValue)
      );
    });
  }, [instances, search, plannerFilter]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const projectsWithPlannerCount = useMemo(
    () => new Set(instances.map((instance) => instance.project.id)).size,
    [instances],
  );

  const completedCount = useMemo(
    () =>
      instances.filter(
        (instance) => instance.percent === 100 && instance.totalItems > 0,
      ).length,
    [instances],
  );

  const activeCount = useMemo(
    () =>
      instances.filter(
        (instance) => instance.percent > 0 && instance.percent < 100,
      ).length,
    [instances],
  );

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleView = (instance) => {
    /**
     * Workspace uses projectId and then selects
     * Consultancy / PMC internally.
     *
     * Adding ?planner= allows us to initialize
     * support for direct planner selection later
     * without changing this route again.
     */
    navigate(`/projects/planner/${instance?.planner?.id}`);
  };

  const handleCreate = () => {
    navigate("/projects/planner/create");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="w-full space-y-6">
      {/* ======================================================
          HIDDEN PROJECT PROBES
      ====================================================== */}

      {!isLoadingProjects &&
        projects.map((project) => (
          <ProjectPlannerProbe
            key={project.id}
            project={project}
            onStats={handleStats}
            onProjectStatus={handleProjectStatus}
          />
        ))}

      {/* ======================================================
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
              Consultancy, PMC and procurement planners across all projects
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

      {/* ======================================================
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
              placeholder="Search project or planner..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={plannerFilter}
              onChange={(event) => setPlannerFilter(event.target.value)}
              className="h-10 min-w-[220px] appearance-none rounded-lg border border-gray-200 bg-white pl-10 pr-8 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="all">All Planners</option>

              {PLANNER_TYPES.map((planner) => (
                <option key={planner.value} value={planner.value}>
                  {planner.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Planners"
          value={stillLoading ? "…" : instances.length}
          icon={Layers}
        />

        <SummaryCard
          label="Projects With Planner"
          value={
            stillLoading
              ? "…"
              : `${projectsWithPlannerCount} / ${projects.length}`
          }
          icon={Building2}
        />

        <SummaryCard
          label="In Progress"
          value={stillLoading ? "…" : activeCount}
          icon={ClipboardList}
        />

        <SummaryCard
          label="Fully Completed"
          value={stillLoading ? "…" : completedCount}
          icon={ClipboardList}
        />
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Project
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Planner
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Floors
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Items
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Completed
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Progress
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {/* =================================================
                  LOADING
              ================================================= */}

              {stillLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-14 text-center text-sm text-gray-500"
                  >
                    Loading project planners...
                  </td>
                </tr>
              )}

              {/* =================================================
                  EMPTY
              ================================================= */}

              {!stillLoading && filteredInstances.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Layers className="mb-3 h-10 w-10 text-gray-300" />

                      <p className="text-sm font-medium text-gray-700">
                        No planners found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {instances.length === 0
                          ? "No Project Planner has been created yet."
                          : "Try changing the search or planner filter."}
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

              {/* =================================================
                  ROWS
              ================================================= */}

              {!stillLoading &&
                filteredInstances.map((instance) => {
                  const isProcurement =
                    instance.plannerType === "VENDOR_PROCUREMENT";

                  return (
                    <tr
                      key={instance.key}
                      className="transition hover:bg-gray-50"
                    >
                      {/* =======================================
                            PROJECT
                        ======================================= */}

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleView(instance)}
                          className="font-medium text-primary hover:underline"
                        >
                          {instance.project?.name || "Untitled Project"}
                        </button>

                        {instance.project?.site_location && (
                          <p className="mt-0.5 max-w-[240px] truncate text-xs text-gray-400">
                            {instance.project.site_location}
                          </p>
                        )}
                      </td>

                      {/* =======================================
                            PLANNER TYPE
                        ======================================= */}

                      <td className="px-5 py-4">
                        <PlannerTypeBadge
                          type={instance.plannerType}
                          label={instance.plannerLabel}
                        />
                      </td>

                      {/* =======================================
                            FLOORS
                        ======================================= */}

                      <td className="px-5 py-4 text-sm text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />

                          {instance.floorCount}

                          <span className="text-gray-400">
                            {instance.floorCount === 1 ? "floor" : "floors"}
                          </span>
                        </div>
                      </td>

                      {/* =======================================
                            ITEMS
                        ======================================= */}

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {instance.totalItems}

                        <span className="ml-1 text-xs text-gray-400">
                          {isProcurement ? "entries" : "tasks"}
                        </span>
                      </td>

                      {/* =======================================
                            COMPLETED ITEMS
                        ======================================= */}

                      <td className="px-5 py-4 text-sm">
                        <span className="font-medium text-gray-700">
                          {instance.completedItems}
                        </span>

                        <span className="text-gray-400">
                          {" "}
                          / {instance.totalItems}
                        </span>
                      </td>

                      {/* =======================================
                            PROGRESS
                        ======================================= */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, instance.percent),
                                )}%`,
                              }}
                            />
                          </div>

                          <span className="min-w-[38px] text-xs font-semibold text-gray-600">
                            {instance.percent}%
                          </span>
                        </div>
                      </td>

                      {/* =======================================
                            STATUS
                        ======================================= */}

                      <td className="px-5 py-4">
                        <ProgressStatusBadge
                          totalItems={instance.totalItems}
                          progress={instance.percent}
                        />
                      </td>

                      {/* =======================================
                            ACTION
                        ======================================= */}

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleView(instance)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        {!stillLoading && filteredInstances.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3">
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

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PLANNER TYPE BADGE
// ============================================================

function PlannerTypeBadge({ type, label }) {
  const isProcurement = type === "VENDOR_PROCUREMENT";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
      {isProcurement ? (
        <Truck className="h-3.5 w-3.5 text-gray-500" />
      ) : (
        <ClipboardList className="h-3.5 w-3.5 text-gray-500" />
      )}

      {label}
    </span>
  );
}

// ============================================================
// PROGRESS STATUS
// ============================================================

function ProgressStatusBadge({ totalItems, progress }) {
  if (totalItems === 0) {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
        Empty
      </span>
    );
  }

  if (progress >= 100) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        Completed
      </span>
    );
  }

  if (progress > 0) {
    return (
      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
        In Progress
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
      Not Started
    </span>
  );
}

export default ProjectPlannerList;
