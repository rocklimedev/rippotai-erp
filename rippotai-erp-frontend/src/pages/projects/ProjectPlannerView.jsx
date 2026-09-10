import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Plus,
  Trash2,
  Check,
  CornerDownRight,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { Shell, Card, Input } from "../../hooks/shared";

import {
  useGetPlannerTaskTreeQuery,
  useListProjectFloorsQuery,
  useCreatePlannerTaskMutation,
  useDeletePlannerTaskMutation,
  useRecordFloorProgressMutation,
  useRecordPlannerExportMutation,
} from "../../api/documents/project-planner.api";

// ============================================================
// MODULES
// NOTE: keep this in sync with the backend `PlannerModule` enum.
// ============================================================

const PLANNER_MODULE_LABELS = {
  civil: "Civil Works",
  interior: "Interior Finishing",
  mep: "MEP (Electrical & Plumbing)",
  landscaping: "Landscaping",
};

// ============================================================
// HELPERS
// ============================================================

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatDate = (value) => {
  if (!value) return "";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const progressFor = (task, floorId) =>
  (task.floor_progress || []).find(
    (progress) => progress.project_floor_id === floorId,
  );

// ============================================================
// PROGRESS CELL
// ============================================================

const ProgressCell = ({ task, floor, onToggle, saving }) => {
  const progress = progressFor(task, floor.id);
  const isDone = Boolean(progress?.completed_date);

  return (
    <button
      type="button"
      title={
        isDone
          ? `Completed ${formatDate(progress.completed_date)} — click to clear`
          : "Mark complete for this floor"
      }
      disabled={saving}
      onClick={() => onToggle(task, floor, !isDone)}
      className={`flex h-9 w-full items-center justify-center rounded-md border text-xs font-medium transition disabled:opacity-50 ${
        isDone
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-gray-200 bg-white text-gray-300 hover:border-primary/40 hover:text-primary"
      }`}
    >
      {isDone ? (
        <span className="flex items-center gap-1">
          <Check className="h-3.5 w-3.5" />
          {formatDate(progress.completed_date)}
        </span>
      ) : (
        "—"
      )}
    </button>
  );
};

// ============================================================
// TASK ROW (WORK or DETAILS)
// ============================================================

const TaskRow = ({
  task,
  isChild,
  floors,
  onToggleProgress,
  onDelete,
  onAddChild,
  savingCellKey,
}) => (
  <tr className="transition hover:bg-gray-50">
    <td
      className="sticky left-0 bg-white px-4 py-2.5"
      style={{ minWidth: 260 }}
    >
      <div className={`flex items-center gap-2 ${isChild ? "pl-6" : ""}`}>
        {isChild && (
          <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
        )}

        <span
          className={`text-sm ${
            isChild ? "text-gray-600" : "font-semibold text-gray-900"
          }`}
        >
          {task.title}
        </span>
      </div>
    </td>

    {floors.map((floor) => (
      <td key={floor.id} className="px-2 py-2">
        <ProgressCell
          task={task}
          floor={floor}
          onToggle={onToggleProgress}
          saving={savingCellKey === `${task.id}:${floor.id}`}
        />
      </td>
    ))}

    <td className="px-3 py-2">
      <div className="flex items-center justify-end gap-1">
        {!isChild && (
          <button
            type="button"
            title="Add detail item"
            onClick={() => onAddChild(task)}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-primary/10 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          title="Delete"
          onClick={() => onDelete(task)}
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </td>
  </tr>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ProjectPlannerView() {
  const { projectId, module } = useParams();
  const navigate = useNavigate();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingChildFor, setAddingChildFor] = useState(null);
  const [newChildTitle, setNewChildTitle] = useState("");
  const [savingCellKey, setSavingCellKey] = useState(null);
  const [exporting, setExporting] = useState(false);

  const moduleLabel = PLANNER_MODULE_LABELS[module] || module;

  // ============================================================
  // API
  // ============================================================

  const {
    data: tree,
    isFetching,
    isError,
  } = useGetPlannerTaskTreeQuery({ projectId, module }, { skip: !projectId });

  const { data: floors, isFetching: isLoadingFloors } =
    useListProjectFloorsQuery(projectId, { skip: !projectId });

  const [createTask, { isLoading: isCreatingTask }] =
    useCreatePlannerTaskMutation();

  const [deleteTask] = useDeletePlannerTaskMutation();

  const [recordFloorProgress] = useRecordFloorProgressMutation();

  const [recordExport] = useRecordPlannerExportMutation();

  const tasks = Array.isArray(tree) ? tree : [];

  const floorList = useMemo(
    () =>
      Array.isArray(floors)
        ? [...floors].sort(
            (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
          )
        : [],
    [floors],
  );

  // ============================================================
  // OVERALL PROGRESS
  // ============================================================

  const overallPercent = useMemo(() => {
    const allTasks = tasks.flatMap((task) => [task, ...(task.children || [])]);

    const totalCells = allTasks.length * floorList.length;

    if (!totalCells) return 0;

    const completedCells = allTasks.reduce((sum, task) => {
      return (
        sum + (task.floor_progress || []).filter((p) => p.completed_date).length
      );
    }, 0);

    return Math.round((completedCells / totalCells) * 100);
  }, [tasks, floorList]);

  // ============================================================
  // TASK ACTIONS
  // ============================================================

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Enter a title for the new work item");
      return;
    }

    try {
      await createTask({
        projectId,
        module,
        title: newTaskTitle.trim(),
        parent_id: null,
      }).unwrap();

      setNewTaskTitle("");

      toast.success("Work item added");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to add work item",
      );
    }
  };

  const handleAddChild = async () => {
    if (!newChildTitle.trim() || !addingChildFor) {
      toast.error("Enter a title for the detail item");
      return;
    }

    try {
      await createTask({
        projectId,
        module,
        title: newChildTitle.trim(),
        parent_id: addingChildFor.id,
      }).unwrap();

      setNewChildTitle("");
      setAddingChildFor(null);

      toast.success("Detail item added");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to add detail item",
      );
    }
  };

  const handleDelete = async (task) => {
    const hasChildren = (task.children || []).length > 0;

    if (
      !window.confirm(
        hasChildren
          ? `Delete "${task.title}" and all of its detail items?`
          : `Delete "${task.title}"?`,
      )
    ) {
      return;
    }

    try {
      await deleteTask({ projectId, taskId: task.id }).unwrap();

      toast.success("Task deleted");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to delete task",
      );
    }
  };

  const handleToggleProgress = async (task, floor, markComplete) => {
    const cellKey = `${task.id}:${floor.id}`;

    setSavingCellKey(cellKey);

    try {
      await recordFloorProgress({
        projectId,
        taskId: task.id,
        project_floor_id: floor.id,
        completed_date: markComplete ? todayIso() : null,
      }).unwrap();
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to update progress",
      );
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
      toast.error("Nothing to export yet");
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
      const pageHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.95),
        "JPEG",
        0,
        0,
        pageWidth,
        pageHeight,
      );

      const fileName = `planner_${module}_${todayIso()}.pdf`;

      pdf.save(fileName);

      // Best-effort history log — the file itself was saved locally via
      // jsPDF, so this just records that an export happened. Point
      // file_url at wherever exports are actually uploaded in this app.
      await recordExport({
        projectId,
        module,
        file_url: fileName,
      }).unwrap();

      toast.success("Planner exported to PDF");
    } catch (error) {
      console.error("Planner export failed:", error);

      toast.error("Failed to export planner PDF");
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // LOADING / ERROR
  // ============================================================

  if (isFetching || isLoadingFloors) {
    return (
      <Shell title="Project Planner">
        <div className="text-[13px] text-[#6B7B7C]">Loading…</div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell title="Project Planner">
        <Card>
          <div className="text-center text-[#B5C4B6] py-8">
            Failed to load the planner for this module.
          </div>
        </Card>
      </Shell>
    );
  }

  if (tasks.length === 0) {
    return (
      <Shell title="Project Planner" subtitle={moduleLabel}>
        <Card>
          <div className="text-center py-10">
            <p className="text-sm font-medium text-[#333333]">
              This checklist hasn't been initialized yet.
            </p>

            <p className="mt-1 text-sm text-[#6B7B7C]">
              Set up floors and clone the master templates to get started.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(`/projects/${projectId}/planner/${module}/create`)
              }
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2 text-sm font-medium text-white"
            >
              Initialize Checklist
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
            onClick={() => navigate("/planner")}
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
            ADD WORK ITEM
        ====================================================== */}

        <Card>
          <div className="flex items-center gap-2">
            <Input
              value={newTaskTitle}
              placeholder="New work item title (e.g. Flooring)"
              onChange={(event) => setNewTaskTitle(event.target.value)}
            />

            <button
              type="button"
              onClick={handleAddTask}
              disabled={isCreatingTask}
              className="h-10 shrink-0 px-4 rounded-lg bg-[#1F453B] text-white text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Add Work Item
            </button>
          </div>
        </Card>

        {/* ======================================================
            ADD DETAIL (inline, when a work item is selected)
        ====================================================== */}

        {addingChildFor && (
          <Card>
            <p className="text-xs text-[#6B7B7C] mb-2">
              Adding a detail item under{" "}
              <span className="font-semibold text-[#333333]">
                {addingChildFor.title}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <Input
                value={newChildTitle}
                placeholder="Detail item title (e.g. Tile Selection)"
                onChange={(event) => setNewChildTitle(event.target.value)}
              />

              <button
                type="button"
                onClick={handleAddChild}
                className="h-10 shrink-0 px-4 rounded-lg bg-[#1F453B] text-white text-sm font-medium"
              >
                Save
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddingChildFor(null);
                  setNewChildTitle("");
                }}
                className="h-10 shrink-0 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600"
              >
                Cancel
              </button>
            </div>
          </Card>
        )}

        {/* ======================================================
            GRID
        ====================================================== */}

        <div
          id="planner-export-grid"
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th
                    className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    style={{ minWidth: 260 }}
                  >
                    Checklist Item
                  </th>

                  {floorList.map((floor) => (
                    <th
                      key={floor.id}
                      className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                      style={{ minWidth: 90 }}
                    >
                      {floor.floor_name}
                    </th>
                  ))}

                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <TaskRow
                      task={task}
                      isChild={false}
                      floors={floorList}
                      onToggleProgress={handleToggleProgress}
                      onDelete={handleDelete}
                      onAddChild={setAddingChildFor}
                      savingCellKey={savingCellKey}
                    />

                    {(task.children || []).map((child) => (
                      <TaskRow
                        key={child.id}
                        task={child}
                        isChild
                        floors={floorList}
                        onToggleProgress={handleToggleProgress}
                        onDelete={handleDelete}
                        onAddChild={setAddingChildFor}
                        savingCellKey={savingCellKey}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export default ProjectPlannerView;
