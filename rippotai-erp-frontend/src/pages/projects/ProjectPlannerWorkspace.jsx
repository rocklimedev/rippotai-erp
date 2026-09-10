import React, { useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { toast } from "sonner";

import {
  ArrowLeft,
  Building2,
  ClipboardList,
  FileOutput,
  PlayCircle,
  Plus,
  Truck,
} from "lucide-react";

import { Shell } from "../../hooks/shared";

import { useGetProjectsQuery } from "../../api/projects/project.api";

import {
  useInitializeProjectPlannersMutation,
  useGetProjectPlannersQuery,
  useCreateLocationMutation,
  useGetProjectLocationsQuery,
  useGeneratePlannerFromTemplateMutation,
  useGetPlannerItemsQuery,
} from "../../api/documents/project-planner.api";

import { PlannerChecklistTab } from "../../components/projects/PlannerChecklistTab";
import { PlannerProcurementTab } from "../../components/projects/PlannerProcurementTab";
import { PlannerExportsTab } from "../../components/projects/PlannerExportsTab";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================
// PLANNER TYPES
// ============================================================

const PLANNER_MODULES = [
  { value: "CONSULTANCY", label: "Consultancy" },
  { value: "PMC", label: "PMC" },
];

// ============================================================
// LOCATION TYPES
// ============================================================

const LOCATION_TYPES = [
  { value: "FLOOR", label: "Floor" },
  { value: "ROOM", label: "Room" },
  { value: "ZONE", label: "Zone" },
  { value: "AREA", label: "Area" },
];

// ============================================================
// TABS
// ============================================================

const TABS = [
  { value: "setup", label: "Floors & setup", icon: Building2 },
  { value: "checklist", label: "Checklist", icon: ClipboardList },
  { value: "procurement", label: "Vendor & procurement", icon: Truck },
  { value: "exports", label: "Exports", icon: FileOutput },
];

// ============================================================
// HELPERS
// ============================================================

const unwrapArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const normalizeError = (error, fallback = "Something went wrong") => {
  const message = error?.data?.message || error?.error || error?.message;
  if (Array.isArray(message)) return message.join(", ");
  return message || fallback;
};

// ============================================================
// COMPONENT
// ============================================================

export function ProjectPlannerWorkspace() {
  const { projectId: projectIdParam } = useParams();
  const navigate = useNavigate();

  // PROJECT SELECTION
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectIdParam || "",
  );

  useEffect(() => {
    if (projectIdParam) setSelectedProjectId(projectIdParam);
  }, [projectIdParam]);

  const projectId = projectIdParam || selectedProjectId;
  const needsProjectSelection = !projectIdParam;

  // LOCAL STATE
  const [module, setModule] = useState("CONSULTANCY");
  const [activeTab, setActiveTab] = useState("setup");
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationType, setNewLocationType] = useState("FLOOR");
  const [parentLocationId, setParentLocationId] = useState("");

  // PROJECTS
  const { data: projectsResponse, isFetching: isLoadingProjects } =
    useGetProjectsQuery(undefined, { skip: !needsProjectSelection });

  const projects = unwrapArray(projectsResponse);

  // PROJECT PLANNERS
  const {
    data: plannersResponse,
    isFetching: isLoadingPlanners,
    refetch: refetchPlanners,
  } = useGetProjectPlannersQuery(projectId, { skip: !projectId });

  const planners = unwrapArray(plannersResponse);

  const activePlanner = useMemo(
    () => planners.find((planner) => planner.type === module),
    [planners, module],
  );

  const consultancyPlanner = useMemo(
    () => planners.find((planner) => planner.type === "CONSULTANCY"),
    [planners],
  );

  const pmcPlanner = useMemo(
    () => planners.find((planner) => planner.type === "PMC"),
    [planners],
  );

  const procurementPlanner = useMemo(
    () => planners.find((planner) => planner.type === "VENDOR_PROCUREMENT"),
    [planners],
  );

  // LOCATIONS
  const {
    data: locationsResponse,
    isFetching: isLoadingLocations,
    refetch: refetchLocations,
  } = useGetProjectLocationsQuery(projectId, { skip: !projectId });

  const locationTree = unwrapArray(locationsResponse);

  const floorList = useMemo(() => {
    return locationTree
      .filter((location) => location.type === "FLOOR")
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  }, [locationTree]);

  // CURRENT PLANNER ITEMS
  const {
    data: plannerItemsResponse,
    isFetching: isLoadingTasks,
    refetch: refetchPlannerItems,
  } = useGetPlannerItemsQuery(
    { plannerId: activePlanner?.id || "" },
    { skip: !activePlanner?.id },
  );

  const plannerItems = unwrapArray(plannerItemsResponse);
  const isInitialized = plannerItems.length > 0;

  // MUTATIONS
  const [initializeProjectPlanners, { isLoading: isInitializingPlanners }] =
    useInitializeProjectPlannersMutation();
  const [generatePlannerFromTemplate, { isLoading: isGeneratingTemplate }] =
    useGeneratePlannerFromTemplateMutation();
  const [createLocation, { isLoading: isCreatingLocation }] =
    useCreateLocationMutation();

  const isInitializing = isInitializingPlanners || isGeneratingTemplate;

  // CURRENT PROJECT
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId),
    [projects, projectId],
  );

  const selectedModuleLabel =
    PLANNER_MODULES.find((option) => option.value === module)?.label || module;

  // RESET WHEN PROJECT CHANGES
  useEffect(() => {
    setActiveTab("setup");
    setNewLocationName("");
    setNewLocationType("FLOOR");
    setParentLocationId("");
  }, [projectId]);

  // CREATE LOCATION
  const handleAddLocation = async () => {
    if (!projectId) return toast.error("Select a project first");
    if (!newLocationName.trim()) return toast.error("Enter a location name");
    if (newLocationType !== "FLOOR" && !parentLocationId) {
      return toast.error("Select a parent floor/location");
    }

    try {
      await createLocation({
        projectId,
        data: {
          name: newLocationName.trim(),
          type: newLocationType,
          parent_id: parentLocationId || undefined,
          sort_order: locationTree.length,
        },
      }).unwrap();

      toast.success(
        `${
          LOCATION_TYPES.find((item) => item.value === newLocationType)
            ?.label || "Location"
        } added`,
      );

      setNewLocationName("");
      if (newLocationType === "FLOOR") setParentLocationId("");

      await refetchLocations();
    } catch (error) {
      toast.error(normalizeError(error, "Failed to add location"));
    }
  };

  // INITIALIZE PROJECT PLANNERS + GENERATE TEMPLATE
  const handleInitialize = async () => {
    if (!projectId) return toast.error("Select a project first");
    if (floorList.length === 0) {
      return toast.error(
        "Add at least one floor before initializing the checklist",
      );
    }

    try {
      const initialized = await initializeProjectPlanners({
        projectId,
        data: {},
      }).unwrap();

      const initializedPlanners = unwrapArray(initialized);
      let planner = initializedPlanners.find((item) => item.type === module);

      if (!planner) {
        const refreshed = await refetchPlanners();
        const refreshedPlanners = unwrapArray(refreshed?.data);
        planner = refreshedPlanners.find((item) => item.type === module);
      }

      if (!planner?.id) {
        throw new Error(`${selectedModuleLabel} planner could not be resolved`);
      }

      const result = await generatePlannerFromTemplate({
        plannerId: planner.id,
        data: {},
      }).unwrap();

      const createdCount = Number(result?.created_items || 0);
      const skippedCount = Number(result?.skipped_items || 0);

      if (createdCount > 0) {
        toast.success(
          `${selectedModuleLabel} initialized with ${createdCount} planner items`,
        );
      } else if (skippedCount > 0) {
        toast.success(`${selectedModuleLabel} planner is already initialized`);
      } else {
        toast.success(`${selectedModuleLabel} initialized`);
      }

      await refetchPlanners();
      if (activePlanner?.id === planner.id) await refetchPlannerItems();

      setActiveTab("checklist");
    } catch (error) {
      toast.error(normalizeError(error, "Failed to initialize planner"));
    }
  };

  // MODULE CHANGE
  const handleModuleChange = (nextModule) => {
    setModule(nextModule);
    if (activeTab === "procurement") setActiveTab("checklist");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Shell
      title="Project planner"
      subtitle="Consultancy, PMC, floors, task progress and procurement in one workspace."
      action={
        <Button variant="outline" onClick={() => navigate("/planner")}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      }
    >
      <div className="mx-auto max-w-7xl space-y-5">
        {/* HEADER / PROJECT / MODULE */}
        <Card>
          <CardContent className="py-5">
            <div className="flex flex-wrap items-end gap-4">
              {needsProjectSelection && (
                <div className="min-w-[260px]">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Project
                  </p>
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                    disabled={isLoadingProjects}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!needsProjectSelection && projectId && (
                <div className="min-w-[220px]">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Project
                  </p>
                  <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3">
                    <span className="truncate text-sm font-medium text-foreground">
                      {selectedProject?.name || "Current project"}
                    </span>
                  </div>
                </div>
              )}

              <div className="min-w-[200px]">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Planner
                </p>
                <Select value={module} onValueChange={handleModuleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANNER_MODULES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1" />

              {projectId && !isInitialized && (
                <Button
                  onClick={handleInitialize}
                  disabled={isInitializing || floorList.length === 0}
                >
                  <PlayCircle className="h-4 w-4" />
                  {isInitializing
                    ? "Initializing…"
                    : `Initialize ${selectedModuleLabel}`}
                </Button>
              )}
            </div>

            {projectId && !isLoadingPlanners && (
              <div className="mt-4 flex flex-wrap gap-2">
                <PlannerStatusBadge
                  label="Consultancy"
                  exists={!!consultancyPlanner}
                  initialized={
                    module === "CONSULTANCY" ? isInitialized : undefined
                  }
                />
                <PlannerStatusBadge
                  label="PMC"
                  exists={!!pmcPlanner}
                  initialized={module === "PMC" ? isInitialized : undefined}
                />
                <PlannerStatusBadge
                  label="Vendor & procurement"
                  exists={!!procurementPlanner}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* NO PROJECT */}
        {!projectId ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="mx-auto mb-3 h-7 w-7 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">
                Select a project
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a project to open its planner workspace.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* TABS */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start overflow-x-auto">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="gap-1.5"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {/* SETUP */}
            {activeTab === "setup" && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.8fr]">
                <Card>
                  <CardContent className="py-5">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          Project locations
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Create floors and then optionally add rooms, areas or
                          zones underneath them.
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-semibold leading-none text-primary">
                          {floorList.length}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Floors
                        </p>
                      </div>
                    </div>

                    {isLoadingLocations ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : locationTree.length === 0 ? (
                      <div className="mb-4 rounded-lg border border-dashed py-10 text-center">
                        <Building2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-foreground">
                          No locations added
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Start by adding the floors for this project.
                        </p>
                      </div>
                    ) : (
                      <div className="mb-5 space-y-2">
                        {locationTree.map((location) => (
                          <LocationRow key={location.id} location={location} />
                        ))}
                      </div>
                    )}

                    {/* ADD LOCATION */}
                    <div className="border-t pt-4">
                      <p className="mb-3 text-xs font-medium text-foreground">
                        Add location
                      </p>

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-[140px_1fr]">
                        <Select
                          value={newLocationType}
                          onValueChange={(nextType) => {
                            setNewLocationType(nextType);
                            if (nextType === "FLOOR") setParentLocationId("");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCATION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder={
                            newLocationType === "FLOOR"
                              ? "e.g. Ground floor"
                              : "e.g. Master bedroom"
                          }
                          value={newLocationName}
                          onChange={(event) =>
                            setNewLocationName(event.target.value)
                          }
                        />
                      </div>

                      {newLocationType !== "FLOOR" && (
                        <div className="mt-2">
                          <Select
                            value={parentLocationId}
                            onValueChange={setParentLocationId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent location" />
                            </SelectTrigger>
                            <SelectContent>
                              {floorList.map((floor) => (
                                <SelectItem key={floor.id} value={floor.id}>
                                  {floor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button
                        onClick={handleAddLocation}
                        disabled={isCreatingLocation}
                        className="mt-3 w-full"
                      >
                        <Plus className="h-4 w-4" />
                        {isCreatingLocation ? "Adding…" : "Add location"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* PLANNER SETUP STATUS */}
                <Card>
                  <CardContent className="py-5">
                    <h3 className="font-semibold text-foreground">
                      Planner setup
                    </h3>
                    <p className="mb-5 mt-1 text-sm text-muted-foreground">
                      Planner records and master checklist status for this
                      project.
                    </p>

                    {isLoadingPlanners ? (
                      <div className="space-y-3">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <SetupRow
                          label="Consultancy"
                          planner={consultancyPlanner}
                        />
                        <SetupRow label="PMC" planner={pmcPlanner} />
                        <SetupRow
                          label="Vendor & procurement"
                          planner={procurementPlanner}
                        />
                      </div>
                    )}

                    <div className="mt-6 rounded-lg bg-muted/50 p-4">
                      <p className="text-xs font-medium text-primary">
                        Selected planner
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {selectedModuleLabel}
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Checklist items
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {plannerItems.length}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Status
                        </span>
                        <Badge
                          variant={isInitialized ? "success" : "secondary"}
                        >
                          {isInitialized ? "Initialized" : "Not initialized"}
                        </Badge>
                      </div>
                    </div>

                    {!isInitialized && (
                      <Button
                        onClick={handleInitialize}
                        disabled={isInitializing || floorList.length === 0}
                        className="mt-4 w-full"
                      >
                        <PlayCircle className="h-4 w-4" />
                        {isInitializing
                          ? "Initializing…"
                          : `Initialize ${selectedModuleLabel}`}
                      </Button>
                    )}

                    {!isInitialized && floorList.length === 0 && (
                      <p className="mt-3 text-xs text-amber-600">
                        Add at least one floor before initializing the planner.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* CHECKLIST */}
            {activeTab === "checklist" && (
              <>
                {!activePlanner ? (
                  <Card>
                    <CardContent className="py-14 text-center">
                      <ClipboardList className="mx-auto h-7 w-7 text-muted-foreground/50" />
                      <p className="mt-3 text-sm font-semibold text-foreground">
                        {selectedModuleLabel} planner has not been created.
                      </p>
                      <Button
                        onClick={handleInitialize}
                        disabled={isInitializing || floorList.length === 0}
                        className="mt-4"
                      >
                        Initialize planner
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <PlannerChecklistTab
                    projectId={projectId}
                    plannerId={activePlanner.id}
                    plannerType={module}
                    module={module}
                    moduleLabel={selectedModuleLabel}
                    locations={locationTree}
                    floors={floorList}
                    items={plannerItems}
                    taskTree={plannerItems}
                    isLoading={isLoadingTasks}
                    isInitialized={isInitialized}
                    onInitialize={handleInitialize}
                    isInitializing={isInitializing}
                  />
                )}
              </>
            )}

            {/* PROCUREMENT */}
            {activeTab === "procurement" && (
              <>
                {!procurementPlanner ? (
                  <Card>
                    <CardContent className="py-14 text-center">
                      <Truck className="mx-auto h-7 w-7 text-muted-foreground/50" />
                      <p className="mt-3 text-sm font-semibold text-foreground">
                        Vendor & procurement planner is not initialized.
                      </p>
                      <Button
                        className="mt-4"
                        onClick={async () => {
                          try {
                            await initializeProjectPlanners({
                              projectId,
                              data: {},
                            }).unwrap();

                            await refetchPlanners();
                            toast.success(
                              "Vendor & procurement planner initialized",
                            );
                          } catch (error) {
                            toast.error(
                              normalizeError(
                                error,
                                "Failed to initialize procurement planner",
                              ),
                            );
                          }
                        }}
                      >
                        Initialize procurement
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <PlannerProcurementTab
                    projectId={projectId}
                    plannerId={procurementPlanner.id}
                  />
                )}
              </>
            )}

            {/* EXPORTS */}
            {activeTab === "exports" && (
              <PlannerExportsTab
                projectId={projectId}
                plannerId={activePlanner?.id}
                module={module}
                moduleLabel={selectedModuleLabel}
              />
            )}
          </>
        )}
      </div>
    </Shell>
  );
}

// ============================================================
// PLANNER STATUS BADGE
// ============================================================

function PlannerStatusBadge({ label, exists, initialized }) {
  let statusLabel = exists ? "Created" : "Not created";
  if (initialized === true) statusLabel = "Initialized";

  return (
    <Badge
      variant={exists ? "success" : "secondary"}
      className="gap-1.5 font-normal"
    >
      <span className="font-medium">{label}</span>
      <span className="opacity-80">{statusLabel}</span>
    </Badge>
  );
}

// ============================================================
// SETUP ROW
// ============================================================

function SetupRow({ label, planner }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {planner?.id && (
          <p className="mt-0.5 text-xs text-muted-foreground">{planner.id}</p>
        )}
      </div>

      <Badge variant={planner ? "success" : "secondary"}>
        {planner ? "Created" : "Not created"}
      </Badge>
    </div>
  );
}

// ============================================================
// LOCATION TREE ROW
// ============================================================

function LocationRow({ location, level = 0 }) {
  const hasChildren =
    Array.isArray(location.children) && location.children.length > 0;

  return (
    <>
      <div
        className="flex items-center justify-between rounded-lg border px-3 py-2.5"
        style={{ marginLeft: level * 18 }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`h-2 w-2 flex-shrink-0 rounded-full ${
              location.type === "FLOOR"
                ? "bg-primary"
                : "bg-muted-foreground/40"
            }`}
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {location.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {location.type}
              {location.code ? ` · ${location.code}` : ""}
            </p>
          </div>
        </div>

        {hasChildren && (
          <span className="text-xs text-muted-foreground">
            {location.children.length} sub-location
            {location.children.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {hasChildren &&
        location.children.map((child) => (
          <LocationRow key={child.id} location={child} level={level + 1} />
        ))}
    </>
  );
}

export default ProjectPlannerWorkspace;
