import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

import {
  Shell,
  Card,
  Input,
  TextArea,
  Btn,
  BtnGhost,
  PRIORITY_COLOURS,
  STATUS_COLOURS,
  fmtDate,
} from "../../components/Shared";

import {
  useGetZohoPortalsQuery,
  useGetZohoProjectsQuery,
  useGetZohoTasksQuery,
  useCreateZohoTaskMutation,
  useUpdateZohoTaskMutation,
} from "../../api/connectors/task.api";

// ============================================================
// HELPERS
// ============================================================

const getTaskId = (task) =>
  String(task?.id ?? task?.task_id ?? task?.taskId ?? "");

const getTaskTitle = (task) =>
  task?.title ??
  task?.task_name ??
  task?.taskName ??
  task?.name ??
  "Untitled Task";

const getTaskStatus = (task) =>
  String(
    task?.status ??
      task?.status_name ??
      task?.statusName ??
      task?.task_status ??
      task?.taskStatus ??
      "todo",
  )
    .trim()
    .toLowerCase();

const getTaskPriority = (task) =>
  String(
    task?.priority ?? task?.priority_name ?? task?.priorityName ?? "medium",
  )
    .trim()
    .toLowerCase();

const getTaskDueDate = (task) =>
  task?.due_date ??
  task?.dueDate ??
  task?.due_time ??
  task?.dueTime ??
  task?.due ??
  null;

const getProjectName = (task) =>
  task?.project?.name ??
  task?.project?.title ??
  task?.project_name ??
  task?.projectName ??
  "General";

const getAssigneeName = (task) =>
  task?.assignee?.name ??
  task?.assignee?.full_name ??
  task?.assignee?.fullName ??
  task?.assignee_name ??
  task?.assigneeName ??
  task?.owner?.name ??
  task?.owner_name ??
  "Unassigned";

const isCompleted = (task) => {
  const status = getTaskStatus(task);

  return ["completed", "complete", "done", "closed", "finished"].includes(
    status,
  );
};

const getRecords = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.projects)) {
    return response.projects;
  }

  if (Array.isArray(response?.portals)) {
    return response.portals;
  }

  if (Array.isArray(response?.tasks)) {
    return response.tasks;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.records)) {
    return response.records;
  }

  if (Array.isArray(response?.data?.projects)) {
    return response.data.projects;
  }

  if (Array.isArray(response?.data?.tasks)) {
    return response.data.tasks;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  return [];
};

// ============================================================
// TASK CARD
// ============================================================

