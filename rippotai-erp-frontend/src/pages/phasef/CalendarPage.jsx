import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search, Plus, X } from "lucide-react";
import {
  useGetCalendarEventsQuery,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useDeleteCalendarEventMutation,
} from "../../api/calendar.api"; // adjust this import path to wherever calendar.api.js lives
import { useGetProjectsQuery } from "../../api/project.api"; // adjust this import path to wherever projects.api.js lives

const VIEWS = ["day", "week", "month", "year"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const EVENT_COLOR = {
  task: { bg: "#D6E7D6", text: "#1F5A38" },
  client_meeting: { bg: "transparent", border: "#1F453B", text: "#1F453B" },
  internal_meeting: { bg: "transparent", border: "#1F453B", text: "#1F453B" },
  vendor_call: { bg: "transparent", border: "#1F453B", text: "#1F453B" },
  presentation: { bg: "transparent", border: "#1F453B", text: "#1F453B" },
  note: { bg: "#EDE0F5", text: "#6E3EAA" },
  timeline: { bg: "#EFF2F9", text: "#1F453B" },
  milestone_due: { bg: "#EFF2F9", text: "#1F453B" },
  quotation_deadline: { bg: "#EFF2F9", text: "#1F453B" },
  site_visit: { bg: "transparent", border: "#1F453B", text: "#1F453B" },
  handover: { bg: "#EFF2F9", text: "#1F453B" },
  personal: { bg: "#EAEEF0", text: "#6B7B7C" },
};
const chip = (t) => EVENT_COLOR[t] || EVENT_COLOR.personal;
const fmtDT = (d) =>
  d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function EventPill({ ev, onClick }) {
  const c = chip(ev.type);
  const style = c.border
    ? { border: `1px solid ${c.border}`, color: c.text, background: "white" }
    : { background: c.bg, color: c.text };
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(ev);
      }}
      title={ev.title}
      style={style}
      className="w-full text-left truncate text-[10.5px] px-1.5 py-0.5 rounded font-medium mb-0.5 hover:opacity-80"
      data-testid={`calendar-event-${ev.id}`}
    >
      {ev.title}
    </button>
  );
}

