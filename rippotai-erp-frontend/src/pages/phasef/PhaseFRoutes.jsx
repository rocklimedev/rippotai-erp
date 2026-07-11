/* Phase F frontend — Calendar / Notes / Tasks apps
Small, functional, INOS-themed pages. Reuses common Shell + Card idioms.
Every header slug exports a page component consumed by App.js. */
import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Plus,
  Pin,
  PinOff,
  Calendar as CalIcon,
  Clock,
  User,
  Flag,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

const Shell = ({ label, title, subtitle, action, children }) => (
  <div className="space-y-5 min-w-0">
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5 font-semibold">
          {label}
        </div>
        <h1
          title={title}
          className="text-[34px] font-bold text-[#333333] truncate"
          style={{ fontFamily: "Poppins" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            title={subtitle}
            className="text-[14px] text-[#6B7B7C] mt-1 line-clamp-2"
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
    {children}
  </div>
);
const Card = ({ children, className = "" }) => (
  <div className={`bc-card p-5 ${className}`}>{children}</div>
);
const Input = (p) => (
  <input {...p} className={`bc-input h-10 w-full ${p.className || ""}`} />
);
const TextArea = (p) => (
  <textarea
    {...p}
    className={`bc-input w-full text-[14px] ${p.className || ""}`}
  />
);
const Btn = ({ children, ...p }) => (
  <button
    {...p}
    className={`h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60 ${p.className || ""}`}
  >
    {children}
  </button>
);
const BtnGhost = ({ children, ...p }) => (
  <button
    {...p}
    className={`h-9 px-3 rounded-lg border border-[rgba(31,69,59,0.14)] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 ${p.className || ""}`}
  >
    {children}
  </button>
);

const PRIORITY_COLOURS = {
  low: "bg-[#EAEEF0] text-[#6B7B7C]",
  medium: "bg-[#EFF2F9] text-[#333333]",
  high: "bg-[#D9AF61] text-[#333333]",
  critical: "bg-[#F1D9D3] text-[#7A2E1A]",
};
const STATUS_COLOURS = {
  todo: "bg-[#EAEEF0] text-[#6B7B7C]",
  in_progress: "bg-[#D8E0DA] text-[#333333]",
  blocked: "bg-[#F1D9D3] text-[#7A2E1A]",
  awaiting_approval: "bg-[#EDE0F5] text-[#6E3EAA]",
  completed: "bg-[#D3E7D3] text-[#2A6B45]",
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
};
const fmtDT = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

/* ============================ CALENDAR ============================ */
function useProjects() {
  const [projects, setP] = useState([]);
  useEffect(() => {
    api
      .get("/projects")
      .then((r) => setP(r.data || []))
      .catch(() => {});
  }, []);
  return projects;
}

export function CalendarMine() {
  const [events, setE] = useState([]);
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    api
      .get("/calendar/events?my=true")
      .then((r) => {
        setE(r.data);
        setBusy(false);
      })
      .catch(() => setBusy(false));
  }, []);
  return (
    <Shell
      label="Calendar"
      title="My Calendar"
      subtitle={`${events.length} event${events.length !== 1 ? "s" : ""} where you are an attendee`}
      action={
        <Btn onClick={() => window.location.assign("/calendar/team")}>
          <Plus size={14} /> New Event
        </Btn>
      }
    >
      <Card>
        {busy ? (
          <div className="text-[#6B7B7C] text-[13px]">
            <Loader2 size={14} className="inline animate-spin mr-2" />
            Loading…
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 text-[#B5C4B6]">
            No events yet. Create your first calendar entry.
          </div>
        ) : (
          <ul className="divide-y divide-[rgba(31,69,59,0.08)]">
            {events.map((e) => (
              <li key={e.id} className="py-3 flex gap-3">
                <div className="w-16 text-center">
                  <div className="text-[11px] uppercase text-[#B5C4B6]">
                    {new Date(e.starts_at).toLocaleDateString("en-IN", {
                      month: "short",
                    })}
                  </div>
                  <div className="text-[36px] font-bold text-[#333333] leading-tight">
                    {new Date(e.starts_at).getDate()}
                  </div>
                  <div className="text-[11px] text-[#6B7B7C]">
                    {fmtDT(e.starts_at).split(",")[1]?.trim()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14.5px] font-semibold text-[#333333] truncate">
                    {e.title}
                  </div>
                  <div className="text-[12.5px] text-[#6B7B7C]">
                    {e.type.replace(/_/g, " ")} · {e.project_name || "General"}{" "}
                    · {e.location || "—"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Shell>
  );
}

export function CalendarTeam() {
  const projects = useProjects();
  const [events, setEvents] = useState([]);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [form, setForm] = useState({
    title: "",
    type: "client_meeting",
    starts_at: "",
    ends_at: "",
    project_id: "",
    location: "",
  });
  const [showForm, setShowForm] = useState(false);
  const load = () =>
    api
      .get("/calendar/events?limit=300")
      .then((r) => setEvents(r.data))
      .catch(() => {});
  useEffect(() => {
    load();
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.starts_at)
      return toast.error("Title + start required");
    try {
      await api.post("/calendar/events", {
        ...form,
        ends_at: form.ends_at || form.starts_at,
      });
      toast.success("Event created");
      setForm({
        title: "",
        type: "client_meeting",
        starts_at: "",
        ends_at: "",
        project_id: "",
        location: "",
      });
      setShowForm(false);
      load();
    } catch {
      toast.error("Create failed");
    }
  };
  // Simple month grid: days of current month
  const monthGrid = useMemo(() => {
    const y = monthDate.getFullYear(),
      m = monthDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(y, m, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [monthDate]);
  const evByDay = useMemo(() => {
    const m = {};
    for (const e of events) {
      const k = (e.starts_at || "").slice(0, 10);
      (m[k] = m[k] || []).push(e);
    }
    return m;
  }, [events]);
  const monthLabel = monthDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  return (
    <Shell
      label="Calendar"
      title="Team Calendar"
      subtitle="Everything the studio is planning this month"
      action={
        <Btn onClick={() => setShowForm((s) => !s)} data-testid="new-event-btn">
          <Plus size={14} /> {showForm ? "Close" : "New Event"}
        </Btn>
      }
    >
      {showForm && (
        <Card>
          <form onSubmit={submit} className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
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
                Type
              </label>
              <select
                className="bc-input h-10 w-full"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {[
                  "client_meeting",
                  "site_visit",
                  "vendor_call",
                  "internal_meeting",
                  "presentation",
                  "milestone_due",
                  "quotation_deadline",
                  "handover",
                  "personal",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
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
                Starts at
              </label>
              <Input
                required
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) =>
                  setForm({ ...form, starts_at: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Ends at
              </label>
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Location
              </label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Btn type="submit">
                <Plus size={14} /> Create Event
              </Btn>
            </div>
          </form>
        </Card>
      )}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <BtnGhost
            onClick={() =>
              setMonthDate(
                (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
              )
            }
          >
            ← Prev
          </BtnGhost>
          <div className="text-[15px] font-semibold text-[#333333]">
            {monthLabel}
          </div>
          <BtnGhost
            onClick={() =>
              setMonthDate(
                (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
              )
            }
          >
            Next →
          </BtnGhost>
        </div>
        <div className="grid grid-cols-7 gap-px bg-[rgba(31,69,59,0.08)] text-[12px]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="bg-[#F4F6F7] py-2 text-center font-semibold text-[#6B7B7C]"
            >
              {d}
            </div>
          ))}
          {monthGrid.map((d, i) => {
            const iso = d ? d.toISOString().slice(0, 10) : null;
            const evs = iso ? evByDay[iso] || [] : [];
            return (
              <div key={i} className="bg-white min-h-[74px] p-1.5 text-[11px]">
                {d && (
                  <div className="font-semibold text-[#333333] text-[12px]">
                    {d.getDate()}
                  </div>
                )}
                {evs.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className="mt-0.5 truncate rounded-sm bg-[#EAEEF0] text-[#333333] px-1 py-0.5"
                    title={e.title}
                  >
                    {e.title}
                  </div>
                ))}
                {evs.length > 3 && (
                  <div className="text-[10px] text-[#6B7B7C] mt-0.5">
                    +{evs.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </Shell>
  );
}

/* ============================ NOTES ============================ */
export function NotesAll() {
  const projects = useProjects();
  const [notes, setNotes] = useState([]);
  const [q, setQ] = useState("");
  const [pinned, setPinned] = useState(false);
  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (pinned) params.set("pinned", "true");
    api
      .get(`/notes?${params}`)
      .then((r) => setNotes(r.data))
      .catch(() => {});
  };
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [q, pinned]);
  const togglePin = async (id) => {
    try {
      await api.post(`/notes/${id}/pin`);
      load();
    } catch {
      toast.error("Failed");
    }
  };
  return (
    <Shell
      label="Notes"
      title="All Notes"
      subtitle={`${notes.length} note${notes.length !== 1 ? "s" : ""} in the workspace`}
      action={
        <Btn
          onClick={() => window.location.assign("/notes/new")}
          data-testid="new-note-btn"
        >
          <Plus size={14} /> Create Note
        </Btn>
      }
    >
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search title or body…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <BtnGhost onClick={() => setPinned((p) => !p)}>
          {pinned ? "All notes" : "Pinned only"}
        </BtnGhost>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {notes.map((n) => (
          <Card key={n.id}>
            <div className="flex items-start gap-3">
              <button
                onClick={() => togglePin(n.id)}
                className={`p-1 rounded ${n.pinned ? "text-[#D9AF61]" : "text-[#B5C4B6]"} hover:text-[#D9AF61]`}
                title={n.pinned ? "Unpin" : "Pin"}
              >
                {n.pinned ? <Pin size={14} /> : <PinOff size={14} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-[#333333]">
                  {n.title}
                </div>
                <div className="text-[12px] text-[#6B7B7C] mt-0.5">
                  {n.kind} · {n.project_name || "General"} · {n.author}
                </div>
                <div className="text-[13px] text-[#3A4A46] mt-2 line-clamp-3 whitespace-pre-wrap">
                  {n.body || <span className="text-[#B5C4B6]">Empty note</span>}
                </div>
                <div className="text-[11px] text-[#B5C4B6] mt-2">
                  {fmtDate(n.updated_at)} · {(n.tags || []).join(", ")}
                </div>
              </div>
            </div>
          </Card>
        ))}
        {notes.length === 0 && (
          <Card className="md:col-span-2">
            <div className="text-center py-8 text-[#B5C4B6]">No notes yet.</div>
          </Card>
        )}
      </div>
    </Shell>
  );
}

export function NoteNew() {
  const projects = useProjects();
  const [form, setForm] = useState({
    title: "",
    body: "",
    tags: "",
    kind: "personal",
    project_id: "",
    pinned: false,
  });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/notes", {
        title: form.title,
        body: form.body,
        tags: form.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        kind: form.kind,
        project_id: form.project_id || null,
        pinned: form.pinned,
      });
      toast.success("Note created");
      window.location.assign("/notes/all");
    } catch {
      toast.error("Create failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell
      label="Notes"
      title="Create Note"
      subtitle="Journal a decision, meeting minutes, or a site observation"
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
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                Kind
              </label>
              <select
                className="bc-input h-10 w-full"
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                {[
                  "personal",
                  "project",
                  "site",
                  "meeting",
                  "design_decision",
                ].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
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
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Tags (comma separated)
            </label>
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Body (Markdown supported)
            </label>
            <TextArea
              rows={10}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-[#333333]">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
            />{" "}
            Pin this note
          </label>
          <div>
            <Btn disabled={busy} type="submit">
              <Plus size={14} /> {busy ? "Creating…" : "Create Note"}
            </Btn>
          </div>
        </form>
      </Card>
    </Shell>
  );
}

/* ============================ TASKS ============================ */
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
  const [tasks, setTasks] = useState([]);
  const load = () => {
    const params = new URLSearchParams();
    if (view === "mine") params.set("my", "true");
    if (view === "overdue") params.set("due_before", new Date().toISOString());
    if (view === "blocked") params.set("status", "blocked");
    if (view === "completed") params.set("status", "completed");
    api
      .get(`/tasks?${params}`)
      .then((r) => setTasks(r.data))
      .catch(() => {});
  };
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [view]);
  const changeStatus = async (t, status) => {
    try {
      await api.patch(`/tasks/${t.id}`, { status });
      toast.success(`Marked ${status.replace(/_/g, " ")}`);
      load();
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
      {tasks.length === 0 ? (
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
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
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
      await api.post("/tasks", payload);
      toast.success("Task created");
      window.location.assign("/tasks/all");
    } catch {
      toast.error("Create failed");
    } finally {
      setBusy(false);
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
