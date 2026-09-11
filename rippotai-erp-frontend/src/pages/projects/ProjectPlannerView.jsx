import React, { useMemo, useState } from "react";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { toast } from "sonner";

import { ArrowLeft, Check, Download, Plus, Trash2 } from "lucide-react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { Shell, Card, Input } from "../../hooks/shared";

import {
  useGetProjectPlannersQuery,
  useGetProjectLocationsQuery,
  useGetPlannerItemsQuery,
  useCreatePlannerItemMutation,
  useDeletePlannerItemMutation,
  useUpdateItemLocationMutation,
  useAttachPlannerLocationsMutation,
  useGeneratePlannerFromTemplateMutation,
} from "../../api/documents/project-planner.api";

// ============================================================
// PLANNER LABELS
// ============================================================

const PLANNER_LABELS = {
  CONSULTANCY: "Consultancy",
  PMC: "PMC",
  VENDOR_PROCUREMENT: "Vendor & Procurement",
};

// ============================================================
// HELPERS
// ============================================================

const todayIso = () => new Date().toISOString().slice(0, 10);

const unwrapArray = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const normalizeError = (error, fallback) => {
  const message = error?.data?.message || error?.error || error?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || fallback;
};

// ============================================================
// LOCATION HELPERS
// ============================================================

const flattenLocations = (locations = []) => {
  const result = [];

  const walk = (items) => {
    items.forEach((item) => {
      result.push(item);

      if (Array.isArray(item.children)) {
        walk(item.children);
      }
    });
  };

  walk(locations);

  return result;
};

const getFloorLocations = (locations) =>
  flattenLocations(locations)
    .filter((location) => location.type === "FLOOR")
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

// ============================================================
// ITEM LOCATION HELPER
// ============================================================

const getItemLocation = (item, locationId) => {
  return (item.locations || []).find(
    (relation) =>
      relation.location_id === locationId ||
      relation.location?.id === locationId,
  );
};

// ============================================================
// PROGRESS CELL
// ============================================================

