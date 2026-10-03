import React, { useCallback, useMemo, useState } from "react";

import {
  Eye,
  Plus,
  CheckCircle2,
  Activity,
  Layers,
  ClipboardList,
  Truck,
  Building2,
  MoreHorizontal,
  Pencil,
  Download,
  Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useGetProjectsQuery } from "../../api/projects/project.api";

import {
  useGetProjectPlannersQuery,
  useGetProjectLocationsQuery,
  useGetPlannerByIdQuery,
  useDeletePlannerMutation,
  useDownloadPlannerWorkbookMutation,
} from "../../api/documents/project-planner.api";

import {
  Page,
  PageHeader,
  Card,
  Button,
  Stats,
  StatTile,
  Toolbar,
  ToolbarSpacer,
  SearchInput,
  Segmented,
  Pill,
  EmptyState,
  Progress,
} from "@/components/inos";
import { Skeleton } from "@/components/projects/_projects-ui";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================================
// PLANNER TYPES
// ============================================================

const PLANNER_TYPES = [
  {
    value: "PROJECT",
    label: "Project planner",
  },
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

  // Memoised: unwrapArray returns a fresh [] per call, which re-fired the
  // status effect below on every render ("Maximum update depth exceeded").
  const planners = useMemo(() => unwrapArray(plannersResponse), [plannersResponse]);

  const locationTree = useMemo(() => unwrapArray(locationsResponse), [locationsResponse]);

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

  const [deletingPlannerId, setDeletingPlannerId] = useState(null);

  // ============================================================
  // API
  // ============================================================

  const {
    data: projectsResponse,
    isLoading: isLoadingProjects,
    isFetching: isFetchingProjects,
  } = useGetProjectsQuery();

  const projects = unwrapArray(projectsResponse);

  const [deletePlanner] = useDeletePlannerMutation();

  const [downloadPlannerWorkbook] = useDownloadPlannerWorkbookMutation();

  // ============================================================
  // PROBE CALLBACKS
  // ============================================================

  const statsSig = (st) =>
    st
      ? [st.totalItems, st.completedItems, st.percent, st.isLoading, st.floorCount,
         st.planner?.id, st.planner?.name, st.planner?.updated_at, st.planner?.updatedAt].join("|")
      : "";

  const handleStats = useCallback((key, stats) => {
    setStatsByKey((current) =>
      statsSig(current[key]) === statsSig(stats) ? current : { ...current, [key]: stats },
    );
  }, []);

  const handleProjectStatus = useCallback((projectId, status) => {
    let unchanged = false;
    setProjectProbeStatus((current) => {
      const prev = current[projectId];
      if (
        prev &&
        prev.isLoading === status.isLoading &&
        prev.plannerIds.join(",") === status.plannerIds.join(",")
      ) {
        unchanged = true;
        return current;
      }
      return { ...current, [projectId]: status };
    });
    if (unchanged) return;

    setStatsByKey((current) => {
      let removed = false;
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
          removed = true;
        }
      });

      return removed ? next : current;
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
    if (!instance?.planner?.id) {
      return;
    }

    navigate(`/projects/planner/${instance.planner.id}`);
  };

  const handleEdit = (instance) => {
    if (!instance?.planner?.id) {
      return;
    }

    navigate(`/projects/planner/${instance.planner.id}?mode=edit`);
  };

  const handleDownload = async (instance) => {
    const projectId = instance?.project?.id;

    if (!projectId) {
      return;
    }

    try {
      await downloadPlannerWorkbook(projectId).unwrap();
    } catch (error) {
      console.error("Failed to download planner workbook:", error);
    }
  };

  const handleDelete = async (instance) => {
    const plannerId = instance?.planner?.id;

    if (!plannerId) {
      return;
    }

    const plannerName =
      instance?.plannerLabel ||
      getPlannerLabel(instance?.plannerType) ||
      "this planner";

    const projectName = instance?.project?.name || "this project";

    const confirmed = window.confirm(
      `Delete ${plannerName} from ${projectName}?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingPlannerId(plannerId);

      await deletePlanner(plannerId).unwrap();

      setStatsByKey((current) => {
        const next = {
          ...current,
        };

        Object.keys(next).forEach((key) => {
          if (next[key]?.planner?.id === plannerId) {
            delete next[key];
          }
        });

        return next;
      });
    } catch (error) {
      console.error("Failed to delete planner:", error);
    } finally {
      setDeletingPlannerId(null);
    }
  };

  const handleCreate = () => {
    navigate("/projects/planner/create");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Page className="pj-page">
      {/* Hidden per-project probes (fetch planners + locations) */}
      {!isLoadingProjects &&
        projects.map((project) => (
          <ProjectPlannerProbe
            key={project.id}
            project={project}
            onStats={handleStats}
            onProjectStatus={handleProjectStatus}
          />
        ))}

      <PageHeader
        crumbs={[{ label: "Projects", to: "/projects" }, { label: "Planners" }]}
        title="Project planners"
        subtitle="Consultancy, PMC and procurement planners across all projects."
        actions={
          <Button variant="primary" icon={Plus} onClick={handleCreate}>
            New planner
          </Button>
        }
      />

      <Stats>
        <StatTile label="Planners" value={stillLoading ? "…" : instances.length} icon={<Layers />} />
        <StatTile
          label="Projects with a planner"
          value={stillLoading ? "…" : `${projectsWithPlannerCount} / ${projects.length}`}
          icon={<Building2 />}
          tone="info"
        />
        <StatTile label="In progress" value={stillLoading ? "…" : activeCount} icon={<Activity />} tone="warn" />
        <StatTile label="Fully completed" value={stillLoading ? "…" : completedCount} icon={<CheckCircle2 />} tone="ok" />
      </Stats>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search project or planner…" />
        <ToolbarSpacer />
        <Segmented
          value={plannerFilter}
          onChange={setPlannerFilter}
          options={[{ value: "all", label: "All" }, ...PLANNER_TYPES]}
        />
      </Toolbar>

      <Card
        flush
        footer={
          !stillLoading && filteredInstances.length > 0 ? (
            <span className="pj-muted" style={{ fontSize: 13 }}>
              Showing {filteredInstances.length} of {instances.length} planners
            </span>
          ) : null
        }
      >
        {stillLoading ? (
          <div style={{ padding: 20, display: "grid", gap: 8 }}>
            <Skeleton height={48} />
            <Skeleton height={48} />
            <Skeleton height={48} />
          </div>
        ) : filteredInstances.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={instances.length === 0 ? "No planners yet" : "No planners match"}
            text={
              instances.length === 0
                ? "Create a project planner to track consultancy, PMC and procurement work floor by floor."
                : "Try changing the search or planner filter."
            }
            action={
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                New planner
              </Button>
            }
          />
        ) : (
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Planner</th>
                  <th className="num">Floors</th>
                  <th className="num">Items</th>
                  <th className="num">Completed</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th className="actions" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredInstances.map((instance) => {
                  const isProcurement = instance.plannerType === "VENDOR_PROCUREMENT";
                  const plannerId = instance?.planner?.id;
                  const isDeleting = deletingPlannerId === plannerId;

                  return (
                    <tr key={instance.key} className="is-clickable" onClick={() => handleView(instance)}>
                      <td style={{ maxWidth: 260 }}>
                        <div className="pj-cell-title pj-truncate">{instance.project?.name || "Untitled project"}</div>
                        {instance.project?.site_location && (
                          <div className="pj-cell-sub pj-truncate">{instance.project.site_location}</div>
                        )}
                      </td>
                      <td>
                        <PlannerTypeBadge type={instance.plannerType} label={instance.plannerLabel} />
                      </td>
                      <td className="num">{instance.floorCount}</td>
                      <td className="num">
                        {instance.totalItems}
                        <span className="pj-muted" style={{ fontSize: 12, marginLeft: 4 }}>
                          {isProcurement ? "entries" : "tasks"}
                        </span>
                      </td>
                      <td className="num">
                        {instance.completedItems}
                        <span className="pj-muted"> / {instance.totalItems}</span>
                      </td>
                      <td>
                        <div className="pj-progress-cell">
                          <Progress value={instance.percent} tone={instance.percent >= 100 ? "ok" : undefined} />
                          <span>{instance.percent}%</span>
                        </div>
                      </td>
                      <td>
                        <ProgressStatusBadge totalItems={instance.totalItems} progress={instance.percent} />
                      </td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" icon={MoreHorizontal} disabled={isDeleting} aria-label="Open actions" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="inos-menu w-52">
                            <DropdownMenuLabel>Planner actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleView(instance)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Open planner
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(instance)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit planner
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(instance)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download workbook
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={isDeleting}
                              onClick={() => handleDelete(instance)}
                              style={{ color: "var(--bad-fg)" }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {isDeleting ? "Deleting…" : "Delete planner"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  );
};

// ============================================================
// PLANNER TYPE BADGE
// ============================================================

const TYPE_TONE = { PROJECT: "brand", CONSULTANCY: "info", PMC: "lilac", VENDOR_PROCUREMENT: "peach" };

function PlannerTypeBadge({ type, label }) {
  const Icon = type === "VENDOR_PROCUREMENT" ? Truck : ClipboardList;
  return (
    <Pill tone={TYPE_TONE[type] || "mute"} dot={false}>
      <Icon size={13} aria-hidden />
      {label}
    </Pill>
  );
}

// ============================================================
// PROGRESS STATUS
// ============================================================

function ProgressStatusBadge({ totalItems, progress }) {
  if (totalItems === 0) return <Pill tone="mute">Empty</Pill>;
  if (progress >= 100) return <Pill tone="ok">Completed</Pill>;
  if (progress > 0) return <Pill tone="info">In progress</Pill>;
  return <Pill tone="warn">Not started</Pill>;
}

export default ProjectPlannerList;
