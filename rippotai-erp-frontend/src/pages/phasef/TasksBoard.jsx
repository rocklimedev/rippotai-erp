import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw, GripVertical, X } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// RTK Query
import {
  useGetTaskBoardQuery,
  useCreateTaskMutation,
  useToggleTaskStatusMutation,
  useUpdateTaskMutation,
} from "../../api/task.api";

import { useGetProjectsQuery } from "../../api/project.api";

const BUCKETS = [
  { key: "today", label: "TODAY" },
  { key: "this_week", label: "THIS WEEK" },
  { key: "month", label: "MONTH" },
  { key: "year", label: "YEAR" },
];

const priorityChip = (p) =>
  ({
    low: "bg-[#EAEEF0] text-[#6B7B7C]",
    medium: "bg-[#D8E0DA] text-[#333333]",
    high: "bg-[#D9AF61] text-[#333333]",
    critical: "bg-[#F1D9D3] text-[#7A2E1A]",
  })[p] || "bg-[#EAEEF0] text-[#6B7B7C]";

function TaskCard({ task, onToggleDone }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const done = task.status === "completed";
  const projectName = task.project?.name || task.project_name || "General";

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`task-card-${task.id}`}
      className={`bc-card p-3 mb-2 border border-[rgba(31,69,59,0.10)] ${done ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          title="Drag"
          className="cursor-grab active:cursor-grabbing text-[#B5C4B6] hover:text-[#333333] pt-0.5 shrink-0"
          data-testid={`task-drag-${task.id}`}
        >
          <GripVertical size={16} />
        </button>
        <input
          type="checkbox"
          checked={done}
          onChange={() => onToggleDone(task)}
          className="mt-1 shrink-0"
          data-testid={`task-check-${task.id}`}
        />
        <div className="flex-1 min-w-0">
          <div
            title={task.title}
            className={`text-[13.5px] font-semibold text-[#333333] ${done ? "line-through" : ""} truncate`}
          >
            {task.title}
          </div>
          <div className="text-[11.5px] text-[#6B7B7C] mt-0.5 truncate">
            <span title={projectName}>{projectName}</span>
            {task.due_date && <> · {task.due_date.slice(0, 10)}</>}
          </div>
          <div className="mt-1.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${priorityChip(task.priority)}`}
            >
              {task.priority || "medium"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({ bucket, tasks, onToggleDone }) {
  const { setNodeRef, isOver } = useDroppable({ id: bucket.key });

  return (
    <div className="min-h-[400px]" data-testid={`column-${bucket.key}`}>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6B7B7C]">
          {bucket.label}
        </div>
        <span
          className="text-[11.5px] font-semibold text-[#333333] bg-[#EAEEF0] px-2 py-0.5 rounded-full"
          data-testid={`column-count-${bucket.key}`}
        >
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[360px] rounded-xl border-2 border-dashed p-2 transition-colors ${
          isOver
            ? "bg-[#EFF2ED] border-[#1F453B]"
            : "border-[rgba(31,69,59,0.10)] bg-[#F7F8F5]"
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onToggleDone={onToggleDone} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center text-[12px] text-[#B5C4B6] py-8">
            No tasks · drag here
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksBoard() {
  const {
    data: boardData,
    refetch: refetchBoard,
    isLoading: isBoardLoading,
  } = useGetTaskBoardQuery();

  const [createTask] = useCreateTaskMutation();
  const [toggleTaskStatus] = useToggleTaskStatusMutation();
  const [updateTask] = useUpdateTaskMutation();

  const { data: projects = [], isLoading: isProjectsLoading } =
    useGetProjectsQuery({ includeArchived: false });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    project_id: "",
    priority: "medium",
    due_date: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const board = boardData || { today: [], this_week: [], month: [], year: [] };

  const findTask = (id) => {
    for (const b of BUCKETS) {
      const t = board[b.key]?.find((x) => x.id === id);
      if (t) return { task: t, bucket: b.key };
    }
    return null;
  };

  const calculateDueDate = (bucket) => {
    const now = new Date();
    if (bucket === "today") {
      return new Date(now.setHours(23, 59, 0, 0)).toISOString();
    }
    if (bucket === "this_week") {
      const d = new Date();
      d.setDate(d.getDate() + ((6 - d.getDay()) % 7));
      d.setHours(23, 59, 0, 0);
      return d.toISOString();
    }
    if (bucket === "month") {
      const d = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59);
      return d.toISOString();
    }
    if (bucket === "year") {
      const d = new Date(now.getFullYear(), 11, 31, 23, 59);
      return d.toISOString();
    }
    return null;
  };

  const onDragEnd = async ({ active, over }) => {
    if (!over) return;
    const src = findTask(active.id);
    if (!src) return;

    let destBucket;
    const overIsBucket = BUCKETS.some((b) => b.key === over.id);
    if (overIsBucket) destBucket = over.id;
    else {
      const destInfo = findTask(over.id);
      destBucket = destInfo?.bucket || src.bucket;
    }

    // Same column reorder
    if (destBucket === src.bucket && !overIsBucket && active.id !== over.id) {
      const oldIdx = board[src.bucket].findIndex((t) => t.id === active.id);
      const newIdx = board[src.bucket].findIndex((t) => t.id === over.id);
      const reordered = arrayMove(board[src.bucket], oldIdx, newIdx);

      try {
        await Promise.all(
          reordered.map((t, i) =>
            updateTask({ id: t.id, order_index: i }).unwrap(),
          ),
        );
      } catch {
        toast.error("Failed to save order");
        refetchBoard();
      }
      return;
    }

    // Cross-column move
    if (destBucket !== src.bucket) {
      const newDue = calculateDueDate(destBucket);

      try {
        await updateTask({
          id: active.id,
          due_bucket: destBucket,
          due_date: newDue,
          order_index: board[destBucket]?.length || 0,
        }).unwrap();

        toast.success(`Moved to ${destBucket.replace("_", " ").toUpperCase()}`);
      } catch {
        toast.error("Move failed");
        refetchBoard();
      }
    }
  };

  const toggleDone = async (t) => {
    try {
      await toggleTaskStatus(t.id).unwrap();
      toast.success(t.status === "completed" ? "Reopened" : "Completed");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error("Title required");

    try {
      await createTask({
        title: form.title,
        project_id: form.project_id || null,
        priority: form.priority,
        status: "todo",
        due_date: form.due_date
          ? new Date(form.due_date).toISOString()
          : new Date().toISOString(),
        workload_estimate_hours: 1,
      }).unwrap();

      toast.success("Task created");
      setShowCreate(false);
      setForm({ title: "", project_id: "", priority: "medium", due_date: "" });
    } catch {
      toast.error("Failed to create task");
    }
  };

  return (
    <div>
      <div
        className="flex items-center justify-between mb-4 gap-3 flex-wrap"
        data-testid="dashboard-header-tasks"
      >
        <h1
          className="text-[36px] font-bold text-[#333333]"
          style={{ fontFamily: "Poppins" }}
        >
          Tasks
        </h1>
        <div className="flex items-center gap-2">
          <button
            data-testid="dashboard-refresh-tasks"
            onClick={refetchBoard}
            title="Refresh"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[rgba(31,69,59,0.14)] bg-white text-[#333333] hover:bg-[#F4F6F7]"
          >
            <RefreshCw size={15} />
          </button>
          <button
            data-testid="dashboard-cta-tasks"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold hover:opacity-90"
            style={{ backgroundColor: "#1F453B" }}
          >
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {isBoardLoading ? (
        <div className="py-16 text-center text-[13px] text-[#B5C4B6]">
          Loading board…
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
            data-testid="tasks-board-grid"
          >
            {BUCKETS.map((b) => (
              <Column
                key={b.key}
                bucket={b}
                tasks={board[b.key] || []}
                onToggleDone={toggleDone}
              />
            ))}
          </div>
        </DndContext>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
          data-testid="task-create-modal"
        >
          <div
            className="bg-white rounded-xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-[16px] font-bold text-[#333333]"
                style={{ fontFamily: "Poppins" }}
              >
                New Task
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 text-[#6B7B7C]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="grid gap-3">
              <div>
                <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                  Title
                </label>
                <input
                  required
                  className="bc-input h-10 w-full"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  data-testid="task-create-title"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                    Project
                  </label>
                  <select
                    className="bc-input h-10 w-full"
                    value={form.project_id}
                    onChange={(e) =>
                      setForm({ ...form, project_id: e.target.value })
                    }
                    disabled={isProjectsLoading}
                  >
                    <option value="">— General —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                    Priority
                  </label>
                  <select
                    className="bc-input h-10 w-full"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                  >
                    {["low", "medium", "high", "critical"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                  Due date (blank = Today)
                </label>
                <input
                  type="date"
                  className="bc-input h-10 w-full"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm({ ...form, due_date: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                className="h-10 rounded-lg text-white text-[13px] font-semibold"
                style={{ backgroundColor: "#1F453B" }}
                data-testid="task-create-submit"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
