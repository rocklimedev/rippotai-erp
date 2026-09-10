import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  FileOutput,
  PlayCircle,
  Plus,
  Trash2,
  Truck,
} from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetProjectsQuery } from "../../api/projects/project.api";
import {
  useListProjectFloorsQuery,
  useCreateProjectFloorMutation,
  useDeleteProjectFloorMutation,
  useListPlannerTemplatesQuery,
  useClonePlannerTemplatesMutation,
  useGetPlannerTaskTreeQuery,
} from "../../api/documents/project-planner.api";

import { PlannerChecklistTab } from "../../components/projects/PlannerChecklistTab";
import { PlannerProcurementTab } from "../../components/projects/PlannerProcurementTab";
import { PlannerExportsTab } from "../../components/projects/PlannerExportsTab";

// ============================================================
// MODULES
// NOTE: keep this in sync with the backend `PlannerModule` enum.
// ============================================================

const PLANNER_MODULES = [
  { value: "CONSULTANCY", label: "Consultancy" },
  { value: "PMC", label: "PMC" },
];

const TABS = [
  { value: "setup", label: "Floors & Setup", icon: Building2 },
  { value: "checklist", label: "Checklist", icon: ClipboardList },
  { value: "procurement", label: "Vendor & Procurement", icon: Truck },
  { value: "exports", label: "Exports", icon: FileOutput },
];

// ============================================================
// COMPONENT
// ============================================================