function ProgressCell({ item, floor, onToggle, saving, onAttach }) {
  const relation = getItemLocation(item, floor.id);

  const isDone =
    relation?.status === "COMPLETED" ||
    Number(relation?.progress_pct || 0) >= 100;

  if (!relation) {
    return (
      <button
        type="button"
        disabled={saving}
        onClick={() => onAttach(item, floor)}
        title="Add this floor to the planner item"
        className="flex h-9 w-full items-center justify-center rounded-md border border-dashed border-gray-200 bg-white text-[11px] font-medium text-gray-400 transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
      >
        + Add
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={saving}
      onClick={() => onToggle(item, floor, relation, !isDone)}
      title={
        isDone
          ? `Completed ${
              formatDate(relation.actual_end_date) || ""
            } — click to clear`
          : "Mark complete for this floor"
      }
      className={`flex h-9 w-full items-center justify-center rounded-md border text-xs font-medium transition disabled:opacity-50 ${
        isDone
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-gray-200 bg-white text-gray-300 hover:border-primary/40 hover:text-primary"
      }`}
    >
      {isDone ? (
        <span className="flex items-center gap-1">
          <Check className="h-3.5 w-3.5" />

          {formatDate(relation.actual_end_date) || "Done"}
        </span>
      ) : (
        "—"
      )}
    </button>
  );
}

// ============================================================
// PLANNER ROW
// ============================================================

function PlannerItemRow({
  item,
  floors,
  onToggleProgress,
  onAttachFloor,
  onDelete,
  savingCellKey,
}) {
  return (
    <tr className="transition hover:bg-gray-50">
      <td
        className="sticky left-0 z-10 bg-white px-4 py-3"
        style={{
          minWidth: 300,
        }}
      >
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {item.work_name || item.details || "Untitled Work"}
          </p>

          {item.work_name && item.details && (
            <p className="mt-1 text-xs text-gray-500">{item.details}</p>
          )}
        </div>
      </td>

      {floors.map((floor) => {
        const cellKey = `${item.id}:${floor.id}`;

        return (
          <td key={floor.id} className="px-2 py-2">
            <ProgressCell
              item={item}
              floor={floor}
              onToggle={onToggleProgress}
              onAttach={onAttachFloor}
              saving={savingCellKey === cellKey}
            />
          </td>
        );
      })}

      <td className="px-3 py-2 text-center">
        <span className="text-xs font-semibold text-gray-600">
          {Math.round(Number(item.progress_pct || 0))}%
        </span>
      </td>

      <td className="px-3 py-2 text-right">
        <button
          type="button"
          title="Delete item"
          onClick={() => onDelete(item)}
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ============================================================
// MAIN
// ============================================================

export function ProjectPlannerView() {
  const { projectId, plannerId: plannerIdParam } = useParams();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  // Works with:
  //
  // /projects/:projectId/planner/:plannerId
  //
  // and new route:
  //
  // /projects/:projectId/planner?plannerId=<uuid>

  const plannerId = searchParams.get("plannerId") || plannerIdParam || "";

  // ============================================================
  // STATE
  // ============================================================

  const [newWorkName, setNewWorkName] = useState("");

  const [newDetails, setNewDetails] = useState("");

  const [selectedPhaseId, setSelectedPhaseId] = useState("");

  const [savingCellKey, setSavingCellKey] = useState(null);

  const [exporting, setExporting] = useState(false);

  // ============================================================
  // GET PROJECT PLANNERS
  // ============================================================

  const {
    data: plannersResponse,

    isFetching: isLoadingPlanners,
  } = useGetProjectPlannersQuery(projectId, {
    skip: !projectId,
  });

  const planners = unwrapArray(plannersResponse);

  // ============================================================
  // RESOLVE PLANNER BY ID
  // ============================================================

  const planner = useMemo(
    () => planners.find((item) => item.id === plannerId),
    [planners, plannerId],
  );

  const plannerType = planner?.type || "";

  const moduleLabel = PLANNER_LABELS[plannerType] || plannerType || "Planner";

  // ============================================================
  // PROJECT LOCATIONS
  // ============================================================

  const {
    data: locationsResponse,

    isFetching: isLoadingLocations,
  } = useGetProjectLocationsQuery(projectId, {
    skip: !projectId,
  });

  const locationTree = unwrapArray(locationsResponse);

  const floorList = useMemo(
    () => getFloorLocations(locationTree),
    [locationTree],
  );

  // ============================================================
  // PLANNER ITEMS
  // ============================================================

  const {
    data: itemsResponse,

    isFetching: isLoadingItems,

    isError,

    refetch: refetchItems,
  } = useGetPlannerItemsQuery(
    {
      plannerId: planner?.id || "",
    },
    {
      skip: !planner?.id || plannerType === "VENDOR_PROCUREMENT",
    },
  );

  const items = unwrapArray(itemsResponse);

  // ============================================================
  // MUTATIONS
  // ============================================================

  const [createPlannerItem, { isLoading: isCreatingTask }] =
    useCreatePlannerItemMutation();

  const [deletePlannerItem] = useDeletePlannerItemMutation();

  const [updateItemLocation] = useUpdateItemLocationMutation();

  const [attachPlannerLocations] = useAttachPlannerLocationsMutation();

  const [generatePlannerFromTemplate, { isLoading: isGenerating }] =
    useGeneratePlannerFromTemplateMutation();

  // ============================================================
  // PHASES
  // ============================================================

  const phases = useMemo(() => {
    const map = new Map();

    items.forEach((item) => {
      if (item.phase?.id) {
        map.set(item.phase.id, item.phase);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
    );
  }, [items]);

  // Set initial phase once phase data exists
  React.useEffect(() => {
    if (!selectedPhaseId && phases.length) {
      setSelectedPhaseId(phases[0].id);
    }
  }, [phases, selectedPhaseId]);

  // Reset locally-selected phase whenever the planner itself changes
  React.useEffect(() => {
    setSelectedPhaseId("");
  }, [plannerId]);

  // ============================================================
  // GROUP ITEMS BY PHASE
  // ============================================================

  const itemsByPhase = useMemo(() => {
    const map = new Map();

    items.forEach((item) => {
      const phaseId = item.phase_id;

      if (!map.has(phaseId)) {
        map.set(phaseId, {
          phase: item.phase,
          items: [],
        });
      }

      map.get(phaseId).items.push(item);
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        Number(a.phase?.sort_order || 0) - Number(b.phase?.sort_order || 0),
    );
  }, [items]);

  // ============================================================
  // OVERALL PROGRESS
  // ============================================================

  const overallPercent = useMemo(() => {
    const applicable = items.filter((item) => item.status !== "NOT_APPLICABLE");

    if (!applicable.length) {
      return 0;
    }

    const total = applicable.reduce(
      (sum, item) => sum + Number(item.progress_pct || 0),
      0,
    );

    return Math.round(total / applicable.length);
  }, [items]);

  // ============================================================
  // GENERATE FROM TEMPLATE
  // ============================================================

  const handleInitialize = async () => {
    if (!planner?.id) {
      toast.error("Planner has not been created yet");
      return;
    }

    try {
      const response = await generatePlannerFromTemplate({
        plannerId: planner.id,

        data: {},
      }).unwrap();

      if (Number(response?.created_items || 0) > 0) {
        toast.success(`${response.created_items} planner items created`);
      } else {
        toast.success("Planner is already initialized");
      }

      await refetchItems();
    } catch (error) {
      toast.error(normalizeError(error, "Failed to initialize planner"));
    }
  };

  // ============================================================
  // CREATE WORK ITEM
  // ============================================================

  const handleAddTask = async () => {
    if (!planner?.id) {
      toast.error("Planner is not available");
      return;
    }

    if (!selectedPhaseId) {
      toast.error("Select a phase");
      return;
    }

    if (!newWorkName.trim()) {
      toast.error("Enter a work name");
      return;
    }

    try {
      await createPlannerItem({
        plannerId: planner.id,

        data: {
          phase_id: selectedPhaseId,

          work_name: newWorkName.trim(),

          details: newDetails.trim() || undefined,

          location_ids: floorList.map((floor) => floor.id),
        },
      }).unwrap();

      setNewWorkName("");

      setNewDetails("");

      toast.success("Planner item added");
    } catch (error) {
      toast.error(normalizeError(error, "Failed to add planner item"));
    }
  };

  // ============================================================
  // DELETE ITEM
  // ============================================================

  const handleDelete = async (item) => {
    if (
      !window.confirm(
        `Delete "${item.work_name || item.details || "this planner item"}"?`,
      )
    ) {
      return;
    }

    try {
      await deletePlannerItem(item.id).unwrap();

      toast.success("Planner item deleted");
    } catch (error) {
      toast.error(normalizeError(error, "Failed to delete planner item"));
    }
  };

  // ============================================================
  // ATTACH FLOOR TO ITEM
  // ============================================================

  const handleAttachFloor = async (item, floor) => {
    const cellKey = `${item.id}:${floor.id}`;

    setSavingCellKey(cellKey);

    try {
      await attachPlannerLocations({
        itemId: item.id,

        location_ids: [floor.id],
      }).unwrap();

      toast.success(`${floor.name} added`);
    } catch (error) {
      toast.error(normalizeError(error, "Failed to attach floor"));
    } finally {
      setSavingCellKey(null);
    }
  };

  // ============================================================
  // TOGGLE FLOOR PROGRESS
  // ============================================================

  const handleToggleProgress = async (item, floor, relation, markComplete) => {
    const cellKey = `${item.id}:${floor.id}`;

    setSavingCellKey(cellKey);

    try {
      await updateItemLocation({
        id: relation.id,

        data: markComplete
          ? {
              status: "COMPLETED",

              progress_pct: 100,

              actual_end_date: todayIso(),
            }
          : {
              status: "NOT_STARTED",

              progress_pct: 0,

              actual_end_date: null,
            },
      }).unwrap();

      await refetchItems();
    } catch (error) {
      toast.error(normalizeError(error, "Failed to update progress"));
    } finally {
      setSavingCellKey(null);
    }
  };

  // ============================================================
  // EXPORT
  // ============================================================

  const handleExport = async () => {
    const gridEl = document.getElementById("planner-export-grid");

    if (!gridEl) {
      toast.error("Nothing to export");
      return;
    }

    setExporting(true);

    try {
      const canvas = await html2canvas(gridEl, {
        scale: 2,

        backgroundColor: "#ffffff",

        useCORS: true,
      });

      const pdf = new jsPDF({
        orientation: "landscape",

        unit: "mm",

        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();

      const pageHeight = pdf.internal.pageSize.getHeight();

      const imageHeight = (canvas.height * pageWidth) / canvas.width;

      const imageData = canvas.toDataURL("image/jpeg", 0.95);

      if (imageHeight <= pageHeight) {
        pdf.addImage(imageData, "JPEG", 0, 0, pageWidth, imageHeight);
      } else {
        let remainingHeight = imageHeight;

        let position = 0;

        pdf.addImage(imageData, "JPEG", 0, position, pageWidth, imageHeight);

        remainingHeight -= pageHeight;

        while (remainingHeight > 0) {
          position -= pageHeight;

          pdf.addPage();

          pdf.addImage(imageData, "JPEG", 0, position, pageWidth, imageHeight);

          remainingHeight -= pageHeight;
        }
      }

      const fileName = `project_planner_${plannerType || "planner"}_${todayIso()}.pdf`;

      pdf.save(fileName);

      toast.success("Planner exported");
    } catch (error) {
      console.error(error);

      toast.error("Failed to export planner");
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // LOADING PLANNERS (needed before we can resolve plannerId → planner)
  // ============================================================

  if (isLoadingPlanners) {
    return (
      <Shell title="Project Planner">
        <div className="text-[13px] text-[#6B7B7C]">Loading planner…</div>
      </Shell>
    );
  }

  // ============================================================
  // NO PLANNER ID IN THE URL — LET THE USER PICK ONE
  // ============================================================

  if (!plannerId) {
    return (
      <Shell
        title="Project Planner"
        subtitle="Select a planner"
        action={
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}/planner`)}
            className="h-10 px-4 rounded-lg border border-[rgba(31,69,59,0.14)] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        }
      >
        <Card>
          {planners.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-[#333333]">
                No planners have been created for this project yet.
              </p>

              <button
                type="button"
                onClick={() => navigate(`/projects/${projectId}/planner`)}
                className="mt-4 h-10 rounded-lg bg-[#1F453B] px-4 text-sm font-semibold text-white"
              >
                Open Planner Workspace
              </button>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <p className="mb-3 text-sm font-semibold text-[#333333]">
                Choose a planner to open
              </p>

              {planners.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    navigate(`/projects/${projectId}/planner/${item.id}`)
                  }
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left transition hover:border-[#1F453B]/40 hover:bg-gray-50"
                >
                  <span className="text-sm font-medium text-[#333333]">
                    {PLANNER_LABELS[item.type] || item.type}
                  </span>

                  <span className="text-xs text-[#6B7B7C]">Open →</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </Shell>
    );
  }

  // ============================================================
  // PLANNER ID DOESN'T MATCH ANY PLANNER FOR THIS PROJECT
  // ============================================================

  if (!planner) {
    return (
      <Shell
        title="Project Planner"
        action={
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}/planner`)}
            className="h-10 px-4 rounded-lg border border-[rgba(31,69,59,0.14)] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        }
      >
        <Card>
          <div className="py-10 text-center">
            <p className="text-sm font-semibold text-[#333333]">
              This planner doesn't exist for this project.
            </p>

            <p className="mt-1 text-sm text-[#6B7B7C]">
              It may have been removed, or the link is out of date.
            </p>

            <button
              type="button"
              onClick={() => navigate(`/projects/${projectId}/planner`)}
              className="mt-4 rounded-lg bg-[#1F453B] px-4 py-2 text-sm font-medium text-white"
            >
              Open Setup
            </button>
          </div>
        </Card>
      </Shell>
    );
  }

  // ============================================================
  // PROCUREMENT
  // ============================================================

  if (plannerType === "VENDOR_PROCUREMENT") {
    return (
      <Shell title="Project Planner" subtitle="Vendor & Procurement">
        <Card>
          <div className="py-10 text-center">
            <p className="text-sm font-semibold text-[#333333]">
              Vendor & Procurement uses the procurement workspace.
            </p>

            <button
              type="button"
              onClick={() => navigate(`/projects/${projectId}/planner`)}
              className="mt-4 h-10 rounded-lg bg-[#1F453B] px-4 text-sm font-semibold text-white"
            >
              Open Planner Workspace
            </button>
          </div>
        </Card>
      </Shell>
    );
  }

  // ============================================================
  // LOADING LOCATIONS / ITEMS
  // ============================================================

  if (isLoadingLocations || isLoadingItems) {
    return (
      <Shell title="Project Planner" subtitle={moduleLabel}>
        <div className="text-[13px] text-[#6B7B7C]">Loading planner…</div>
      </Shell>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (isError) {
    return (
      <Shell title="Project Planner">
        <Card>
          <div className="py-8 text-center text-red-500">
            Failed to load planner items.
          </div>
        </Card>
      </Shell>
    );
  }

  // ============================================================
  // EMPTY / NOT INITIALIZED
  // ============================================================

  if (items.length === 0) {
    return (
      <Shell
        title="Project Planner"
        subtitle={moduleLabel}
        action={
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}/planner`)}
            className="h-10 px-4 rounded-lg border border-[rgba(31,69,59,0.14)] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        }
      >
        <Card>
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-[#333333]">
              This planner hasn't been initialized yet.
            </p>

            <p className="mt-1 text-sm text-[#6B7B7C]">
              Generate the standard {moduleLabel} workflow from the master
              template.
            </p>

            <button
              type="button"
              onClick={handleInitialize}
              disabled={isGenerating}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isGenerating ? "Initializing..." : `Initialize ${moduleLabel}`}
            </button>
          </div>
        </Card>
      </Shell>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Shell
      title="Project Planner"
      subtitle={`${moduleLabel} • ${overallPercent}% complete`}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}/planner`)}
            className="h-10 px-4 rounded-lg border border-[rgba(31,69,59,0.14)] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download size={14} />

            {exporting ? "Exporting…" : "Export PDF"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* ======================================================
            ADD ITEM
        ====================================================== */}

        <Card>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-[#333333]">
              Add Planner Item
            </h3>

            <p className="mt-1 text-xs text-[#6B7B7C]">
              Add a custom work item under an existing phase.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[200px_1fr_1fr_auto]">
            <select
              value={selectedPhaseId}
              onChange={(event) => setSelectedPhaseId(event.target.value)}
              className="bc-input h-10"
            >
              <option value="">Select Phase</option>

              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.phase_code ? `${phase.phase_code} — ` : ""}
                  {phase.title}
                </option>
              ))}
            </select>

            <Input
              value={newWorkName}
              placeholder="Work item"
              onChange={(event) => setNewWorkName(event.target.value)}
            />

            <Input
              value={newDetails}
              placeholder="Details (optional)"
              onChange={(event) => setNewDetails(event.target.value)}
            />

            <button
              type="button"
              onClick={handleAddTask}
              disabled={isCreatingTask}
              className="h-10 shrink-0 px-4 rounded-lg bg-[#1F453B] text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </Card>

        {/* ======================================================
            PHASE TABLES
        ====================================================== */}

        {itemsByPhase.map(({ phase, items: phaseItems }) => (
          <div
            key={phase?.id || "unknown"}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            {/* ================================================
                  PHASE HEADER
              ================================================ */}

            <div className="flex items-center justify-between border-b border-gray-200 bg-[#F7F9F8] px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7B7C]">
                  {phase?.phase_code || "Phase"}
                </p>

                <h3 className="mt-0.5 font-semibold text-[#333333]">
                  {phase?.title || "Unassigned Phase"}
                </h3>
              </div>

              <span className="text-xs text-[#6B7B7C]">
                {phaseItems.length} item
                {phaseItems.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* ================================================
                  GRID
              ================================================ */}

            <div
              id={
                phase === itemsByPhase[0]?.phase
                  ? "planner-export-grid"
                  : undefined
              }
              className="overflow-x-auto"
            >
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th
                      className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                      style={{
                        minWidth: 300,
                      }}
                    >
                      Work / Details
                    </th>

                    {floorList.map((floor) => (
                      <th
                        key={floor.id}
                        className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                        style={{
                          minWidth: 110,
                        }}
                      >
                        {floor.name}
                      </th>
                    ))}

                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Progress
                    </th>

                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {phaseItems.map((item) => (
                    <PlannerItemRow
                      key={item.id}
                      item={item}
                      floors={floorList}
                      onToggleProgress={handleToggleProgress}
                      onAttachFloor={handleAttachFloor}
                      onDelete={handleDelete}
                      savingCellKey={savingCellKey}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export default ProjectPlannerView;
