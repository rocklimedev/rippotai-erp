import React, { useMemo, useState } from "react";
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

// ============================================================
// ZOHO TASK API
// ============================================================

import {
  useGetZohoPortalsQuery,
  useGetZohoProjectsQuery,
  useGetZohoTasksQuery,
  useCreateZohoTaskMutation,
  useUpdateZohoTaskMutation,
  useReorderZohoTaskMutation,
} from "../../api/connectors/task.api";

// ============================================================
// LOCAL PROJECT API
// ============================================================

import { useGetProjectsQuery } from "../../api/projects/project.api";

// ============================================================
// BUCKETS
// ============================================================

const BUCKETS = [
  {
    key: "today",
    label: "TODAY",
  },
  {
    key: "this_week",
    label: "THIS WEEK",
  },
  {
    key: "month",
    label: "MONTH",
  },
  {
    key: "year",
    label: "YEAR",
  },
];

// ============================================================
// HELPERS
// ============================================================

const priorityChip = (priority) =>
  ({
    low: "bg-[#EAEEF0] text-[#6B7B7C]",
    medium: "bg-[#D8E0DA] text-[#333333]",
    high: "bg-[#D9AF61] text-[#333333]",
    critical: "bg-[#F1D9D3] text-[#7A2E1A]",
  })[String(priority || "").toLowerCase()] || "bg-[#EAEEF0] text-[#6B7B7C]";

const normalizeStatus = (status) =>
  String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getTaskStatus = (task) =>
  normalizeStatus(
    task?.status ??
      task?.status_name ??
      task?.statusName ??
      task?.task_status ??
      task?.taskStatus ??
      "todo",
  );

const isCompletedTask = (task) => {
  const status = getTaskStatus(task);

  return [
    "completed",
    "complete",
    "done",
    "closed",
    "finished",
    "100",
  ].includes(status);
};

const getTaskDueDate = (task) =>
  task?.due_date ??
  task?.dueDate ??
  task?.due_time ??
  task?.dueTime ??
  task?.due ??
  null;

const getTaskId = (task) =>
  String(task?.id ?? task?.task_id ?? task?.taskId ?? "");

const getTaskTitle = (task) =>
  task?.title ??
  task?.task_name ??
  task?.taskName ??
  task?.name ??
  "Untitled Task";

const getProjectName = (task) =>
  task?.project?.name ??
  task?.project?.title ??
  task?.project_name ??
  task?.projectName ??
  "General";

const getTaskPriority = (task) =>
  String(
    task?.priority ?? task?.priority_name ?? task?.priorityName ?? "medium",
  ).toLowerCase();

const getProjectId = (project) =>
  String(project?.id ?? project?.project_id ?? "");

const getProjectLabel = (project) =>
  project?.name ??
  project?.title ??
  project?.project_name ??
  project?.projectName ??
  "Unnamed Project";

const getPortalId = (portal) =>
  String(portal?.id ?? portal?.portal_id ?? portal?.portalId ?? "");

const getPortalLabel = (portal) =>
  portal?.name ??
  portal?.portal_name ??
  portal?.portalName ??
  portal?.title ??
  "Unnamed Portal";

// ============================================================
// RESPONSE NORMALIZERS
// ============================================================

const extractRecords = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  const keys = [
    "data",
    "portals",
    "projects",
    "tasks",
    "items",
    "results",
    "records",
  ];

  for (const key of keys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }

  if (
    response?.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    for (const key of keys) {
      if (Array.isArray(response.data?.[key])) {
        return response.data[key];
      }
    }
  }

  return [];
};

// ============================================================
// DATE HELPERS
// ============================================================

const startOfDay = (date) => {
  const value = new Date(date);

  value.setHours(0, 0, 0, 0);

  return value;
};

const endOfDay = (date) => {
  const value = new Date(date);

  value.setHours(23, 59, 59, 999);

  return value;
};