export function ProjectPlannerWorkspace() {
  const { projectId: projectIdParam } = useParams();
  const navigate = useNavigate();

  // Reached two ways: from inside a project (projectId is in the route
  // already) or from the global planner list ("/planner/create"), in
  // which case the project has to be chosen here first.
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectIdParam || "",
  );

  const projectId = projectIdParam || selectedProjectId;
  const needsProjectSelection = !projectIdParam;

  const [module, setModule] = useState(PLANNER_MODULES[0].value);
  const [activeTab, setActiveTab] = useState("setup");
  const [newFloorName, setNewFloorName] = useState("");
  const [newFloorNumber, setNewFloorNumber] = useState("");

  // ============================================================
  // API
  // ============================================================

  const { data: projects = [] } = useGetProjectsQuery(undefined, {
    skip: !needsProjectSelection,
  });

  const { data: floors, isFetching: isLoadingFloors } =
    useListProjectFloorsQuery(projectId, { skip: !projectId });

  const [createFloor, { isLoading: isCreatingFloor }] =
    useCreateProjectFloorMutation();

  const [deleteFloor] = useDeleteProjectFloorMutation();

  const { data: templates, isFetching: isLoadingTemplates } =
    useListPlannerTemplatesQuery(module, { skip: !module });

  const { data: taskTree, isFetching: isLoadingTasks } =
    useGetPlannerTaskTreeQuery(
      { projectId, module },
      { skip: !projectId || !module },
    );

  const [cloneTemplates, { isLoading: isInitializing }] =
    useClonePlannerTemplatesMutation();

  const floorList = useMemo(
    () =>
      Array.isArray(floors)
        ? [...floors].sort(
            (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
          )
        : [],
    [floors],
  );

  const templateList = Array.isArray(templates) ? templates : [];
  const taskList = Array.isArray(taskTree) ? taskTree : [];
  const isInitialized = taskList.length > 0;

  const templateSummary = useMemo(() => {
    const workCount = templateList.length;
    const detailCount = templateList.reduce(
      (sum, template) => sum + (template.children?.length || 0),
      0,
    );
    return { workCount, detailCount, total: workCount + detailCount };
  }, [templateList]);

  const selectedModuleLabel =
    PLANNER_MODULES.find((option) => option.value === module)?.label || module;

  // ============================================================
  // FLOOR ACTIONS
  // ============================================================

  const handleAddFloor = async () => {
    if (!projectId) {
      toast.error("Select a project first");
      return;
    }
    if (!newFloorName.trim() || !newFloorNumber) {
      toast.error("Enter both a floor number and a floor name");
      return;
    }
    try {
      await createFloor({
        projectId,
        floor_number: Number(newFloorNumber),
        floor_name: newFloorName.trim(),
        sort_order: floorList.length,
      }).unwrap();
      toast.success("Floor added");
      setNewFloorName("");
      setNewFloorNumber("");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to add floor",
      );
    }
  };

  const handleRemoveFloor = async (floor) => {
    if (
      !window.confirm(
        `Remove "${floor.floor_name}"? Any recorded progress for this floor will be lost.`,
      )
    ) {
      return;
    }
    try {
      await deleteFloor({ projectId, floorId: floor.id }).unwrap();
      toast.success("Floor removed");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to remove floor",
      );
    }
  };

  // ============================================================
  // INITIALIZE CHECKLIST
  // ============================================================

  const handleInitialize = async () => {
    if (!projectId) {
      toast.error("Select a project first");
      return;
    }
    if (floorList.length === 0) {
      toast.error("Add at least one floor before initializing the checklist");
      return;
    }
    try {
      await cloneTemplates({ projectId, module }).unwrap();
      toast.success(`${selectedModuleLabel} checklist initialized`);
      setActiveTab("checklist");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to initialize the checklist",
      );
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Shell
      title="Project Planner"
      subtitle="Floors, checklist, vendor procurement and exports — all in one place."
      action={
        <button
          type="button"
          onClick={() => navigate("/planner")}
          className="h-10 px-4 rounded-lg border border-[rgba(31,69,59,0.14)] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      }
    >
      <div className="max-w-6xl mx-auto space-y-5">
        {/* ======================================================
            PROJECT + MODULE HEADER
        ====================================================== */}

        <Card>
          <div className="flex flex-wrap items-end gap-4">
            {needsProjectSelection && (
              <div>
                <p className="text-xs font-semibold text-[#6B7B7C] mb-1">
                  Project
                </p>
                <select
                  className="bc-input h-10 w-64"
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-[#6B7B7C] mb-1">
                Module
              </p>
              <select
                className="bc-input h-10 w-48"
                value={module}
                onChange={(event) => setModule(event.target.value)}
              >
                {PLANNER_MODULES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1" />

            {!isInitialized && projectId && (
              <button
                type="button"
                onClick={handleInitialize}
                disabled={isInitializing || floorList.length === 0}
                className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-2 disabled:opacity-60"
              >
                <PlayCircle size={15} />
                {isInitializing ? "Initializing..." : "Initialize Checklist"}
              </button>
            )}
          </div>

          {!isInitialized && projectId && floorList.length === 0 && (
            <p className="mt-3 text-xs text-amber-700">
              Add at least one floor below before initializing the{" "}
              {selectedModuleLabel} checklist.
            </p>
          )}
        </Card>

        {!projectId ? (
          <Card>
            <p className="text-sm text-gray-500 text-center py-6">
              Select a project above to open its planner workspace.
            </p>
          </Card>
        ) : (
          <>
            {/* ======================================================
                TABS
            ====================================================== */}

            <div className="flex gap-1 border-b border-[rgba(31,69,59,0.14)]">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={`px-4 py-2.5 text-[13px] font-semibold inline-flex items-center gap-1.5 border-b-2 -mb-px transition ${
                      isActive
                        ? "border-[#1F453B] text-[#1F453B]"
                        : "border-transparent text-[#6B7B7C] hover:text-[#333333]"
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ======================================================
                SETUP TAB — floors + template preview
            ====================================================== */}

            {activeTab === "setup" && (
              <div className="space-y-5">
                <Card>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-[#333333]">Floors</h3>
                  </div>
                  <p className="text-xs text-[#6B7B7C] mb-4">
                    Floors are shared across all modules for this project —
                    progress is tracked per floor, per task.
                  </p>

                  {isLoadingFloors ? (
                    <p className="text-sm text-[#6B7B7C]">Loading floors…</p>
                  ) : floorList.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                      <p className="text-sm text-gray-500">
                        No floors added yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {floorList.map((floor) => (
                        <div
                          key={floor.id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                        >
                          <div className="text-sm text-[#333333]">
                            <span className="font-medium">
                              {floor.floor_name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              (Floor {floor.floor_number})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFloor(floor)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-[100px_1fr_auto] gap-2">
                    <Input
                      type="number"
                      placeholder="No."
                      value={newFloorNumber}
                      onChange={(event) =>
                        setNewFloorNumber(event.target.value)
                      }
                    />
                    <Input
                      placeholder="Floor name (e.g. Ground Floor)"
                      value={newFloorName}
                      onChange={(event) => setNewFloorName(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleAddFloor}
                      disabled={isCreatingFloor}
                      className="h-10 px-3 rounded-lg bg-[#1F453B] text-white text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold text-[#333333] mb-1">
                    Templates to Clone
                  </h3>
                  <p className="text-xs text-[#6B7B7C] mb-4">
                    These master checklist items will be copied into this
                    project when you initialize {selectedModuleLabel}.
                  </p>

                  {isLoadingTemplates ? (
                    <p className="text-sm text-[#6B7B7C]">Loading templates…</p>
                  ) : templateSummary.total === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                      <p className="text-sm text-gray-500">
                        No master templates exist for {selectedModuleLabel} yet.
                        Add templates before initializing this checklist.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Work Items
                        </p>
                        <p className="mt-1 text-xl font-semibold text-[#333333]">
                          {templateSummary.workCount}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Detail Sub-items
                        </p>
                        <p className="mt-1 text-xl font-semibold text-[#333333]">
                          {templateSummary.detailCount}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ======================================================
                CHECKLIST TAB
            ====================================================== */}

            {activeTab === "checklist" && (
              <PlannerChecklistTab
                projectId={projectId}
                module={module}
                moduleLabel={selectedModuleLabel}
                floors={floorList}
                taskTree={taskList}
                isLoading={isLoadingTasks}
                isInitialized={isInitialized}
                onInitialize={handleInitialize}
                isInitializing={isInitializing}
              />
            )}

            {/* ======================================================
                PROCUREMENT TAB
            ====================================================== */}

            {activeTab === "procurement" && (
              <PlannerProcurementTab projectId={projectId} />
            )}

            {/* ======================================================
                EXPORTS TAB
            ====================================================== */}

            {activeTab === "exports" && (
              <PlannerExportsTab
                projectId={projectId}
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

export default ProjectPlannerWorkspace;
