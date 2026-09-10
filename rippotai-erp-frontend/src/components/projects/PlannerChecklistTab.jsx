import React, { useState } from "react";
import { toast } from "sonner";
import { Check, PlayCircle, Plus, Trash2 } from "lucide-react";

import { Card, Input } from "../../hooks/shared";

import {
  useCreatePlannerTaskMutation,
  useDeletePlannerTaskMutation,
  useRecordFloorProgressMutation,
} from "../../api/documents/project-planner.api";

// ============================================================
// Small helper: today's date as an ISO (yyyy-mm-dd) string, which is
// what the backend's @IsDateString-validated `completed_date` expects.
// ============================================================

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// COMPONENT
// ============================================================

export function PlannerChecklistTab({
  projectId,
  module,
  moduleLabel,
  floors,
  taskTree,
  isLoading,
  isInitialized,
  onInitialize,
  isInitializing,
}) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskParentId, setNewTaskParentId] = useState("");

  const [createTask, { isLoading: isCreatingTask }] =
    useCreatePlannerTaskMutation();
  const [deleteTask] = useDeletePlannerTaskMutation();
  const [recordFloorProgress] = useRecordFloorProgressMutation();

  // ------------------------------------------------------------
  // Build a lookup of task.id -> { floorId -> completed_date } so the
  // grid can render a checked/unchecked cell without re-scanning the
  // tree on every render.
  // ------------------------------------------------------------

  const progressByTask = {};
  for (const task of taskTree) {
    for (const row of [task, ...(task.children || [])]) {
      progressByTask[row.id] = {};
      for (const progress of row.floor_progress || []) {
        progressByTask[row.id][progress.project_floor_id] =
          progress.completed_date;
      }
    }
  }

  // ------------------------------------------------------------
  // ACTIONS
  // ------------------------------------------------------------

  const handleToggleCell = async (task, floor) => {
    const isDone = Boolean(progressByTask[task.id]?.[floor.id]);
    try {
      await recordFloorProgress({
        projectId,
        taskId: task.id,
        project_floor_id: floor.id,
        completed_date: isDone ? null : todayIso(),
      }).unwrap();
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to update progress",
      );
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Enter a task title");
      return;
    }
    try {
      await createTask({
        projectId,
        module,
        title: newTaskTitle.trim(),
        parent_id: newTaskParentId || null,
      }).unwrap();
      toast.success("Task added");
      setNewTaskTitle("");
      setNewTaskParentId("");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to add task",
      );
    }
  };

  const handleRemoveTask = async (task) => {
    if (
      !window.confirm(
        `Remove "${task.title}"? This also removes any recorded progress for it.`,
      )
    ) {
      return;
    }
    try {
      await deleteTask({ projectId, taskId: task.id }).unwrap();
      toast.success("Task removed");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Failed to remove task",
      );
    }
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  if (!isInitialized) {
    return (
      <Card>
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            The {moduleLabel} checklist hasn't been initialized for this project
            yet.
          </p>
          <button
            type="button"
            onClick={onInitialize}
            disabled={isInitializing}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-2 disabled:opacity-60 mx-auto"
          >
            <PlayCircle size={15} />
            {isInitializing ? "Initializing..." : "Initialize Checklist"}
          </button>
        </div>
      </Card>
    );
  }

  if (floors.length === 0) {
    return (
      <Card>
        <p className="text-sm text-gray-500 text-center py-6">
          Add at least one floor in the "Floors & Setup" tab to track progress
          here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        {isLoading ? (
          <p className="text-sm text-[#6B7B7C]">Loading checklist…</p>
        ) : taskTree.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No checklist items yet. Add one below.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-3 font-semibold text-[#333333] sticky left-0 bg-white">
                    Task
                  </th>
                  {floors.map((floor) => (
                    <th
                      key={floor.id}
                      className="text-center py-2 px-2 font-semibold text-[#333333] whitespace-nowrap"
                    >
                      {floor.floor_name}
                    </th>
                  ))}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {taskTree.map((task) => (
                  <React.Fragment key={task.id}>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <td className="py-2 pr-3 font-medium text-[#333333] sticky left-0 bg-gray-50/60">
                        {task.title}
                      </td>
                      {floors.map((floor) => (
                        <ProgressCell
                          key={floor.id}
                          done={Boolean(progressByTask[task.id]?.[floor.id])}
                          onToggle={() => handleToggleCell(task, floor)}
                        />
                      ))}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(task)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                    {(task.children || []).map((child) => (
                      <tr key={child.id} className="border-b border-gray-100">
                        <td className="py-2 pr-3 pl-6 text-[#333333] sticky left-0 bg-white">
                          {child.title}
                        </td>
                        {floors.map((floor) => (
                          <ProgressCell
                            key={floor.id}
                            done={Boolean(progressByTask[child.id]?.[floor.id])}
                            onToggle={() => handleToggleCell(child, floor)}
                          />
                        ))}
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(child)}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold text-[#333333] mb-3">
          Add Checklist Item
        </h3>
        <div className="grid grid-cols-[1fr_220px_auto] gap-2">
          <Input
            placeholder="Task title"
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
          />
          <select
            className="bc-input h-10"
            value={newTaskParentId}
            onChange={(event) => setNewTaskParentId(event.target.value)}
          >
            <option value="">Top-level (Work item)</option>
            {taskTree.map((task) => (
              <option key={task.id} value={task.id}>
                Under: {task.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddTask}
            disabled={isCreatingTask}
            className="h-10 px-3 rounded-lg bg-[#1F453B] text-white text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </Card>
    </div>
  );
}

function ProgressCell({ done, onToggle }) {
  return (
    <td className="text-center px-2">
      <button
        type="button"
        onClick={onToggle}
        className={`h-6 w-6 rounded inline-flex items-center justify-center border transition ${
          done
            ? "bg-[#1F453B] border-[#1F453B] text-white"
            : "border-gray-300 text-transparent hover:border-[#1F453B]"
        }`}
        title={done ? "Mark as not done" : "Mark as done"}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    </td>
  );
}

export default PlannerChecklistTab;