const TaskCard = ({ task, onStatus, updating }) => {
  const status = getTaskStatus(task);
  const priority = getTaskPriority(task);

  const title = getTaskTitle(task);
  const projectName = getProjectName(task);
  const assigneeName = getAssigneeName(task);
  const dueDate = getTaskDueDate(task);

  const completed = isCompleted(task);

  return (
    <Card>
      <div className="flex items-start gap-2 flex-wrap">
        <span
          className={`text-[10.5px] px-2 py-0.5 rounded-full font-semibold uppercase ${
            PRIORITY_COLOURS[priority] || PRIORITY_COLOURS.medium
          }`}
        >
          {priority}
        </span>

        <span
          className={`text-[10.5px] px-2 py-0.5 rounded-full font-semibold ${
            STATUS_COLOURS[status] || STATUS_COLOURS.todo
          }`}
        >
          {status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="text-[15px] font-semibold text-[#333333] mt-2">
        {title}
      </div>

      <div className="text-[12.5px] text-[#6B7B7C] mt-1">
        {projectName} · {assigneeName} · Due {dueDate ? fmtDate(dueDate) : "—"}
      </div>

      {task?.description && (
        <div className="text-[12.5px] text-[#6B7B7C] mt-2 line-clamp-3">
          {task.description}
        </div>
      )}

      {task?.blocked_reason && (
        <div className="text-[12px] text-[#7A2E1A] mt-2">
          Blocked: {task.blocked_reason}
        </div>
      )}

      <div className="flex gap-2 mt-3 flex-wrap">
        {!completed && (
          <BtnGhost
            disabled={updating}
            onClick={() => onStatus(task, "completed")}
          >
            <CheckCircle2 size={13} />
            Complete
          </BtnGhost>
        )}

        {status === "todo" && (
          <BtnGhost
            disabled={updating}
            onClick={() => onStatus(task, "in_progress")}
          >
            Start
          </BtnGhost>
        )}

        {status !== "blocked" && !completed && (
          <BtnGhost
            disabled={updating}
            onClick={() => onStatus(task, "blocked")}
          >
            <XCircle size={13} />
            Block
          </BtnGhost>
        )}

        {status === "blocked" && (
          <BtnGhost
            disabled={updating}
            onClick={() => onStatus(task, "in_progress")}
          >
            Resume
          </BtnGhost>
        )}
      </div>
    </Card>
  );
};

// ============================================================
// PROJECT SELECTOR
// ============================================================

const ProjectSelector = ({
  portals,
  projects,
  portalId,
  projectId,
  onPortalChange,
  onProjectChange,
}) => {
  return (
    <Card>
      <div className="grid md:grid-cols-2 gap-3">
        {/* PORTAL */}

        <div>
          <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
            Portal
          </label>

          <select
            className="bc-input h-10 w-full"
            value={portalId}
            onChange={(event) => onPortalChange(event.target.value)}
          >
            <option value="">Select portal</option>

            {portals.map((portal) => (
              <option key={portal.id} value={portal.id}>
                {portal.name}
              </option>
            ))}
          </select>
        </div>

        {/* PROJECT */}

        <div>
          <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
            Project
          </label>

          <select
            className="bc-input h-10 w-full"
            value={projectId}
            disabled={!portalId}
            onChange={(event) => onProjectChange(event.target.value)}
          >
            <option value="">
              {portalId ? "Select project" : "Select portal first"}
            </option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
};

// ============================================================
// TASK LIST
// ============================================================

export function TasksList({ view = "all" }) {
  const [portalId, setPortalId] = useState("");
  const [projectId, setProjectId] = useState("");

  // ==========================================================
  // PORTALS
  // ==========================================================

  const { data: portalsResponse, isLoading: portalsLoading } =
    useGetZohoPortalsQuery();

  const portals = useMemo(() => getRecords(portalsResponse), [portalsResponse]);

  // Automatically select first portal.
  React.useEffect(() => {
    if (!portalId && portals.length > 0) {
      setPortalId(String(portals[0].id));
    }
  }, [portals, portalId]);

  // ==========================================================
  // PROJECTS
  // ==========================================================

  const { data: projectsResponse, isLoading: projectsLoading } =
    useGetZohoProjectsQuery(
      {
        portalId,
      },
      {
        skip: !portalId,
      },
    );

  const projects = useMemo(
    () => getRecords(projectsResponse),
    [projectsResponse],
  );

  // Automatically select first project.
  React.useEffect(() => {
    if (!portalId) {
      setProjectId("");
      return;
    }

    if (
      projectId &&
      projects.some((project) => String(project.id) === String(projectId))
    ) {
      return;
    }

    if (projects.length > 0) {
      setProjectId(String(projects[0].id));
    } else {
      setProjectId("");
    }
  }, [portalId, projects, projectId]);

  // ==========================================================
  // TASKS
  // ==========================================================

  const {
    data: tasksResponse,
    isLoading: tasksLoading,
    isFetching,
    refetch,
  } = useGetZohoTasksQuery(
    {
      portalId,
      projectId,
      limit: 1000,
    },
    {
      skip: !portalId || !projectId,
    },
  );

  const [updateZohoTask, { isLoading: updating }] = useUpdateZohoTaskMutation();

  const tasks = useMemo(() => getRecords(tasksResponse), [tasksResponse]);

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredTasks = useMemo(() => {
    switch (view) {
      case "overdue": {
        const now = new Date();

        return tasks.filter((task) => {
          const dueDate = getTaskDueDate(task);

          if (!dueDate || isCompleted(task)) {
            return false;
          }

          const due = new Date(dueDate);

          return !Number.isNaN(due.getTime()) && due < now;
        });
      }

      case "blocked":
        return tasks.filter((task) => getTaskStatus(task) === "blocked");

      case "completed":
        return tasks.filter((task) => isCompleted(task));

      case "mine":
      case "all":
      default:
        return tasks;
    }
  }, [tasks, view]);

  // ==========================================================
  // STATUS UPDATE
  // ==========================================================

  const changeStatus = async (task, status) => {
    const taskId = getTaskId(task);

    if (!taskId) {
      toast.error("Task ID is missing");
      return;
    }

    if (!portalId || !projectId) {
      toast.error("Portal and project are required");
      return;
    }

    try {
      await updateZohoTask({
        portalId,
        projectId,
        taskId,
        status,
      }).unwrap();

      toast.success(`Marked ${status.replace(/_/g, " ")}`);

      await refetch();
    } catch (error) {
      console.error("Failed to update Zoho task:", error);

      toast.error(
        error?.data?.message ||
          error?.data?.error ||
          error?.error ||
          "Update failed",
      );
    }
  };

  // ==========================================================
  // LABEL
  // ==========================================================

  const label =
    {
      mine: "My Tasks",
      all: "All Tasks",
      overdue: "Overdue Tasks",
      blocked: "Blocked Tasks",
      completed: "Completed Tasks",
    }[view] || "Tasks";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Shell
      label="Tasks"
      title={label}
      subtitle={`${filteredTasks.length} task${
        filteredTasks.length !== 1 ? "s" : ""
      }`}
      action={
        <div className="flex gap-2">
          <Btn
            onClick={() => refetch()}
            disabled={isFetching || !projectId}
            type="button"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </Btn>

          <Btn
            onClick={() => window.location.assign("/tasks/new")}
            data-testid="new-task-btn"
          >
            <Plus size={14} />
            Create Task
          </Btn>
        </div>
      }
    >
      <div className="grid gap-4">
        <ProjectSelector
          portals={portals}
          projects={projects}
          portalId={portalId}
          projectId={projectId}
          onPortalChange={(value) => {
            setPortalId(value);
            setProjectId("");
          }}
          onProjectChange={setProjectId}
        />

        {portalsLoading || projectsLoading || tasksLoading ? (
          <Card>
            <div className="text-center py-8 text-[#B5C4B6]">Loading…</div>
          </Card>
        ) : !portalId ? (
          <Card>
            <div className="text-center py-8 text-[#B5C4B6]">
              Select a portal.
            </div>
          </Card>
        ) : !projectId ? (
          <Card>
            <div className="text-center py-8 text-[#B5C4B6]">
              Select a project.
            </div>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-[#B5C4B6]">Nothing here.</div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTasks.map((task, index) => (
              <TaskCard
                key={getTaskId(task) || `task-${index}`}
                task={task}
                onStatus={changeStatus}
                updating={updating}
              />
            ))}
          </div>
        )}

        {isFetching && !tasksLoading && (
          <div className="text-center text-[11px] text-[#B5C4B6]">
            Refreshing tasks…
          </div>
        )}

        {updating && (
          <div className="text-center text-[11px] text-[#B5C4B6]">
            Updating task…
          </div>
        )}
      </div>
    </Shell>
  );
}

