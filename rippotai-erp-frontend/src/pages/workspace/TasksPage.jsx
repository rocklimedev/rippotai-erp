// Native INOS tasks: board by status (drag & drop) + list, with My tasks / All / Overdue / Blocked / Done views.
import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, LayoutGrid, List, CheckCircle2, Circle, CalendarClock, AlertTriangle, ListTodo, Ban, Clock } from "lucide-react";
import {
  Page, PageHeader, Card, Button, Toolbar, ToolbarSpacer, SearchInput, Segmented, SelectInput, Tabs,
  Pill, EmptyState, Avatar, Stats, StatTile,
} from "@/components/inos";
import { useGetWsTasksQuery, useGetWsMyTasksQuery, useUpdateWsTaskMutation } from "@/api/workspace/workspace.api";
import { TASK_STATUSES, TASK_PRIORITIES, statusMeta, priorityMeta, isOverdue } from "./taskMeta";
import { fmtDate, daysFromToday, useProjectsList, useUsersList, Loading, Meta } from "./shared";

const VIEW_TABS = [
  { value: "board", label: "Board", to: "/tasks" },
  { value: "mine", label: "My tasks", to: "/tasks/mine" },
  { value: "all", label: "All tasks", to: "/tasks/all" },
  { value: "overdue", label: "Overdue", to: "/tasks/overdue" },
  { value: "blocked", label: "Blocked", to: "/tasks/blocked" },
  { value: "completed", label: "Done", to: "/tasks/completed" },
];

function DueLabel({ task }) {
  if (!task.due_date) return <Meta>No due date</Meta>;
  const d = daysFromToday(task.due_date);
  const done = task.status === "completed";
  const text = d === 0 ? "Today" : d === 1 ? "Tomorrow" : d === -1 ? "Yesterday" : fmtDate(task.due_date, { day: "numeric", month: "short" });
  if (!done && d < 0) return <Pill tone="bad" size="sm">{text}</Pill>;
  if (!done && d <= 1) return <Pill tone="warn" size="sm">{text}</Pill>;
  return <Meta>{text}</Meta>;
}

function TaskCard({ task, onOpen, onDragStart }) {
  const p = priorityMeta(task.priority);
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onOpen(task)}
      data-testid="task-card"
      style={{
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 12,
        display: "grid", gap: 8, cursor: "pointer", boxShadow: "var(--shadow-xs)",
      }}
    >
      <div style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--text)", lineHeight: 1.35 }}>{task.title}</div>
      {task.project?.name && <Meta>{task.project.name}</Meta>}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <Pill tone={p.tone} size="sm">{p.label}</Pill>
        <DueLabel task={task} />
        <span style={{ marginLeft: "auto" }} title={task.assignee?.name || "Unassigned"}>
          {task.assignee ? <Avatar name={task.assignee.name} size={24} /> : <Meta>—</Meta>}
        </span>
      </div>
    </div>
  );
}

function Board({ tasks, onOpen, onMove }) {
  const [over, setOver] = useState(null);
  const onDragStart = (e, t) => {
    e.dataTransfer.setData("text/task", t.id);
    e.dataTransfer.effectAllowed = "move";
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(220px, 1fr))", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
      {TASK_STATUSES.map((s) => {
        const col = tasks.filter((t) => t.status === s.value);
        return (
          <div
            key={s.value}
            data-testid={`board-col-${s.value}`}
            onDragOver={(e) => { e.preventDefault(); setOver(s.value); }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/task");
              const t = tasks.find((x) => x.id === id);
              if (t && t.status !== s.value) onMove(t, s.value);
            }}
            style={{
              background: over === s.value ? "var(--brand-50)" : "var(--surface-2)", border: "1px solid var(--line)",
              borderRadius: "var(--r-lg)", padding: 10, minHeight: 320, display: "flex", flexDirection: "column", gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px 6px" }}>
              <Pill tone={s.tone}>{s.label}</Pill>
              <Meta>{col.length}</Meta>
            </div>
            {col.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpen} onDragStart={onDragStart} />)}
            {!col.length && <div style={{ padding: "18px 8px", textAlign: "center", fontSize: 12.5, color: "var(--text-3)", border: "1px dashed var(--line-strong)", borderRadius: "var(--r-md)" }}>Drop tasks here</div>}
          </div>
        );
      })}
    </div>
  );
}

