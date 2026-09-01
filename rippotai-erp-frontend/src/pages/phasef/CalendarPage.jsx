import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  X,
  CalendarDays,
  Clock3,
  MapPin,
  FolderKanban,
  UserRound,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";

import {
  useGetCalendarEventsQuery,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useDeleteCalendarEventMutation,
} from "../../api/calendar.api";

import { useGetProjectsQuery } from "../../api/project.api";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

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

const EVENT_TYPES = [
  {
    value: "task",
    label: "Task",
    bg: "#D6E7D6",
    text: "#1F5A38",
    dot: "#3E8A58",
  },
  {
    value: "client_meeting",
    label: "Client Meeting",
    bg: "#E8F1ED",
    text: "#1F453B",
    dot: "#1F453B",
  },
  {
    value: "internal_meeting",
    label: "Internal Meeting",
    bg: "#EEF2F0",
    text: "#31564C",
    dot: "#31564C",
  },
  {
    value: "vendor_call",
    label: "Vendor Call",
    bg: "#F1ECF7",
    text: "#6E3EAA",
    dot: "#8052B5",
  },
  {
    value: "presentation",
    label: "Presentation",
    bg: "#F8EAF0",
    text: "#9A4666",
    dot: "#B35A7B",
  },
  {
    value: "site_visit",
    label: "Site Visit",
    bg: "#FFF3DA",
    text: "#87601A",
    dot: "#D19A28",
  },
  {
    value: "milestone_due",
    label: "Milestone",
    bg: "#EAF0F9",
    text: "#365B8A",
    dot: "#537DB5",
  },
  {
    value: "quotation_deadline",
    label: "Deadline",
    bg: "#FCECEC",
    text: "#9A3D3D",
    dot: "#C65A5A",
  },
  {
    value: "note",
    label: "Note",
    bg: "#EDE0F5",
    text: "#6E3EAA",
    dot: "#8A55B7",
  },
  {
    value: "handover",
    label: "Handover",
    bg: "#E7F2F4",
    text: "#29626C",
    dot: "#3B8794",
  },
  {
    value: "personal",
    label: "Personal",
    bg: "#EAEEF0",
    text: "#6B7B7C",
    dot: "#7E8B8D",
  },
];

const getEventType = (type) =>
  EVENT_TYPES.find((item) => item.value === type) ||
  EVENT_TYPES[EVENT_TYPES.length - 1];

const getDateKey = (date) => {
  const d = new Date(date);

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toLocalInputValue = (date) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();

  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
};

/* -------------------------------------------------------------------------- */
/* Event Pill                                                                 */
/* -------------------------------------------------------------------------- */