// ============================================================
// CREATE TASK
// ============================================================

export function TaskNew() {
  const [portalId, setPortalId] = useState("");
  const [projectId, setProjectId] = useState("");

  // ==========================================================
  // PORTALS
  // ==========================================================

  const { data: portalsResponse } = useGetZohoPortalsQuery();

  const portals = useMemo(() => getRecords(portalsResponse), [portalsResponse]);

  React.useEffect(() => {
    if (!portalId && portals.length > 0) {
      setPortalId(String(portals[0].id));
    }
  }, [portals, portalId]);

  // ==========================================================
  // PROJECTS
  // ==========================================================

  const { data: projectsResponse } = useGetZohoProjectsQuery(
    {
      portalId,
    },
    {
      skip: !portalId,
    },
  );

  const projects = useMemo(
    () => getRecords(projectsResponse),
    [projectsResponse],
  );

  React.useEffect(() => {
    if (!portalId) {
      setProjectId("");
      return;
    }

    if (
      projectId &&
      projects.some((project) => String(project.id) === String(projectId))
    ) {
      return;
    }

    if (projects.length > 0) {
      setProjectId(String(projects[0].id));
    }
  }, [portalId, projects, projectId]);

  // ==========================================================
  // CREATE
  // ==========================================================

  const [createZohoTask, { isLoading: busy }] = useCreateZohoTaskMutation();

  const [form, setForm] = useState({
    title: "",
    description: "",

    assignee_id: "",
    assignee_name: "",

    priority: "medium",
    status: "todo",

    due_date: "",

    recurring_interval: "",
  });

  // ==========================================================
  // FIELD UPDATE
  // ==========================================================

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const submit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) {
      toast.error("Task title is required");
      return;
    }

    if (!portalId) {
      toast.error("Please select a portal");
      return;
    }

    if (!projectId) {
      toast.error("Please select a project");
      return;
    }

    try {
      const payload = {
        portalId,
        projectId,

        title,
        priority: form.priority || "medium",
        status: form.status || "todo",
      };

      if (form.description.trim()) {
        payload.description = form.description.trim();
      }

      if (form.assignee_id.trim()) {
        payload.assignee_id = form.assignee_id.trim();
      }

      if (form.assignee_name.trim()) {
        payload.assignee_name = form.assignee_name.trim();
      }

      if (form.due_date) {
        payload.due_date = form.due_date;
      }

      if (form.recurring_interval) {
        payload.recurring = {
          interval: form.recurring_interval,
        };
      }

      await createZohoTask(payload).unwrap();

      toast.success("Task created");

      window.location.assign("/tasks/all");
    } catch (error) {
      console.error("Failed to create Zoho task:", error);

      toast.error(
        error?.data?.message ||
          error?.data?.error ||
          error?.error ||
          "Create failed",
      );
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Shell
      label="Tasks"
      title="Create Task"
      subtitle="Assign, prioritise, and track work"
    >
      <Card>
        <form onSubmit={submit} className="grid gap-4 max-w-3xl">
          {/* =================================================
              PORTAL / PROJECT
          ================================================= */}

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Portal
              </label>

              <select
                className="bc-input h-10 w-full"
                value={portalId}
                onChange={(event) => {
                  setPortalId(event.target.value);
                  setProjectId("");
                }}
              >
                <option value="">Select portal</option>

                {portals.map((portal) => (
                  <option key={portal.id} value={portal.id}>
                    {portal.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Project
              </label>

              <select
                className="bc-input h-10 w-full"
                value={projectId}
                disabled={!portalId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                <option value="">
                  {portalId ? "Select project" : "Select portal first"}
                </option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =================================================
              TITLE
          ================================================= */}

          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Title
            </label>

            <Input
              required
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Enter task title"
            />
          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Description
            </label>

            <TextArea
              rows={4}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Add task details..."
            />
          </div>

          {/* =================================================
              ASSIGNEE
          ================================================= */}

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Assignee ID / Email
              </label>

              <Input
                type="text"
                placeholder="Zoho user ID or email"
                value={form.assignee_id}
                onChange={(event) =>
                  updateField("assignee_id", event.target.value)
                }
              />
            </div>

            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Assignee name
              </label>

              <Input
                value={form.assignee_name}
                onChange={(event) =>
                  updateField("assignee_name", event.target.value)
                }
                placeholder="Assignee name"
              />
            </div>
          </div>

          {/* =================================================
              PRIORITY / STATUS
          ================================================= */}

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Priority
              </label>

              <select
                className="bc-input h-10 w-full"
                value={form.priority}
                onChange={(event) =>
                  updateField("priority", event.target.value)
                }
              >
                {["low", "medium", "high", "critical"].map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Status
              </label>

              <select
                className="bc-input h-10 w-full"
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* =================================================
              DUE / RECURRING
          ================================================= */}

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Due date
              </label>

              <Input
                type="date"
                value={form.due_date ? form.due_date.slice(0, 10) : ""}
                onChange={(event) => {
                  const value = event.target.value;

                  updateField(
                    "due_date",
                    value ? new Date(`${value}T23:59:00`).toISOString() : "",
                  );
                }}
              />
            </div>

            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Recurring
              </label>

              <select
                className="bc-input h-10 w-full"
                value={form.recurring_interval}
                onChange={(event) =>
                  updateField("recurring_interval", event.target.value)
                }
              >
                <option value="">Not recurring</option>

                {["daily", "weekly", "monthly"].map((interval) => (
                  <option key={interval} value={interval}>
                    {interval}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex gap-2 pt-2">
            <Btn type="submit" disabled={busy || !portalId || !projectId}>
              <Plus size={14} />

              {busy ? "Creating…" : "Create Task"}
            </Btn>

            <BtnGhost
              type="button"
              onClick={() => window.location.assign("/tasks/all")}
            >
              <ArrowLeft size={14} />
              Cancel
            </BtnGhost>
          </div>
        </form>
      </Card>
    </Shell>
  );
}