function TaskTable({ tasks, onOpen, onToggle }) {
  return (
    <div className="inos-table-wrap">
      <table className="inos-table">
        <thead>
          <tr>
            <th style={{ width: 44 }} />
            <th>Task</th>
            <th>Assignee</th>
            <th>Priority</th>
            <th>Due</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const done = t.status === "completed";
            const p = priorityMeta(t.priority);
            const s = statusMeta(t.status);
            return (
              <tr key={t.id} className="is-clickable" onClick={() => onOpen(t)} data-testid="task-row">
                <td onClick={(e) => { e.stopPropagation(); onToggle(t); }} title={done ? "Mark as not done" : "Mark as done"}>
                  {done ? <CheckCircle2 size={18} color="var(--ok-dot)" /> : <Circle size={18} color="var(--line-strong)" />}
                </td>
                <td>
                  <div style={{ fontWeight: 600, textDecoration: done ? "line-through" : "none", color: done ? "var(--text-3)" : "var(--text)" }}>{t.title}</div>
                  <Meta>{t.project?.name || "No project"}</Meta>
                </td>
                <td>
                  {t.assignee ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={t.assignee.name} size={24} /> {t.assignee.name}
                    </span>
                  ) : (
                    <Meta>Unassigned</Meta>
                  )}
                </td>
                <td><Pill tone={p.tone} size="sm">{p.label}</Pill></td>
                <td><DueLabel task={t} /></td>
                <td><Pill tone={s.tone} size="sm">{s.label}</Pill></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TasksPage({ view = "board" }) {
  const navigate = useNavigate();
  const mine = view === "mine";
  const allQ = useGetWsTasksQuery({}, { skip: mine });
  const mineQ = useGetWsMyTasksQuery(undefined, { skip: !mine });
  const { data, isLoading, isError, refetch } = mine ? mineQ : allQ;
  const [updateTask] = useUpdateWsTaskMutation();
  const { projects } = useProjectsList();
  const { users } = useUsersList();

  const [q, setQ] = useState("");
  // ?project=<id or slug> (e.g. from the Command Center) pre-filters the list and stays in the URL
  const [params, setParams] = useSearchParams();
  const projectParam = params.get("project") || params.get("project_id") || "";
  const project = useMemo(() => {
    if (!projectParam) return "";
    const hit = projects.find((p) => p.id === projectParam || p.slug === projectParam);
    return hit ? hit.id : projectParam;
  }, [projectParam, projects]);
  const setProject = (v) => {
    const next = new URLSearchParams(params);
    next.delete("project_id");
    if (v) next.set("project", v);
    else next.delete("project");
    setParams(next, { replace: true });
  };
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("");
  const [layout, setLayout] = useState(view === "board" ? "board" : "list");

  const all = Array.isArray(data) ? data : [];
  const tasks = useMemo(() => {
    let r = all;
    if (view === "overdue") r = r.filter(isOverdue);
    if (view === "blocked") r = r.filter((t) => t.status === "blocked");
    if (view === "completed") r = r.filter((t) => t.status === "completed");
    if (project) r = r.filter((t) => t.project_id === project);
    if (assignee) r = r.filter((t) => (assignee === "none" ? !t.assigned_to : t.assigned_to === assignee));
    if (priority) r = r.filter((t) => t.priority === priority);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      r = r.filter((t) => [t.title, t.description, t.project?.name, t.assignee?.name].some((x) => String(x || "").toLowerCase().includes(s)));
    }
    const rank = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...r].sort((a, b) =>
      (a.status === "completed") - (b.status === "completed") ||
      (a.due_date ? new Date(a.due_date) : Infinity) - (b.due_date ? new Date(b.due_date) : Infinity) ||
      rank[a.priority] - rank[b.priority]);
  }, [all, view, project, assignee, priority, q]);

  const stats = useMemo(() => {
    const all_ = project ? all.filter((t) => t.project_id === project) : all;
    const open = all_.filter((t) => t.status !== "completed");
    const weekAgo = Date.now() - 7 * 86400000;
    return {
      open: open.length,
      today: open.filter((t) => t.due_date && daysFromToday(t.due_date) === 0).length,
      overdue: all_.filter(isOverdue).length,
      blocked: all_.filter((t) => t.status === "blocked").length,
      done7: all_.filter((t) => t.status === "completed" && new Date(t.updated_at).getTime() > weekAgo).length,
    };
  }, [all, project]);

  const move = async (t, status) => {
    try {
      await updateTask({ id: t.id, status }).unwrap();
      toast.success(`Moved to ${statusMeta(status).label}`);
    } catch (e) {
      toast.error(e?.data?.message || "Couldn't move task");
    }
  };
  const toggle = (t) => move(t, t.status === "completed" ? "todo" : "completed");
  const open = (t) => navigate(`/tasks/${t.id}`);
  const filtersOn = q || project || assignee || priority;

  const titles = { board: "Tasks", mine: "My tasks", all: "All tasks", overdue: "Overdue tasks", blocked: "Blocked tasks", completed: "Completed tasks" };

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Tasks", to: "/tasks" }, ...(view !== "board" ? [{ label: titles[view] }] : [])]}
        title={titles[view]}
        subtitle={mine ? "Tasks you created or that are assigned to you." : "Plan, assign and track work across every project."}
        actions={<Button variant="primary" icon={Plus} onClick={() => navigate("/tasks/new")} data-testid="new-task">New task</Button>}
      />

      <Stats>
        <StatTile label="Open" value={stats.open} icon={<ListTodo size={16} />} onClick={() => navigate(mine ? "/tasks/mine" : "/tasks/all")} />
        <StatTile label="Due today" value={stats.today} icon={<Clock size={16} />} tone="warn" />
        <StatTile label="Overdue" value={stats.overdue} icon={<AlertTriangle size={16} />} tone="bad" onClick={() => navigate("/tasks/overdue")} active={view === "overdue"} />
        <StatTile label="Blocked" value={stats.blocked} icon={<Ban size={16} />} tone="peach" onClick={() => navigate("/tasks/blocked")} active={view === "blocked"} />
        <StatTile label="Done this week" value={stats.done7} icon={<CheckCircle2 size={16} />} tone="ok" onClick={() => navigate("/tasks/completed")} active={view === "completed"} />
      </Stats>

      <Tabs value={view} onChange={(v) => navigate(VIEW_TABS.find((t) => t.value === v).to)} options={VIEW_TABS.map((t) => ({ value: t.value, label: t.label }))} />

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Search tasks" />
        <SelectInput value={project} onChange={(e) => setProject(e.target.value)} style={{ width: 200 }} aria-label="Project">
          <option value="">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectInput>
        {!mine && (
          <SelectInput value={assignee} onChange={(e) => setAssignee(e.target.value)} style={{ width: 180 }} aria-label="Assignee">
            <option value="">Anyone</option>
            <option value="none">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </SelectInput>
        )}
        <SelectInput value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: 150 }} aria-label="Priority">
          <option value="">Any priority</option>
          {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </SelectInput>
        {filtersOn && <Button variant="ghost" size="sm" onClick={() => { setQ(""); setProject(""); setAssignee(""); setPriority(""); }}>Clear</Button>}
        <ToolbarSpacer />
        <Segmented value={layout} onChange={setLayout} options={[{ value: "board", label: "Board", icon: LayoutGrid }, { value: "list", label: "List", icon: List }]} />
      </Toolbar>

      {isLoading ? (
        <Card><Loading /></Card>
      ) : isError ? (
        <Card><EmptyState icon={ListTodo} title="Couldn't load tasks" action={<Button onClick={refetch}>Retry</Button>} /></Card>
      ) : !tasks.length ? (
        <Card>
          <EmptyState
            icon={filtersOn ? ListTodo : CalendarClock}
            title={filtersOn ? "No tasks match these filters" : view === "overdue" ? "Nothing overdue" : view === "blocked" ? "Nothing is blocked" : "No tasks yet"}
            text={filtersOn ? "Clear a filter to see more." : "Create a task, give it a due date and assign it to someone on the team."}
            action={!filtersOn && <Button variant="primary" icon={Plus} onClick={() => navigate("/tasks/new")}>New task</Button>}
          />
        </Card>
      ) : layout === "board" ? (
        <Board tasks={tasks} onOpen={open} onMove={move} />
      ) : (
        <Card flush title={`${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`}>
          <TaskTable tasks={tasks} onOpen={open} onToggle={toggle} />
        </Card>
      )}
    </Page>
  );
}