function EventPill({ ev, onClick, compact = false }) {
  const type = getEventType(ev.type);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(ev);
      }}
      title={`${ev.title}${ev.starts_at ? ` • ${formatTime(ev.starts_at)}` : ""}`}
      className="group w-full text-left mb-1 rounded-md px-2 py-1 transition-all hover:shadow-sm hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[#1F453B]/20"
      style={{
        backgroundColor: type.bg,
        color: type.text,
      }}
      data-testid={`calendar-event-${ev.id}`}
    >
      <div className="flex items-start gap-1.5 min-w-0">
        <span
          className="w-1.5 h-1.5 rounded-full mt-[5px] shrink-0"
          style={{ backgroundColor: type.dot }}
        />

        <div className="min-w-0 flex-1">
          {!compact && !ev.all_day && ev.starts_at && (
            <div
              className="text-[9px] font-semibold opacity-70 truncate"
              style={{ color: type.text }}
            >
              {formatTime(ev.starts_at)}
            </div>
          )}

          <div className="text-[10px] font-semibold truncate">{ev.title}</div>
        </div>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

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
        starts_at: existingEvent.starts_at
          ? toLocalInputValue(existingEvent.starts_at)
          : "",
        ends_at: existingEvent.ends_at
          ? toLocalInputValue(existingEvent.ends_at)
          : "",
        all_day: !!existingEvent.all_day,
        project_id: existingEvent.project_id || "",
        location: existingEvent.location || "",
        description: existingEvent.description || "",
        assignee: (existingEvent.attendees || [])[0] || "",
      });
    } else {
      const date = initialDate ? new Date(initialDate) : new Date();

      setForm({
        title: "",
        type: "internal_meeting",
        starts_at: toLocalInputValue(date),
        ends_at: toLocalInputValue(new Date(date.getTime() + 60 * 60 * 1000)),
        all_day: false,
        project_id: "",
        location: "",
        description: "",
        assignee: "",
      });
    }
  }, [open, initialDate, existingEvent]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    if (!form.starts_at) {
      toast.error("Start date and time are required");
      return;
    }

    if (form.ends_at && new Date(form.ends_at) < new Date(form.starts_at)) {
      toast.error("End time cannot be before start time");
      return;
    }

    const payload = {
      title: form.title.trim(),
      type: form.type,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at || form.starts_at).toISOString(),
      all_day: form.all_day,
      project_id: form.project_id || null,
      location: form.location.trim(),
      description: form.description.trim(),
      attendees: form.assignee ? [form.assignee.trim()] : [],
    };

    try {
      if (isEdit) {
        await updateCalendarEvent({
          id: existingEvent.id,
          body: payload,
        }).unwrap();

        toast.success("Event updated successfully");
      } else {
        await createCalendarEvent(payload).unwrap();

        toast.success("Event created successfully");
      }

      onClose();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          (isEdit ? "Failed to update event" : "Failed to create event"),
      );
    }
  };

  const del = async () => {
    if (!isEdit) return;

    const confirmed = window.confirm(
      `Delete "${existingEvent.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteCalendarEvent(existingEvent.id).unwrap();

      toast.success("Event deleted");
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete event");
    }
  };

  if (!open) return null;

  const selectedType = getEventType(form.type);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#10201B]/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="calendar-event-modal"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#E8ECEA] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: selectedType.bg,
                    color: selectedType.text,
                  }}
                >
                  <CalendarDays size={17} />
                </div>

                <div>
                  <h2
                    className="text-[16px] font-bold text-[#333333]"
                    style={{ fontFamily: "Poppins" }}
                  >
                    {isEdit ? "Edit Event" : "Create Event"}
                  </h2>

                  <p className="text-[11px] text-[#8A9697] mt-0.5">
                    {isEdit
                      ? "Update the details of this calendar event."
                      : "Add an event to the team calendar."}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A8586] hover:bg-[#F3F5F4] transition-colors"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-5 space-y-5">
          {/* Basic details */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-[#8A9697] mb-3">
              Event Details
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-semibold text-[#333333] mb-1.5 block">
                  Event Title
                </label>

                <input
                  required
                  autoFocus
                  placeholder="e.g. Client presentation — Villa Project"
                  className="bc-input h-10 w-full"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  data-testid="event-title"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#333333] mb-1.5 block">
                    Event Type
                  </label>

                  <select
                    className="bc-input h-10 w-full"
                    value={form.type}
                    onChange={(e) => updateField("type", e.target.value)}
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#333333] mb-1.5 block">
                    Project
                  </label>

                  <select
                    className="bc-input h-10 w-full"
                    value={form.project_id}
                    onChange={(e) => updateField("project_id", e.target.value)}
                  >
                    <option value="">General / No Project</option>

                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-[#8A9697] mb-3">
              Schedule
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-[#333333] mb-1.5 block">
                  Starts At
                </label>

                <input
                  required
                  type="datetime-local"
                  className="bc-input h-10 w-full"
                  value={form.starts_at}
                  onChange={(e) => updateField("starts_at", e.target.value)}
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#333333] mb-1.5 block">
                  Ends At
                </label>

                <input
                  type="datetime-local"
                  className="bc-input h-10 w-full"
                  value={form.ends_at}
                  onChange={(e) => updateField("ends_at", e.target.value)}
                  disabled={form.all_day}
                />
              </div>
            </div>

            <label className="mt-3 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.all_day}
                onChange={(e) => updateField("all_day", e.target.checked)}
                className="w-4 h-4 accent-[#1F453B]"
              />

              <span className="text-[12px] font-medium text-[#4D5A5B]">
                All day event
              </span>
            </label>
          </div>

          {/* Additional */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-[#8A9697] mb-3">
              Additional Information
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-semibold text-[#333333] mb-1.5 block">
                  Location
                </label>

                <div className="relative">
                  <MapPin
                    size={14}
                    className="absolute left-3 top-3 text-[#8A9697]"
                  />

                  <input
                    className="bc-input h-10 w-full pl-9"
                    placeholder="Office, project site, client office…"
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#333333] mb-1.5 block">
                  Assignee / Attendee
                </label>

                <div className="relative">
                  <UserRound
                    size={14}
                    className="absolute left-3 top-3 text-[#8A9697]"
                  />

                  <input
                    className="bc-input h-10 w-full pl-9"
                    placeholder="team@company.com"
                    value={form.assignee}
                    onChange={(e) => updateField("assignee", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#333333] mb-1.5 block">
                  Description
                </label>

                <textarea
                  rows={4}
                  className="bc-input w-full py-2.5 resize-none"
                  placeholder="Add notes, agenda or additional details…"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E8ECEA]">
            {isEdit ? (
              <button
                type="button"
                onClick={del}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-[#E7CACA] bg-[#FFF7F7] text-[#A14343] text-[12px] font-semibold hover:bg-[#FCECEC] disabled:opacity-50"
                data-testid="event-delete"
              >
                {isDeleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}

                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-lg border border-[#DCE3E1] bg-white text-[#4D5A5B] text-[12px] font-semibold hover:bg-[#F5F7F6]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold hover:bg-[#173A31] disabled:opacity-50"
                data-testid="event-save"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    {isEdit ? <Check size={14} /> : <Plus size={14} />}

                    {isEdit ? "Save Changes" : "Create Event"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Calendar Page                                                              */
/* -------------------------------------------------------------------------- */

export default function CalendarPage() {
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(() => new Date());

  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const {
    data: events = [],
    isFetching,
    isError,
  } = useGetCalendarEventsQuery({
    limit: 500,
  });

  const { data: projects = [], isError: isProjectsError } =
    useGetProjectsQuery();

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load calendar events");
    }
  }, [isError]);

  useEffect(() => {
    if (isProjectsError) {
      toast.error("Failed to load projects");
    }
  }, [isProjectsError]);

  /* ---------------------------------------------------------------------- */
  /* Search                                                                  */
  /* ---------------------------------------------------------------------- */

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return events;

    const q = search.toLowerCase();

    return events.filter((event) =>
      [
        event.title,
        event.type,
        event.location,
        event.description,
        event.project_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [events, search]);

  const eventsByDay = useMemo(() => {
    const map = {};

    for (const event of filteredEvents) {
      if (!event.starts_at) continue;

      const key = getDateKey(event.starts_at);

      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(event);
    }

    Object.values(map).forEach((items) => {
      items.sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      );
    });

    return map;
  }, [filteredEvents]);

  /* ---------------------------------------------------------------------- */
  /* Header title                                                            */
  /* ---------------------------------------------------------------------- */

  const headerTitle = useMemo(() => {
    const year = cursor.getFullYear();

    if (view === "year") {
      return (
        <>
          <span className="font-bold">{year}</span>
        </>
      );
    }

    if (view === "month") {
      return (
        <>
          <span className="font-bold">{MONTHS[cursor.getMonth()]}</span>{" "}
          <span className="font-light text-[#8A9697]">{year}</span>
        </>
      );
    }

    if (view === "day") {
      return cursor.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    const first = new Date(cursor);
    first.setDate(first.getDate() - first.getDay());

    const last = new Date(first);
    last.setDate(last.getDate() + 6);

    return (
      <>
        <span className="font-bold">
          {first.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
          })}
        </span>

        <span className="font-light text-[#8A9697]">
          {" "}
          –{" "}
          {last.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </>
    );
  }, [view, cursor]);

  /* ---------------------------------------------------------------------- */
  /* Stats                                                                   */
  /* ---------------------------------------------------------------------- */

  const monthStats = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();

    const current = events.filter((event) => {
      const date = new Date(event.starts_at);

      return date.getFullYear() === y && date.getMonth() === m;
    });

    return {
      total: current.length,

      meetings: current.filter((event) =>
        ["client_meeting", "internal_meeting", "vendor_call"].includes(
          event.type,
        ),
      ).length,

      siteVisits: current.filter((event) => event.type === "site_visit").length,

      deadlines: current.filter((event) =>
        ["milestone_due", "quotation_deadline"].includes(event.type),
      ).length,
    };
  }, [events, cursor]);

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                 */
  /* ---------------------------------------------------------------------- */

  const shift = (amount) => {
    const next = new Date(cursor);

    if (view === "day") {
      next.setDate(next.getDate() + amount);
    }

    if (view === "week") {
      next.setDate(next.getDate() + amount * 7);
    }

    if (view === "month") {
      next.setMonth(next.getMonth() + amount);
    }

    if (view === "year") {
      next.setFullYear(next.getFullYear() + amount);
    }

    setCursor(next);
  };

  const goToday = () => {
    setCursor(new Date());
  };

  const openCreate = (date) => {
    setEditingEvent(null);
    setModalDate(date || new Date());
    setShowModal(true);
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setModalDate(null);
    setShowModal(true);
  };

  return (
    <div className="w-full">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-5" data-testid="calendar-header">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {/* Title */}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF1EE] flex items-center justify-center shrink-0">
                <CalendarDays size={19} className="text-[#1F453B]" />
              </div>

              <div className="min-w-0">
                <h1
                  className="text-[24px] md:text-[27px] text-[#333333] truncate"
                  style={{ fontFamily: "Poppins" }}
                  data-testid="calendar-title"
                >
                  {headerTitle}
                </h1>

                <p className="text-[12px] text-[#8A9697] mt-0.5">
                  {filteredEvents.length} calendar event
                  {filteredEvents.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View switcher */}
            <div
              className="inline-flex items-center rounded-lg bg-[#EEF1F0] p-0.5"
              data-testid="calendar-view-switcher"
            >
              {VIEWS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setView(item)}
                  className={`px-3 h-8 rounded-md text-[11.5px] font-semibold capitalize transition-all ${
                    view === item
                      ? "bg-white text-[#1F453B] shadow-sm"
                      : "text-[#6B7B7C] hover:text-[#333333]"
                  }`}
                  data-testid={`calendar-view-${item}`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center rounded-lg border border-[#DCE3E1] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => shift(-1)}
                className="w-9 h-9 flex items-center justify-center text-[#4D5A5B] hover:bg-[#F4F6F5]"
                data-testid="calendar-prev"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="w-px h-5 bg-[#E4E8E6]" />

              <button
                type="button"
                onClick={goToday}
                className="h-9 px-3 text-[11.5px] font-semibold text-[#4D5A5B] hover:bg-[#F4F6F5]"
                data-testid="calendar-today"
              >
                Today
              </button>

              <div className="w-px h-5 bg-[#E4E8E6]" />

              <button
                type="button"
                onClick={() => shift(1)}
                className="w-9 h-9 flex items-center justify-center text-[#4D5A5B] hover:bg-[#F4F6F5]"
                data-testid="calendar-next"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Search */}
            <button
              type="button"
              onClick={() => setSearchOpen((current) => !current)}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                searchOpen
                  ? "border-[#1F453B] bg-[#EAF1EE] text-[#1F453B]"
                  : "border-[#DCE3E1] bg-white text-[#4D5A5B] hover:bg-[#F4F6F5]"
              }`}
              title="Search events"
            >
              <Search size={15} />
            </button>

            {/* Add */}
            <button
              type="button"
              onClick={() => openCreate(new Date())}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold hover:bg-[#173A31] shadow-sm"
              data-testid="calendar-add-event"
            >
              <Plus size={14} />
              Add Event
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="mt-4 flex items-center gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-3 text-[#8A9697]"
              />

              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events, projects, locations…"
                className="bc-input h-10 w-full pl-9 pr-9"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-[#8A9697] hover:text-[#333333]"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {isFetching && (
        <div className="flex items-center gap-2 text-[12px] text-[#7A8586] mb-3">
          <Loader2 size={14} className="animate-spin" />
          Updating calendar…
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Calendar Views                                                       */}
      {/* ------------------------------------------------------------------ */}

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
          onMonthClick={(month) => {
            setCursor(new Date(cursor.getFullYear(), month, 1));

            setView("month");
          }}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Legend                                                              */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
        {EVENT_TYPES.slice(0, 8).map((type) => (
          <div
            key={type.value}
            className="flex items-center gap-1.5 text-[10px] text-[#7A8586]"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: type.dot }}
            />

            {type.label}
          </div>
        ))}
      </div>

      {/* Modal */}
      <CreateEventModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEvent(null);
        }}
        initialDate={modalDate}
        projects={projects}
        existingEvent={editingEvent}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({ icon, value, label }) {
  return (
    <div className="bg-white border border-[rgba(31,69,59,0.09)] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[23px] font-bold text-[#333333]">{value}</div>

          <div className="text-[10.5px] text-[#7A8586] mt-0.5">{label}</div>
        </div>

        <div className="w-9 h-9 rounded-lg bg-[#EAF1EE] text-[#1F453B] flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Month View                                                                 */
/* -------------------------------------------------------------------------- */

function MonthView({ cursor, eventsByDay, onDayClick, onEventClick }) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDay = new Date(year, month, 1).getDay();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const previousMonthDays = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, previousMonthDays - i);

    cells.push({
      date,
      currentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      date: new Date(year, month, day),
      currentMonth: true,
    });
  }

  let nextDay = 1;

  while (cells.length % 7 !== 0) {
    cells.push({
      date: new Date(year, month + 1, nextDay++),
      currentMonth: false,
    });
  }

  const today = new Date();

  return (
    <div
      className="bg-white border border-[rgba(31,69,59,0.09)] rounded-xl overflow-hidden"
      data-testid="calendar-month-view"
    >
      {/* Weekdays */}
      <div className="grid grid-cols-7 border-b border-[#E7EBE9] bg-[#F8F9F7]">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-[10px] uppercase tracking-wider font-bold text-[#7A8586]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell, index) => {
          const key = getDateKey(cell.date);
          const events = eventsByDay[key] || [];
          const todayCell = isSameDay(cell.date, today);

          return (
            <div
              key={index}
              onClick={() => onDayClick(cell.date)}
              className={`
                min-h-[125px]
                md:min-h-[145px]
                p-2
                border-r
                border-b
                border-[#E7EBE9]
                cursor-pointer
                transition-colors
                hover:bg-[#FAFBFA]
                ${!cell.currentMonth ? "bg-[#FCFCFB]" : "bg-white"}
              `}
              data-testid={`month-cell-${key}`}
            >
              {/* Date */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`
                    w-7
                    h-7
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-[11px]
                    font-semibold
                    ${
                      todayCell
                        ? "bg-[#1F453B] text-white"
                        : cell.currentMonth
                          ? "text-[#3F4B4C]"
                          : "text-[#C2CACA]"
                    }
                  `}
                >
                  {cell.date.getDate()}
                </span>

                {events.length > 0 && (
                  <span className="text-[9px] font-medium text-[#9AA4A5]">
                    {events.length}
                  </span>
                )}
              </div>

              {/* Events */}
              <div>
                {events.slice(0, 4).map((event) => (
                  <EventPill key={event.id} ev={event} onClick={onEventClick} />
                ))}

                {events.length > 4 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayClick(cell.date);
                    }}
                    className="text-[9.5px] font-semibold text-[#1F453B] px-1 hover:underline"
                  >
                    +{events.length - 4} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Week View                                                                  */
/* -------------------------------------------------------------------------- */

function WeekView({ cursor, eventsByDay, onDayClick, onEventClick }) {
  const first = new Date(cursor);

  first.setDate(first.getDate() - first.getDay());

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(first);
    date.setDate(date.getDate() + index);
    return date;
  });

  const hours = Array.from({ length: 15 }, (_, index) => index + 7);

  const today = new Date();

  return (
    <div
      className="bg-white border border-[rgba(31,69,59,0.09)] rounded-xl overflow-auto"
      data-testid="calendar-week-view"
    >
      <div
        className="min-w-[900px] grid"
        style={{
          gridTemplateColumns: "58px repeat(7, minmax(120px, 1fr))",
        }}
      >
        {/* Header */}
        <div className="h-16 border-b border-[#E7EBE9] bg-[#F8F9F7]" />

        {days.map((date) => {
          const active = isSameDay(date, today);

          return (
            <div
              key={date.toISOString()}
              onClick={() => onDayClick(date)}
              className="h-16 border-l border-b border-[#E7EBE9] bg-[#F8F9F7] cursor-pointer hover:bg-[#F1F4F2]"
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#8A9697]">
                  {WEEKDAYS[date.getDay()]}
                </span>

                <span
                  className={`
                    mt-1 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold
                    ${active ? "bg-[#1F453B] text-white" : "text-[#333333]"}
                  `}
                >
                  {date.getDate()}
                </span>
              </div>
            </div>
          );
        })}

        {/* Time rows */}
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <div className="h-16 border-b border-[#EEF1EF] flex items-start justify-end pr-2 pt-2 text-[9px] text-[#8A9697]">
              {formatHour(hour)}
            </div>

            {days.map((date) => {
              const key = getDateKey(date);

              const events = (eventsByDay[key] || []).filter((event) => {
                if (event.all_day) {
                  return hour === 7;
                }

                return new Date(event.starts_at).getHours() === hour;
              });

              return (
                <div
                  key={`${key}-${hour}`}
                  className="h-16 border-l border-b border-[#EEF1EF] p-1 cursor-pointer hover:bg-[#FAFBFA]"
                  onClick={() => {
                    const selected = new Date(date);

                    selected.setHours(hour, 0, 0, 0);

                    onDayClick(selected);
                  }}
                >
                  {events.map((event) => (
                    <EventPill
                      key={event.id}
                      ev={event}
                      onClick={onEventClick}
                      compact
                    />
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

/* -------------------------------------------------------------------------- */
/* Day View                                                                   */
/* -------------------------------------------------------------------------- */

function DayView({ cursor, eventsByDay, onDayClick, onEventClick }) {
  const key = getDateKey(cursor);
  const events = eventsByDay[key] || [];

  const hours = Array.from({ length: 15 }, (_, index) => index + 7);

  return (
    <div
      className="bg-white border border-[rgba(31,69,59,0.09)] rounded-xl overflow-hidden"
      data-testid="calendar-day-view"
    >
      {/* Day summary */}
      <div className="px-5 py-4 border-b border-[#E7EBE9] bg-[#F8F9F7]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1F453B] text-white flex items-center justify-center">
            <CalendarDays size={18} />
          </div>

          <div>
            <div className="text-[14px] font-bold text-[#333333]">
              {cursor.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>

            <div className="text-[11px] text-[#8A9697]">
              {events.length} event
              {events.length !== 1 ? "s" : ""} scheduled
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "72px 1fr",
        }}
      >
        {hours.map((hour) => {
          const hourEvents = events.filter((event) => {
            if (event.all_day) {
              return hour === 7;
            }

            return new Date(event.starts_at).getHours() === hour;
          });

          return (
            <React.Fragment key={hour}>
              <div className="min-h-[64px] border-b border-[#EEF1EF] text-[10px] text-[#8A9697] text-right pr-3 pt-3">
                {formatHour(hour)}
              </div>

              <div
                className="min-h-[64px] border-b border-[#EEF1EF] p-1.5 hover:bg-[#FAFBFA] cursor-pointer"
                onClick={() => {
                  const selected = new Date(cursor);

                  selected.setHours(hour, 0, 0, 0);

                  onDayClick(selected);
                }}
              >
                {hourEvents.map((event) => (
                  <EventPill key={event.id} ev={event} onClick={onEventClick} />
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Year View                                                                  */
/* -------------------------------------------------------------------------- */

function YearView({ cursor, eventsByDay, onMonthClick }) {
  const year = cursor.getFullYear();

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      data-testid="calendar-year-view"
    >
      {MONTHS.map((month, monthIndex) => {
        const firstDay = new Date(year, monthIndex, 1).getDay();

        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

        const cells = [];

        for (let i = 0; i < firstDay; i++) {
          cells.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
          cells.push(day);
        }

        const monthEventCount = cells.reduce((total, day) => {
          if (!day) return total;

          const key = getDateKey(new Date(year, monthIndex, day));

          return total + (eventsByDay[key] || []).length;
        }, 0);

        return (
          <button
            type="button"
            key={month}
            onClick={() => onMonthClick(monthIndex)}
            className="text-left bg-white border border-[rgba(31,69,59,0.09)] rounded-xl p-4 hover:border-[#B9C9C3] hover:shadow-sm transition-all"
            data-testid={`year-month-${monthIndex}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[14px] font-bold text-[#333333]">
                {month}
              </div>

              {monthEventCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#EAF1EE] text-[#1F453B] text-[9px] font-bold">
                  {monthEventCount}
                </span>
              )}
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-[8px] uppercase font-bold text-[#B2BCBC]"
                >
                  {day[0]}
                </div>
              ))}

              {cells.map((day, index) => {
                if (!day) {
                  return <div key={index} />;
                }

                const date = new Date(year, monthIndex, day);

                const key = getDateKey(date);

                const hasEvents = (eventsByDay[key] || []).length > 0;

                const isToday = isSameDay(date, new Date());

                return (
                  <div
                    key={index}
                    className={`
                      relative
                      h-5
                      flex
                      items-center
                      justify-center
                      text-[9px]
                      ${
                        isToday
                          ? "font-bold text-[#1F453B]"
                          : hasEvents
                            ? "font-bold text-[#333333]"
                            : "text-[#8A9697]"
                      }
                    `}
                  >
                    {day}

                    {hasEvents && (
                      <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[#1F453B]" />
                    )}
                  </div>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const value = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  return `${value} ${suffix}`;
}