const endOfWeek = (date) => {
  const value = startOfDay(date);

  const day = value.getDay();

  const daysUntilSaturday = 6 - day;

  value.setDate(value.getDate() + daysUntilSaturday);

  return endOfDay(value);
};

const endOfMonth = (date) => {
  const value = new Date(date);

  return new Date(
    value.getFullYear(),
    value.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
};

const endOfYear = (date) => {
  const value = new Date(date);

  return new Date(value.getFullYear(), 11, 31, 23, 59, 59, 999);
};

// ============================================================
// TASK BUCKET
// ============================================================

const getBucketForTask = (task) => {
  const dueValue = getTaskDueDate(task);

  /*
   * Tasks without a due date are shown under TODAY.
   */
  if (!dueValue) {
    return "today";
  }

  const due = new Date(dueValue);

  if (Number.isNaN(due.getTime())) {
    return "today";
  }

  const now = new Date();

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (due >= todayStart && due <= todayEnd) {
    return "today";
  }

  if (due <= endOfWeek(now)) {
    return "this_week";
  }

  if (due <= endOfMonth(now)) {
    return "month";
  }

  return "year";
};

// ============================================================
// SORT
// ============================================================

const sortTasks = (tasks) => {
  return [...tasks].sort((a, b) => {
    const aOrder =
      Number(a?.order_index ?? a?.orderIndex ?? a?.sequence ?? 0) || 0;

    const bOrder =
      Number(b?.order_index ?? b?.orderIndex ?? b?.sequence ?? 0) || 0;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    const aDueValue = getTaskDueDate(a);
    const bDueValue = getTaskDueDate(b);

    const aDue = aDueValue
      ? new Date(aDueValue).getTime()
      : Number.MAX_SAFE_INTEGER;

    const bDue = bDueValue
      ? new Date(bDueValue).getTime()
      : Number.MAX_SAFE_INTEGER;

    return aDue - bDue;
  });
};

// ============================================================
// TASK CARD
// ============================================================

function TaskCard({ task, onToggleDone }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getTaskId(task),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const done = isCompletedTask(task);

  const projectName = getProjectName(task);
  const dueDate = getTaskDueDate(task);
  const title = getTaskTitle(task);
  const priority = getTaskPriority(task);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`task-card-${getTaskId(task)}`}
      className={`bc-card p-3 mb-2 border border-[rgba(31,69,59,0.10)] ${
        done ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {/* DRAG HANDLE */}

        <button
          {...attributes}
          {...listeners}
          type="button"
          title="Drag"
          aria-label={`Drag task ${title}`}
          className="cursor-grab active:cursor-grabbing text-[#B5C4B6] hover:text-[#333333] pt-0.5 shrink-0 touch-none"
          data-testid={`task-drag-${getTaskId(task)}`}
        >
          <GripVertical size={16} />
        </button>

        {/* COMPLETE */}

        <input
          type="checkbox"
          checked={done}
          onChange={() => onToggleDone(task)}
          className="mt-1 shrink-0 accent-[#1F453B]"
          aria-label={`Mark ${title} as ${done ? "incomplete" : "complete"}`}
          data-testid={`task-check-${getTaskId(task)}`}
        />

        {/* CONTENT */}

        <div className="flex-1 min-w-0">
          <div
            title={title}
            className={`text-[13.5px] font-semibold text-[#333333] ${
              done ? "line-through" : ""
            } truncate`}
          >
            {title}
          </div>

          <div className="text-[11.5px] text-[#6B7B7C] mt-0.5 truncate">
            <span title={projectName}>{projectName}</span>

            {dueDate && (
              <>
                {" · "}
                {String(dueDate).slice(0, 10)}
              </>
            )}
          </div>

          <div className="mt-1.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${priorityChip(
                priority,
              )}`}
            >
              {priority}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COLUMN
// ============================================================

function Column({ bucket, tasks, onToggleDone }) {
  const { setNodeRef, isOver } = useDroppable({
    id: bucket.key,
  });

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
          items={tasks.map((task) => getTaskId(task))}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={getTaskId(task)}
              task={task}
              onToggleDone={onToggleDone}
            />
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

// ============================================================
// BOARD
// ============================================================

export default function TasksBoard() {
  // ==========================================================
  // ZOHO PORTALS
  // ==========================================================

  const {
    data: portalsResponse,
    isLoading: isPortalsLoading,
    isFetching: isPortalsFetching,
    refetch: refetchPortals,
  } = useGetZohoPortalsQuery();

  // ==========================================================
  // ZOHO PROJECTS
  // ==========================================================

  const [selectedPortalId, setSelectedPortalId] = useState("");

  const [selectedProjectId, setSelectedProjectId] = useState("");

  const portals = useMemo(() => {
    const records = extractRecords(portalsResponse);

    return records
      .map((portal, index) => ({
        ...portal,
        id: getPortalId(portal) || `portal-${index}`,
      }))
      .filter(Boolean);
  }, [portalsResponse]);

  const effectivePortalId = selectedPortalId || getPortalId(portals[0]);

  const {
    data: zohoProjectsResponse,
    isLoading: isZohoProjectsLoading,
    isFetching: isZohoProjectsFetching,
    refetch: refetchZohoProjects,
  } = useGetZohoProjectsQuery(
    {
      portalId: effectivePortalId,
    },
    {
      skip: !effectivePortalId,
    },
  );

  const zohoProjects = useMemo(() => {
    const records = extractRecords(zohoProjectsResponse);

    return records;
  }, [zohoProjectsResponse]);

  const effectiveProjectId = selectedProjectId || getProjectId(zohoProjects[0]);

  // ==========================================================
  // ZOHO TASKS
  // ==========================================================

  const {
    data: zohoTasksResponse,
    refetch: refetchTasks,
    isLoading: isTasksLoading,
    isFetching: isTasksFetching,
  } = useGetZohoTasksQuery(
    {
      portalId: effectivePortalId,
      projectId: effectiveProjectId,
      limit: 1000,
    },
    {
      skip: !effectivePortalId || !effectiveProjectId,
    },
  );

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const [createZohoTask, { isLoading: isCreating }] =
    useCreateZohoTaskMutation();

  const [updateZohoTask] = useUpdateZohoTaskMutation();

  const [reorderZohoTask] = useReorderZohoTaskMutation();

  // ==========================================================
  // LOCAL PROJECTS
  // ==========================================================

  const { data: projectsResponse, isLoading: isProjectsLoading } =
    useGetProjectsQuery({
      includeArchived: false,
    });

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    title: "",
    project_id: "",
    priority: "medium",
    due_date: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // ==========================================================
  // NORMALIZE TASK RESPONSE
  // ==========================================================

  const personalTasks = useMemo(() => {
    return extractRecords(zohoTasksResponse);
  }, [zohoTasksResponse]);

  // ==========================================================
  // NORMALIZE LOCAL PROJECTS
  // ==========================================================

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

  // ==========================================================
  // BUILD BOARD
  // ==========================================================

  const board = useMemo(() => {
    const result = {
      today: [],
      this_week: [],
      month: [],
      year: [],
    };

    personalTasks.forEach((task) => {
      if (!task) {
        return;
      }

      const bucket = getBucketForTask(task);

      if (result[bucket]) {
        result[bucket].push(task);
      }
    });

    Object.keys(result).forEach((key) => {
      result[key] = sortTasks(result[key]);
    });

    return result;
  }, [personalTasks]);

  // ==========================================================
  // FIND TASK
  // ==========================================================

  const findTask = (id) => {
    const taskId = String(id);

    for (const bucket of BUCKETS) {
      const task = board[bucket.key]?.find(
        (item) => getTaskId(item) === taskId,
      );

      if (task) {
        return {
          task,
          bucket: bucket.key,
        };
      }
    }

    return null;
  };

  // ==========================================================
  // CALCULATE DUE DATE
  // ==========================================================

  const calculateDueDate = (bucket) => {
    const now = new Date();

    switch (bucket) {
      case "today":
        return endOfDay(now).toISOString();

      case "this_week":
        return endOfWeek(now).toISOString();

      case "month":
        return endOfMonth(now).toISOString();

      case "year":
        return endOfYear(now).toISOString();

      default:
        return null;
    }
  };

  // ==========================================================
  // DRAG END
  // ==========================================================

  const onDragEnd = async ({ active, over }) => {
    if (!over) {
      return;
    }

    if (!effectivePortalId || !effectiveProjectId) {
      toast.error("Select a Zoho project first");
      return;
    }

    const src = findTask(active.id);

    if (!src) {
      return;
    }

    const overIsBucket = BUCKETS.some(
      (bucket) => bucket.key === String(over.id),
    );

    let destBucket = src.bucket;

    if (overIsBucket) {
      destBucket = String(over.id);
    } else {
      const destination = findTask(over.id);

      if (destination) {
        destBucket = destination.bucket;
      }
    }

    // ========================================================
    // SAME COLUMN REORDER
    // ========================================================

    if (
      destBucket === src.bucket &&
      !overIsBucket &&
      String(active.id) !== String(over.id)
    ) {
      const currentTasks = [...(board[src.bucket] || [])];

      const oldIndex = currentTasks.findIndex(
        (task) => getTaskId(task) === String(active.id),
      );

      const newIndex = currentTasks.findIndex(
        (task) => getTaskId(task) === String(over.id),
      );

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const reordered = arrayMove(currentTasks, oldIndex, newIndex);

      try {
        /*
         * Use the dedicated Zoho reorder endpoint
         * rather than repeatedly updating every task.
         */

        const movedTask = reordered.find(
          (task) => getTaskId(task) === String(active.id),
        );

        if (!movedTask) {
          return;
        }

        await reorderZohoTask({
          portalId: effectivePortalId,
          projectId: effectiveProjectId,
          taskId: getTaskId(movedTask),
          order_index: newIndex,
        }).unwrap();

        toast.success("Task order saved");

        await refetchTasks();
      } catch (error) {
        console.error("Failed to save task order:", error);

        toast.error(error?.data?.message || "Failed to save task order");

        await refetchTasks();
      }

      return;
    }

    // ========================================================
    // CROSS COLUMN MOVE
    // ========================================================

    if (destBucket !== src.bucket) {
      const newDueDate = calculateDueDate(destBucket);

      const destinationTasks = board[destBucket] || [];

      const newOrderIndex = destinationTasks.length;

      try {
        await updateZohoTask({
          portalId: effectivePortalId,
          projectId: effectiveProjectId,
          taskId: getTaskId(src.task),
          due_date: newDueDate,
          order_index: newOrderIndex,
        }).unwrap();

        toast.success(`Moved to ${destBucket.replace("_", " ").toUpperCase()}`);

        await refetchTasks();
      } catch (error) {
        console.error("Task move failed:", error);

        toast.error(error?.data?.message || "Move failed");

        await refetchTasks();
      }
    }
  };

  // ==========================================================
  // TOGGLE DONE
  // ==========================================================

  const toggleDone = async (task) => {
    if (!effectivePortalId || !effectiveProjectId) {
      toast.error("Select a Zoho project first");
      return;
    }

    const completed = isCompletedTask(task);

    try {
      await updateZohoTask({
        portalId: effectivePortalId,
        projectId: effectiveProjectId,
        taskId: getTaskId(task),
        status: completed ? "todo" : "completed",
      }).unwrap();

      toast.success(completed ? "Task reopened" : "Task completed");

      await refetchTasks();
    } catch (error) {
      console.error("Failed to update task status:", error);

      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  // ==========================================================
  // CREATE TASK
  // ==========================================================

  const handleCreateTask = async (event) => {
    event.preventDefault();

    if (!effectivePortalId || !effectiveProjectId) {
      toast.error("Select a Zoho portal and project first");
      return;
    }

    const title = form.title.trim();

    if (!title) {
      toast.error("Title required");
      return;
    }

    try {
      const dueDate = form.due_date
        ? new Date(`${form.due_date}T23:59:00`).toISOString()
        : new Date().toISOString();

      const payload = {
        portalId: effectivePortalId,
        projectId: effectiveProjectId,

        title,

        priority: form.priority || "medium",

        status: "todo",

        due_date: dueDate,
      };

      if (form.project_id) {
        payload.project_id = form.project_id;
      }

      await createZohoTask(payload).unwrap();

      toast.success("Task created");

      setShowCreate(false);

      setForm({
        title: "",
        project_id: "",
        priority: "medium",
        due_date: "",
      });

      await refetchTasks();
    } catch (error) {
      console.error("Failed to create Zoho task:", error);

      toast.error(
        error?.data?.message || error?.message || "Failed to create task",
      );
    }
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchPortals(),
        effectivePortalId ? refetchZohoProjects() : Promise.resolve(),
        effectiveProjectId ? refetchTasks() : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Failed to refresh tasks:", error);

      toast.error("Failed to refresh tasks");
    }
  };

  // ==========================================================
  // PORTAL CHANGE
  // ==========================================================

  const handlePortalChange = (event) => {
    const value = event.target.value;

    setSelectedPortalId(value);

    setSelectedProjectId("");
  };

  // ==========================================================
  // PROJECT CHANGE
  // ==========================================================

  const handleProjectChange = (event) => {
    setSelectedProjectId(event.target.value);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div>
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        className="flex items-center justify-between mb-4 gap-3 flex-wrap"
        data-testid="dashboard-header-tasks"
      >
        <div>
          <h1
            className="text-[36px] font-bold text-[#333333]"
            style={{
              fontFamily: "Poppins",
            }}
          >
            Tasks
          </h1>

          <p className="text-[12px] text-[#6B7B7C] mt-0.5">
            Zoho Projects Tasks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="dashboard-refresh-tasks"
            onClick={handleRefresh}
            disabled={
              isTasksFetching || isPortalsFetching || isZohoProjectsFetching
            }
            title="Refresh"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[rgba(31,69,59,0.14)] bg-white text-[#333333] hover:bg-[#F4F6F7] disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                isTasksFetching || isPortalsFetching || isZohoProjectsFetching
                  ? "animate-spin"
                  : ""
              }
            />
          </button>

          <button
            type="button"
            data-testid="dashboard-cta-tasks"
            onClick={() => setShowCreate(true)}
            disabled={!effectivePortalId || !effectiveProjectId}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "#1F453B",
            }}
          >
            <Plus size={14} />
            Add Task
          </button>
        </div>
      </div>

      {/* ====================================================
          PORTAL / PROJECT SELECTOR
      ==================================================== */}

      <div className="bc-card p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* PORTAL */}

          <div>
            <label className="text-[11px] font-semibold text-[#333333] mb-1 block">
              Zoho Portal
            </label>

            <select
              className="bc-input h-10 w-full"
              value={effectivePortalId}
              onChange={handlePortalChange}
              disabled={isPortalsLoading || isPortalsFetching}
            >
              <option value="">— Select Portal —</option>

              {portals.map((portal) => {
                const portalId = getPortalId(portal);

                if (!portalId) {
                  return null;
                }

                return (
                  <option key={portalId} value={portalId}>
                    {getPortalLabel(portal)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* PROJECT */}

          <div>
            <label className="text-[11px] font-semibold text-[#333333] mb-1 block">
              Zoho Project
            </label>

            <select
              className="bc-input h-10 w-full"
              value={effectiveProjectId}
              onChange={handleProjectChange}
              disabled={
                !effectivePortalId ||
                isZohoProjectsLoading ||
                isZohoProjectsFetching
              }
            >
              <option value="">— Select Project —</option>

              {zohoProjects.map((project) => {
                const projectId = getProjectId(project);

                if (!projectId) {
                  return null;
                }

                return (
                  <option key={projectId} value={projectId}>
                    {getProjectLabel(project)}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* ====================================================
          BOARD
      ==================================================== */}

      {!effectivePortalId || !effectiveProjectId ? (
        <div className="bc-card py-16 text-center">
          <div className="text-[14px] font-semibold text-[#333333]">
            Select a Zoho project
          </div>

          <div className="text-[12px] text-[#6B7B7C] mt-1">
            Select a portal and project to load its tasks.
          </div>
        </div>
      ) : isTasksLoading ? (
        <div className="py-16 text-center text-[13px] text-[#B5C4B6]">
          Loading tasks…
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
            data-testid="tasks-board-grid"
          >
            {BUCKETS.map((bucket) => (
              <Column
                key={bucket.key}
                bucket={bucket}
                tasks={board[bucket.key] || []}
                onToggleDone={toggleDone}
              />
            ))}
          </div>
        </DndContext>
      )}

      {/* ====================================================
          CREATE TASK MODAL
      ==================================================== */}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => !isCreating && setShowCreate(false)}
          data-testid="task-create-modal"
        >
          <div
            className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2
                  className="text-[16px] font-bold text-[#333333]"
                  style={{
                    fontFamily: "Poppins",
                  }}
                >
                  New Task
                </h2>

                <p className="text-[11px] text-[#6B7B7C] mt-0.5">
                  Create a Zoho Project task
                </p>
              </div>

              <button
                type="button"
                disabled={isCreating}
                onClick={() => setShowCreate(false)}
                className="p-1 text-[#6B7B7C] hover:text-[#333333] disabled:opacity-40"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* ACTIVE CONTEXT */}

            <div className="mb-3 rounded-lg bg-[#F4F6F7] px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[#6B7B7C]">
                Creating in
              </div>

              <div className="text-[12px] font-semibold text-[#333333] mt-0.5">
                {
                  zohoProjects.find(
                    (project) => getProjectId(project) === effectiveProjectId,
                  )?.name
                }
              </div>
            </div>

            <form onSubmit={handleCreateTask} className="grid gap-3">
              {/* TITLE */}

              <div>
                <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                  Title
                </label>

                <input
                  required
                  autoFocus
                  className="bc-input h-10 w-full"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Enter task title"
                  data-testid="task-create-title"
                  disabled={isCreating}
                />
              </div>

              {/* PROJECT + PRIORITY */}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                    ERP Project
                  </label>

                  <select
                    className="bc-input h-10 w-full"
                    value={form.project_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        project_id: event.target.value,
                      }))
                    }
                    disabled={isProjectsLoading || isCreating}
                  >
                    <option value="">— General —</option>

                    {projects.map((project) => {
                      const projectId = getProjectId(project);

                      if (!projectId) {
                        return null;
                      }

                      return (
                        <option key={projectId} value={projectId}>
                          {getProjectLabel(project)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                    Priority
                  </label>

                  <select
                    className="bc-input h-10 w-full"
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        priority: event.target.value,
                      }))
                    }
                    disabled={isCreating}
                  >
                    {["low", "medium", "high", "critical"].map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DUE DATE */}

              <div>
                <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                  Due date
                </label>

                <input
                  type="date"
                  className="bc-input h-10 w-full"
                  value={form.due_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      due_date: event.target.value,
                    }))
                  }
                  disabled={isCreating}
                />

                <div className="text-[10.5px] text-[#6B7B7C] mt-1">
                  Leave blank to use today.
                </div>
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={
                  isCreating || !effectivePortalId || !effectiveProjectId
                }
                className="h-10 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: "#1F453B",
                }}
                data-testid="task-create-submit"
              >
                {isCreating ? "Creating…" : "Create Task"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
