import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
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
  useProjects,
} from "../../components/Shared";
import {
  useGetTasksQuery,
  useGetMyTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../../api/task.api";

const TaskCard = ({ t, onStatus }) => (
  <Card>
    <div className="flex items-start gap-2">
      <span
        className={`text-[10.5px] px-2 py-0.5 rounded-full font-semibold uppercase ${PRIORITY_COLOURS[t.priority] || PRIORITY_COLOURS.medium}`}
      >
        {t.priority}
      </span>
      <span
        className={`text-[10.5px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOURS[t.status] || STATUS_COLOURS.todo}`}
      >
        {t.status.replace(/_/g, " ")}
      </span>
    </div>
    <div className="text-[15px] font-semibold text-[#333333] mt-2">
      {t.title}
    </div>
    <div className="text-[12.5px] text-[#6B7B7C] mt-1">
      {t.project_name || "General"} · {t.assignee_name || "Unassigned"} · Due{" "}
      {fmtDate(t.due_date)}
    </div>
    {t.blocked_reason && (
      <div className="text-[12px] text-[#7A2E1A] mt-2">
        Blocked: {t.blocked_reason}
      </div>
    )}
    <div className="flex gap-2 mt-3 flex-wrap">
      {t.status !== "completed" && (
        <BtnGhost onClick={() => onStatus(t, "completed")}>
          <CheckCircle2 size={13} /> Complete
        </BtnGhost>
      )}
      {t.status === "todo" && (
        <BtnGhost onClick={() => onStatus(t, "in_progress")}>Start</BtnGhost>
      )}
      {t.status !== "blocked" && (
        <BtnGhost onClick={() => onStatus(t, "blocked")}>
          <XCircle size={13} /> Block
        </BtnGhost>
      )}
    </div>
  </Card>
);

export function TasksList({ view = "all" }) {
  // "mine" has its own endpoint; every other view pulls the full list
  // and filters client-side, since the tasksApi endpoints don't take
  // query params for due_before/status.
  const { data: allTasks = [], isLoading: isLoadingAll } = useGetTasksQuery(
    undefined,
    { skip: view === "mine" },
  );

  const { data: myTasks = [], isLoading: isLoadingMine } = useGetMyTasksQuery(
    undefined,
    { skip: view !== "mine" },
  );

  const [updateTask] = useUpdateTaskMutation();

  const isLoading = view === "mine" ? isLoadingMine : isLoadingAll;
  const source = view === "mine" ? myTasks : allTasks;

  const tasks = React.useMemo(() => {
    switch (view) {
      case "overdue": {
        const now = new Date();
        return source.filter(
          (t) =>
            t.due_date &&
            new Date(t.due_date) < now &&
            t.status !== "completed",
        );
      }
      case "blocked":
        return source.filter((t) => t.status === "blocked");
      case "completed":
        return source.filter((t) => t.status === "completed");
      default:
        return source;
    }
  }, [source, view]);

  const changeStatus = async (t, status) => {
    try {
      await updateTask({ id: t.id, status }).unwrap();
      toast.success(`Marked ${status.replace(/_/g, " ")}`);
    } catch {
      toast.error("Update failed");
    }
  };

  const label = {
    mine: "My Tasks",
    all: "All Tasks",
    overdue: "Overdue Tasks",
    blocked: "Blocked Tasks",
    completed: "Completed Tasks",
  }[view];

  return (
    <Shell
      label="Tasks"
      title={label}
      subtitle={`${tasks.length} task${tasks.length !== 1 ? "s" : ""}`}
      action={
        <Btn
          onClick={() => window.location.assign("/tasks/new")}
          data-testid="new-task-btn"
        >
          <Plus size={14} /> Create Task
        </Btn>
      }
    >
      {isLoading ? (
        <Card>
          <div className="text-center py-8 text-[#B5C4B6]">Loading…</div>
        </Card>
      ) : tasks.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-[#B5C4B6]">Nothing here.</div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((t) => (
            <TaskCard key={t.id} t={t} onStatus={changeStatus} />
          ))}
        </div>
      )}
    </Shell>
  );
}

export function TaskNew() {
  const projects = useProjects();
  const [createTask, { isLoading: busy }] = useCreateTaskMutation();
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignee_id: "",
    assignee_name: "",
    project_id: "",
    priority: "medium",
    status: "todo",
    due_date: "",
    workload_estimate_hours: 1,
    recurring_interval: "",
    requires_approval: false,
  });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        workload_estimate_hours: Number(form.workload_estimate_hours) || 0,
        project_id: form.project_id || null,
        recurring: form.recurring_interval
          ? { interval: form.recurring_interval }
          : null,
      };
      delete payload.recurring_interval;
      await createTask(payload).unwrap();
      toast.success("Task created");
      window.location.assign("/tasks/all");
    } catch {
      toast.error("Create failed");
    }
  };

  return (
    <Shell
      label="Tasks"
      title="Create Task"
      subtitle="Assign, prioritise, and track work"
    >
      <Card>
        <form onSubmit={submit} className="grid gap-3 max-w-2xl">
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Title
            </label>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Description
            </label>
            <TextArea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Assignee email
              </label>
              <Input
                placeholder="user@inos.com"
                value={form.assignee_id}
                onChange={(e) =>
                  setForm({ ...form, assignee_id: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Assignee name
              </label>
              <Input
                value={form.assignee_name}
                onChange={(e) =>
                  setForm({ ...form, assignee_name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Project
              </label>
              <select
                className="bc-input h-10 w-full"
                value={form.project_id}
                onChange={(e) =>
                  setForm({ ...form, project_id: e.target.value })
                }
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
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Priority
              </label>
              <select
                className="bc-input h-10 w-full"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {["low", "medium", "high", "critical"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Due date
              </label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    due_date: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  })
                }
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Estimate (hours)
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={form.workload_estimate_hours}
                onChange={(e) =>
                  setForm({ ...form, workload_estimate_hours: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Recurring
              </label>
              <select
                className="bc-input h-10 w-full"
                value={form.recurring_interval}
                onChange={(e) =>
                  setForm({ ...form, recurring_interval: e.target.value })
                }
              >
                <option value="">Not recurring</option>
                {["daily", "weekly", "monthly"].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-[13px] text-[#333333]">
                <input
                  type="checkbox"
                  checked={form.requires_approval}
                  onChange={(e) =>
                    setForm({ ...form, requires_approval: e.target.checked })
                  }
                />{" "}
                Requires approval on completion
              </label>
            </div>
          </div>
          <div>
            <Btn disabled={busy} type="submit">
              <Plus size={14} /> {busy ? "Creating…" : "Create Task"}
            </Btn>
          </div>
        </form>
      </Card>
    </Shell>
  );
}

export const TasksMine = () => <TasksList view="mine" />;
export const TasksAll = () => <TasksList view="all" />;