function CreateEventModal({
  open,
  onClose,
  initialDate,
  projects,
  existingEvent,
}) {
  const isEdit = !!existingEvent;
  const [form, setForm] = useState({
    title: "",
    type: "internal_meeting",
    starts_at: "",
    ends_at: "",
    all_day: false,
    project_id: "",
    location: "",
    description: "",
    assignee: "",
  });

  const [createCalendarEvent, { isLoading: isCreating }] =
    useCreateCalendarEventMutation();
  const [updateCalendarEvent, { isLoading: isUpdating }] =
    useUpdateCalendarEventMutation();
  const [deleteCalendarEvent, { isLoading: isDeleting }] =
    useDeleteCalendarEventMutation();
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (existingEvent) {
      setForm({
        title: existingEvent.title || "",
        type: existingEvent.type || "internal_meeting",
        starts_at: (existingEvent.starts_at || "").slice(0, 16),
        ends_at: (existingEvent.ends_at || "").slice(0, 16),
        all_day: !!existingEvent.all_day,
        project_id: existingEvent.project_id || "",
        location: existingEvent.location || "",
        description: existingEvent.description || "",
        assignee: (existingEvent.attendees || [])[0] || "",
      });
    } else {
      const iso = initialDate ? new Date(initialDate) : new Date();
      const localIso = new Date(iso.getTime() - iso.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setForm((f) => ({
        ...f,
        starts_at: localIso,
        ends_at: localIso,
        title: "",
        description: "",
      }));
    }
  }, [open, initialDate, existingEvent]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error("Title required");
    const payload = {
      title: form.title,
      type: form.type,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at || form.starts_at).toISOString(),
      all_day: form.all_day,
      project_id: form.project_id || null,
      location: form.location,
      description: form.description,
      attendees: form.assignee ? [form.assignee] : [],
    };
    try {
      if (isEdit) {
        await updateCalendarEvent({
          id: existingEvent.id,
          body: payload,
        }).unwrap();
      } else {
        await createCalendarEvent(payload).unwrap();
      }
      toast.success(isEdit ? "Event updated" : "Event created");
      onClose();
    } catch {
      toast.error("Save failed");
    }
  };

  const del = async () => {
    if (!isEdit || !window.confirm(`Delete "${existingEvent.title}"?`)) return;
    try {
      await deleteCalendarEvent(existingEvent.id).unwrap();
      toast.success("Deleted");
      onClose();
    } catch {
      toast.error("Delete failed");
    }
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="calendar-event-modal"
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
            {isEdit ? "Edit Event" : "New Event"}
          </h2>
          <button onClick={onClose} className="p-1 text-[#6B7B7C]">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Title
            </label>
            <input
              required
              className="bc-input h-10 w-full"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              data-testid="event-title"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                Type
              </label>
              <select
                className="bc-input h-10 w-full"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="task">Task</option>
                <option value="client_meeting">Meeting</option>
                <option value="site_visit">Site Visit</option>
                <option value="vendor_call">Vendor Call</option>
                <option value="presentation">Presentation</option>
                <option value="milestone_due">Timeline / Milestone</option>
                <option value="note">Note</option>
                <option value="personal">Personal</option>
              </select>
            </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                Starts at
              </label>
              <input
                required
                type="datetime-local"
                className="bc-input h-10 w-full"
                value={form.starts_at}
                onChange={(e) =>
                  setForm({ ...form, starts_at: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
                Ends at
              </label>
              <input
                type="datetime-local"
                className="bc-input h-10 w-full"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-[#333333]">
            <input
              type="checkbox"
              checked={form.all_day}
              onChange={(e) => setForm({ ...form, all_day: e.target.checked })}
            />{" "}
            All day
          </label>
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Location
            </label>
            <input
              className="bc-input h-10 w-full"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Assignee (email)
            </label>
            <input
              className="bc-input h-10 w-full"
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between gap-2 mt-2">
            {isEdit && (
              <button
                type="button"
                onClick={del}
                disabled={isDeleting}
                className="h-10 px-3 rounded-lg border border-[#7A2E1A] text-[#7A2E1A] text-[13px] font-semibold disabled:opacity-50"
                data-testid="event-delete"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 px-4 rounded-lg text-white text-[13px] font-semibold ml-auto disabled:opacity-50"
              style={{ backgroundColor: "#1F453B" }}
              data-testid="event-save"
            >
              {isSaving ? "Saving…" : isEdit ? "Save" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const {
    data: events = [],
    isFetching,
    isError,
  } = useGetCalendarEventsQuery({ limit: 500 });

  const { data: projects = [], isError: isProjectsError } =
    useGetProjectsQuery();

  useEffect(() => {
    if (isError) toast.error("Failed to load events");
  }, [isError]);

  useEffect(() => {
    if (isProjectsError) toast.error("Failed to load projects");
  }, [isProjectsError]);

  const eventsByDay = useMemo(() => {
    const m = {};
    for (const e of events) {
      const key = (e.starts_at || "").slice(0, 10);
      (m[key] = m[key] || []).push(e);
    }
    return m;
  }, [events]);

  const openCreate = (date) => {
    setEditingEvent(null);
    setModalDate(date);
    setShowModal(true);
  };
  const openEdit = (ev) => {
    setEditingEvent(ev);
    setModalDate(null);
    setShowModal(true);
  };

  // Header title per view
  const headerTitle = useMemo(() => {
    const y = cursor.getFullYear();
    if (view === "year") return String(y);
    if (view === "month")
      return (
        <>
          <span style={{ fontFamily: "Poppins", fontWeight: 700 }}>
            {MONTHS[cursor.getMonth()]}
          </span>{" "}
          <span className="font-light">{y}</span>
        </>
      );
    if (view === "day")
      return cursor.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    // week
    const first = new Date(cursor);
    first.setDate(first.getDate() - first.getDay());
    const last = new Date(first);
    last.setDate(last.getDate() + 6);
    return `${first.toLocaleDateString("en-IN", { month: "short", day: "2-digit" })} – ${last.toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" })}`;
  }, [view, cursor]);

  const shift = (n) => {
    const d = new Date(cursor);
    if (view === "day") d.setDate(d.getDate() + n);
    if (view === "week") d.setDate(d.getDate() + 7 * n);
    if (view === "month") d.setMonth(d.getMonth() + n);
    if (view === "year") d.setFullYear(d.getFullYear() + n);
    setCursor(d);
  };
  const today = () => setCursor(new Date());

  return (
    <div>
      {/* Top bar */}
      <div
        className="flex items-center justify-between mb-5 gap-4 flex-wrap"
        data-testid="calendar-header"
      >
        <h1
          className="text-[26px] text-[#333333] min-w-0 truncate"
          data-testid="calendar-title"
        >
          {headerTitle}
        </h1>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div
            className="inline-flex rounded-lg bg-[#EAEEF0] p-0.5"
            data-testid="calendar-view-switcher"
          >
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3.5 h-8 rounded-md text-[12.5px] font-semibold capitalize transition-colors ${view === v ? "bg-[#1F453B] text-white" : "text-[#333333]"}`}
                data-testid={`calendar-view-${v}`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => shift(-1)}
              className="w-9 h-9 rounded-lg border border-[rgba(31,69,59,0.14)] bg-white text-[#333333]"
              data-testid="calendar-prev"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={today}
              className="h-9 px-3 rounded-lg border border-[rgba(31,69,59,0.14)] bg-white text-[#333333] text-[13px] font-semibold"
              data-testid="calendar-today"
            >
              Today
            </button>
            <button
              onClick={() => shift(1)}
              className="w-9 h-9 rounded-lg border border-[rgba(31,69,59,0.14)] bg-white text-[#333333]"
              data-testid="calendar-next"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <button
            className="w-9 h-9 rounded-lg border border-[rgba(31,69,59,0.14)] bg-white text-[#333333]"
            title="Search"
          >
            <Search size={15} />
          </button>
          <button
            onClick={() => openCreate(new Date())}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold"
            style={{ backgroundColor: "#1F453B" }}
            data-testid="calendar-add-event"
          >
            <Plus size={14} /> Add Event
          </button>
        </div>
      </div>

      {isFetching && !events.length && (
        <div className="text-[13px] text-[#6B7B7C] mb-3">Loading events…</div>
      )}

      {view === "month" && (
        <MonthView
          cursor={cursor}
          eventsByDay={eventsByDay}
          onDayClick={openCreate}
          onEventClick={openEdit}
        />
      )}
      {view === "week" && (
        <WeekView
          cursor={cursor}
          eventsByDay={eventsByDay}
          onDayClick={openCreate}
          onEventClick={openEdit}
        />
      )}
      {view === "day" && (
        <DayView
          cursor={cursor}
          eventsByDay={eventsByDay}
          onDayClick={openCreate}
          onEventClick={openEdit}
        />
      )}
      {view === "year" && (
        <YearView
          cursor={cursor}
          eventsByDay={eventsByDay}
          onMonthClick={(m) => {
            const d = new Date(cursor.getFullYear(), m, 1);
            setCursor(d);
            setView("month");
          }}
        />
      )}

      <CreateEventModal
        open={showModal}
        onClose={() => setShowModal(false)}
        initialDate={modalDate}
        projects={projects}
        existingEvent={editingEvent}
      />
    </div>
  );
}

function MonthView({ cursor, eventsByDay, onDayClick, onEventClick }) {
  const y = cursor.getFullYear(),
    m = cursor.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  const arr = [];
  for (let i = firstDay - 1; i >= 0; i--)
    arr.push({ date: new Date(y, m, -i), inMonth: false });
  for (let d = 1; d <= daysInMonth; d++)
    arr.push({ date: new Date(y, m, d), inMonth: true });
  while (arr.length % 7 !== 0)
    arr.push({
      date: new Date(
        y,
        m,
        daysInMonth + (arr.length - firstDay - daysInMonth + 1),
      ),
      inMonth: false,
    });

  return (
    <div
      className="bc-card p-0 overflow-hidden"
      data-testid="calendar-month-view"
    >
      <div className="grid grid-cols-7 border-b border-[rgba(31,69,59,0.10)] bg-[#F7F8F5]">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-[11px] font-bold uppercase tracking-widest text-[#6B7B7C] text-center py-2"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {arr.map((cell, i) => {
          const iso = cell.date.toISOString().slice(0, 10);
          const evs = eventsByDay[iso] || [];
          const isToday = cell.date.toDateString() === today.toDateString();
          return (
            <div
              key={i}
              onClick={() => onDayClick(cell.date)}
              className={`min-h-[110px] border-r border-b border-[rgba(31,69,59,0.06)] p-1.5 cursor-pointer hover:bg-[#F7F8F5] ${cell.inMonth ? "" : "bg-[#FAFAF8]"}`}
              data-testid={`month-cell-${iso}`}
            >
              <div className="flex items-center justify-end mb-1">
                {isToday ? (
                  <span className="w-6 h-6 rounded-full flex items-center justify-center bg-[#D9AF61] text-[#333333] text-[12px] font-bold">
                    {cell.date.getDate()}
                  </span>
                ) : (
                  <span
                    className={`text-[12px] font-semibold ${cell.inMonth ? "text-[#333333]" : "text-[#B5C4B6]"}`}
                  >
                    {cell.date.getDate()}
                  </span>
                )}
              </div>
              {evs.slice(0, 3).map((e) => (
                <EventPill key={e.id} ev={e} onClick={onEventClick} />
              ))}
              {evs.length > 3 && (
                <div className="text-[10px] text-[#6B7B7C] px-1 mt-0.5">
                  +{evs.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ cursor, eventsByDay, onDayClick, onEventClick }) {
  const first = new Date(cursor);
  first.setDate(first.getDate() - first.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(first);
    d.setDate(d.getDate() + i);
    return d;
  });
  const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7-21
  return (
    <div
      className="bc-card p-0 overflow-hidden"
      data-testid="calendar-week-view"
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
      >
        <div />
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className="py-2 text-center border-b border-[rgba(31,69,59,0.10)] bg-[#F7F8F5]"
          >
            <div className="text-[10px] uppercase font-bold text-[#6B7B7C]">
              {WEEKDAYS[d.getDay()]}
            </div>
            <div className="text-[15px] font-bold text-[#333333]">
              {d.getDate()}
            </div>
          </div>
        ))}
        {HOURS.map((h) => (
          <React.Fragment key={h}>
            <div className="text-[10px] text-[#6B7B7C] px-1 py-2 text-right border-b border-[rgba(31,69,59,0.06)]">
              {h}:00
            </div>
            {days.map((d) => {
              const iso = d.toISOString().slice(0, 10);
              const evs = (eventsByDay[iso] || []).filter((e) => {
                if (e.all_day) return h === 7;
                const eh = new Date(e.starts_at).getHours();
                return eh === h;
              });
              return (
                <div
                  key={d + "-" + h}
                  className="border-r border-b border-[rgba(31,69,59,0.06)] min-h-[44px] p-0.5 cursor-pointer hover:bg-[#F7F8F5]"
                  onClick={() => {
                    const dt = new Date(d);
                    dt.setHours(h, 0, 0, 0);
                    onDayClick(dt);
                  }}
                >
                  {evs.map((e) => (
                    <EventPill key={e.id} ev={e} onClick={onEventClick} />
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function DayView({ cursor, eventsByDay, onDayClick, onEventClick }) {
  const iso = cursor.toISOString().slice(0, 10);
  const evs = eventsByDay[iso] || [];
  const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);
  return (
    <div className="bc-card p-0" data-testid="calendar-day-view">
      <div className="grid" style={{ gridTemplateColumns: "64px 1fr" }}>
        {HOURS.map((h) => {
          const slot = evs.filter((e) => {
            if (e.all_day) return h === 7;
            const eh = new Date(e.starts_at).getHours();
            return eh === h;
          });
          return (
            <React.Fragment key={h}>
              <div className="text-[11px] text-[#6B7B7C] px-2 py-3 text-right border-b border-[rgba(31,69,59,0.06)]">
                {h}:00
              </div>
              <div
                className="border-b border-[rgba(31,69,59,0.06)] min-h-[52px] p-1.5 cursor-pointer hover:bg-[#F7F8F5]"
                onClick={() => {
                  const dt = new Date(cursor);
                  dt.setHours(h, 0, 0, 0);
                  onDayClick(dt);
                }}
              >
                {slot.map((e) => (
                  <EventPill key={e.id} ev={e} onClick={onEventClick} />
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function YearView({ cursor, eventsByDay, onMonthClick }) {
  const y = cursor.getFullYear();
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
      data-testid="calendar-year-view"
    >
      {MONTHS.map((mn, m) => {
        const firstDay = new Date(y, m, 1).getDay();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        return (
          <div
            key={m}
            className="bc-card p-3 cursor-pointer hover:shadow-md"
            onClick={() => onMonthClick(m)}
            data-testid={`year-month-${m}`}
          >
            <div className="text-[13px] font-bold text-[#333333] mb-1.5">
              {mn}
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[9px]">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-[#B5C4B6] font-semibold">
                  {d[0]}
                </div>
              ))}
              {cells.map((c, i) => {
                if (!c) return <div key={i} />;
                const iso = new Date(y, m, c).toISOString().slice(0, 10);
                const hasEv = (eventsByDay[iso] || []).length > 0;
                return (
                  <div
                    key={i}
                    className={`text-[9.5px] py-0.5 ${hasEv ? "text-[#333333] font-bold" : "text-[#6B7B7C]"}`}
                  >
                    {c}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
