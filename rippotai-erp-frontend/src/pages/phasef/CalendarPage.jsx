import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  X,
  CalendarDays,
  MapPin,
  UserRound,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";

import {
  useGetCalendarsQuery,
  useGetCalendarEventsQuery,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useDeleteCalendarEventMutation,
} from "../../api/connectors/calendar.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";

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
    color: "#3E8A58",
  },
  {
    value: "client_meeting",
    label: "Client Meeting",
    bg: "#E8F1ED",
    text: "#1F453B",
    dot: "#1F453B",
    color: "#1F453B",
  },
  {
    value: "internal_meeting",
    label: "Internal Meeting",
    bg: "#EEF2F0",
    text: "#31564C",
    dot: "#31564C",
    color: "#31564C",
  },
  {
    value: "vendor_call",
    label: "Vendor Call",
    bg: "#F1ECF7",
    text: "#6E3EAA",
    dot: "#8052B5",
    color: "#8052B5",
  },
  {
    value: "presentation",
    label: "Presentation",
    bg: "#F8EAF0",
    text: "#9A4666",
    dot: "#B35A7B",
    color: "#B35A7B",
  },
  {
    value: "site_visit",
    label: "Site Visit",
    bg: "#FFF3DA",
    text: "#87601A",
    dot: "#D19A28",
    color: "#D19A28",
  },
  {
    value: "milestone_due",
    label: "Milestone",
    bg: "#EAF0F9",
    text: "#365B8A",
    dot: "#537DB5",
    color: "#537DB5",
  },
  {
    value: "quotation_deadline",
    label: "Deadline",
    bg: "#FCECEC",
    text: "#9A3D3D",
    dot: "#C65A5A",
    color: "#C65A5A",
  },
  {
    value: "note",
    label: "Note",
    bg: "#EDE0F5",
    text: "#6E3EAA",
    dot: "#8A55B7",
    color: "#8A55B7",
  },
  {
    value: "handover",
    label: "Handover",
    bg: "#E7F2F4",
    text: "#29626C",
    dot: "#3B8794",
    color: "#3B8794",
  },
  {
    value: "personal",
    label: "Personal",
    bg: "#EAEEF0",
    text: "#6B7B7C",
    dot: "#7E8B8D",
    color: "#7E8B8D",
  },
];

const DEFAULT_EVENT_TYPE = "internal_meeting";

/* -------------------------------------------------------------------------- */
/* Zoho owner                                                                  */
/* -------------------------------------------------------------------------- */

const getOwnerKey = () => {
  try {
    const raw = localStorage.getItem("bc_user");

    if (!raw) return null;

    const user = JSON.parse(raw);

    return user?.id ?? user?._id ?? null;
  } catch {
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/* Calendar helpers                                                            */
/* -------------------------------------------------------------------------- */

const extractCalendars = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.calendars)) return data.calendars;
  if (Array.isArray(data?.calendar)) return data.calendar;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.response)) return data.response;
  return [];
};

const getCalendarUid = (calendar) => {
  return (
    calendar?.uid ??
    calendar?.calendaruid ??
    calendar?.calendarUid ??
    calendar?.id ??
    null
  );
};

/* -------------------------------------------------------------------------- */
/* Event type                                                                  */
/* -------------------------------------------------------------------------- */

const getEventType = (eventOrType) => {
  if (!eventOrType) {
    return EVENT_TYPES.find((item) => item.value === DEFAULT_EVENT_TYPE);
  }

  if (typeof eventOrType === "string") {
    return (
      EVENT_TYPES.find((item) => item.value === eventOrType) ||
      EVENT_TYPES.find((item) => item.value === DEFAULT_EVENT_TYPE)
    );
  }

  const explicitType =
    eventOrType?.type || eventOrType?.event_type || eventOrType?.eventType;

  if (explicitType) {
    const typeMatch = EVENT_TYPES.find((item) => item.value === explicitType);

    if (typeMatch) return typeMatch;
  }

  const eventColor = String(
    eventOrType?.color || eventOrType?.event_color || "",
  ).toUpperCase();

  if (eventColor) {
    const colorMatch = EVENT_TYPES.find(
      (item) => item.color.toUpperCase() === eventColor,
    );

    if (colorMatch) return colorMatch;
  }

  return EVENT_TYPES.find((item) => item.value === DEFAULT_EVENT_TYPE);
};

/* -------------------------------------------------------------------------- */
/* Zoho date parsing                                                           */
/* -------------------------------------------------------------------------- */

function parseZohoDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const input = String(value).trim();

  if (!input) return null;

  if (input.includes("-") && input.includes("T")) {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const match = input.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z|[+-]\d{4})?$/,
  );

  if (match) {
    const [, year, month, day, hour, minute, second = "00", timezone = ""] =
      match;

    const y = Number(year);
    const m = Number(month) - 1;
    const d = Number(day);
    const h = Number(hour);
    const min = Number(minute);
    const s = Number(second);

    if (timezone === "Z") {
      const date = new Date(Date.UTC(y, m, d, h, min, s));
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (/^[+-]\d{4}$/.test(timezone)) {
      const sign = timezone[0] === "+" ? 1 : -1;
      const offsetHours = Number(timezone.slice(1, 3));
      const offsetMinutes = Number(timezone.slice(3, 5));
      const offset = sign * (offsetHours * 60 + offsetMinutes);
      const utcMillis = Date.UTC(y, m, d, h, min, s) - offset * 60 * 1000;
      const date = new Date(utcMillis);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(y, m, d, h, min, s);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const allDayMatch = input.match(/^(\d{4})(\d{2})(\d{2})$/);

  if (allDayMatch) {
    const [, year, month, day] = allDayMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(input);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/* -------------------------------------------------------------------------- */
/* Date helpers                                                                */
/* -------------------------------------------------------------------------- */

const pad = (value) => String(value).padStart(2, "0");

const getDateKey = (date) => {
  const d = new Date(date);
  return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join("-");
};

const formatTime = (date) => {
  const parsed = parseZohoDate(date);
  if (!parsed) return "";
  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toLocalInputValue = (value) => {
  const date = parseZohoDate(value);
  if (!date) return "";

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/* -------------------------------------------------------------------------- */
/* Zoho date formatting                                                        */
/* -------------------------------------------------------------------------- */

const formatZohoUtc = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return (
    [
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),
      pad(date.getUTCDate()),
    ].join("") +
    "T" +
    [
      pad(date.getUTCHours()),
      pad(date.getUTCMinutes()),
      pad(date.getUTCSeconds()),
    ].join("") +
    "Z"
  );
};

const formatZohoAllDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("");
};

/* -------------------------------------------------------------------------- */
/* API range                                                                   */
/* -------------------------------------------------------------------------- */

const formatZohoRangeDate = (date) => {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("");
};

const getMonthRange = (cursor) => {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return {
    start: formatZohoRangeDate(start),
    end: formatZohoRangeDate(end),
  };
};

const getCalendarRange = (cursor, view) => {
  if (view === "month" || view === "year") {
    return getMonthRange(cursor);
  }

  if (view === "day") {
    const start = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate(),
    );
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
      start: formatZohoRangeDate(start),
      end: formatZohoRangeDate(end),
    };
  }

  const first = new Date(cursor);
  first.setDate(first.getDate() - first.getDay());

  const last = new Date(first);
  last.setDate(last.getDate() + 6);

  return {
    start: formatZohoRangeDate(first),
    end: formatZohoRangeDate(last),
  };
};

/* -------------------------------------------------------------------------- */
/* Normalize Zoho event                                                        */
/* -------------------------------------------------------------------------- */

function normalizeEvent(event) {
  const dateTime = event?.dateandtime || event?.dateAndTime || {};

  const start =
    dateTime?.start ||
    event?.start ||
    event?.starts_at ||
    event?.start_time ||
    null;

  const end =
    dateTime?.end || event?.end || event?.ends_at || event?.end_time || start;

  const parsedStart = parseZohoDate(start);
  const parsedEnd = parseZohoDate(end);
  const type = getEventType(event);

  const attendees = Array.isArray(event?.attendees)
    ? event.attendees
        .map((item) => (typeof item === "string" ? item : item?.email))
        .filter(Boolean)
    : [];

  return {
    ...event,
    id: event?.uid || event?.id || event?.eventUid || event?.event_uid,
    uid: event?.uid || event?.eventUid || event?.event_uid || event?.id,
    title: event?.title || event?.name || "Untitled Event",
    type: type.value,
    color: event?.color || type.color,
    starts_at: parsedStart ? parsedStart.toISOString() : null,
    ends_at: parsedEnd ? parsedEnd.toISOString() : null,
    all_day:
      event?.isallday === true ||
      event?.isallday === "true" ||
      event?.all_day === true,
    location: event?.location || "",
    description: event?.description || event?.richtext_description || "",
    attendees,
    project_id: event?.project_id || null,
    project_name: event?.project_name || "",
  };
}

function extractEvents(data) {
  if (Array.isArray(data)) return data.map(normalizeEvent);
  if (Array.isArray(data?.events)) return data.events.map(normalizeEvent);
  if (Array.isArray(data?.data)) return data.data.map(normalizeEvent);
  if (Array.isArray(data?.result)) return data.result.map(normalizeEvent);
  return [];
}

/* -------------------------------------------------------------------------- */
/* Event Pill                                                                  */
/* -------------------------------------------------------------------------- */

function EventPill({ ev, onClick, compact = false }) {
  const type = getEventType(ev);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(ev);
      }}
      title={`${ev.title}${
        ev.starts_at ? ` • ${formatTime(ev.starts_at)}` : ""
      }`}
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
/* Modal                                                                       */
/* -------------------------------------------------------------------------- */

function CreateEventModal({
  open,
  onClose,
  initialDate,
  projects,
  existingEvent,
  ownerKey,
  calendarUid,
}) {
  const isEdit = !!existingEvent;

  const [form, setForm] = useState({
    title: "",
    type: DEFAULT_EVENT_TYPE,
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
        type: existingEvent.type || getEventType(existingEvent).value,
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
        assignee: existingEvent.attendees?.[0] || "",
      });
      return;
    }

    const date = initialDate ? new Date(initialDate) : new Date();
    const start = new Date(date);

    if (!initialDate) {
      start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0);
    }

    const end = new Date(start.getTime() + 60 * 60 * 1000);

    setForm({
      title: "",
      type: DEFAULT_EVENT_TYPE,
      starts_at: toLocalInputValue(start),
      ends_at: toLocalInputValue(end),
      all_day: false,
      project_id: "",
      location: "",
      description: "",
      assignee: "",
    });
  }, [open, initialDate, existingEvent]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!ownerKey) {
      toast.error("Zoho user is not connected.");
      return;
    }

    if (!calendarUid) {
      toast.error("No Zoho Calendar is selected.");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    if (!form.starts_at) {
      toast.error("Start date and time are required");
      return;
    }

    const startDate = new Date(form.starts_at);
    const endDate = form.ends_at
      ? new Date(form.ends_at)
      : new Date(startDate.getTime() + 60 * 60 * 1000);

    if (Number.isNaN(startDate.getTime())) {
      toast.error("Invalid start date.");
      return;
    }

    if (Number.isNaN(endDate.getTime())) {
      toast.error("Invalid end date.");
      return;
    }

    if (endDate < startDate) {
      toast.error("End time cannot be before start time");
      return;
    }

    const selectedType = getEventType(form.type);
    let description = form.description.trim();

    const selectedProject = projects.find(
      (project) => String(project.id) === String(form.project_id),
    );

    if (selectedProject) {
      const projectLine = `Project: ${selectedProject.name}`;
      if (!description.includes(projectLine)) {
        description = description
          ? `${projectLine}\n\n${description}`
          : projectLine;
      }
    }

    const eventdata = {
      title: form.title.trim(),
      dateandtime: form.all_day
        ? {
            start: formatZohoAllDay(startDate),
            end: formatZohoAllDay(endDate),
          }
        : {
            start: formatZohoUtc(startDate),
            end: formatZohoUtc(endDate),
          },
      isallday: !!form.all_day,
      color: selectedType.color,
      ...(form.location.trim() ? { location: form.location.trim() } : {}),
      ...(description ? { description } : {}),
      ...(form.assignee.trim()
        ? { attendees: [{ email: form.assignee.trim() }] }
        : {}),
      ...(form.assignee.trim() ? { notify_attendee: 2 } : {}),
    };

    try {
      if (isEdit) {
        const eventUid = existingEvent.uid || existingEvent.id;

        if (!eventUid) {
          toast.error("Zoho event UID is missing.");
          return;
        }

        await updateCalendarEvent({
          ownerKey,
          calendarUid,
          eventUid,
          body: {
            ...eventdata,
            uid: eventUid,
            ...(existingEvent.etag ? { etag: existingEvent.etag } : {}),
          },
        }).unwrap();

        toast.success("Event updated successfully");
      } else {
        await createCalendarEvent({
          ownerKey,
          calendarUid,
          body: eventdata,
        }).unwrap();

        toast.success("Event created successfully");
      }

      onClose();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.error ||
          (isEdit ? "Failed to update event" : "Failed to create event"),
      );
    }
  };

  const del = async () => {
    if (!isEdit) return;

    const eventUid = existingEvent.uid || existingEvent.id;

    if (!eventUid) {
      toast.error("Zoho event UID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${existingEvent.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteCalendarEvent({
        ownerKey,
        calendarUid,
        eventUid,
      }).unwrap();

      toast.success("Event deleted");
      onClose();
    } catch (error) {
      toast.error(
        error?.data?.message || error?.error || "Failed to delete event",
      );
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
        <div className="sticky top-0 z-10 bg-white border-b border-[#E8ECEA] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
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
                    ? "Update the Zoho Calendar event."
                    : "Add an event to your Zoho Calendar."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A8586] hover:bg-[#F3F5F4]"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="p-5 space-y-5">
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
                  Attendee Email
                </label>
                <div className="relative">
                  <UserRound
                    size={14}
                    className="absolute left-3 top-3 text-[#8A9697]"
                  />
                  <input
                    type="email"
                    className="bc-input h-10 w-full pl-9"
                    placeholder="team@company.com"
                    value={form.assignee}
                    onChange={(e) => updateField("assignee", e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-[#9AA4A5] mt-1">
                  Zoho will send the event invitation to this attendee.
                </p>
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
                disabled={isSaving || !calendarUid}
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
/* Calendar Page                                                               */
/* -------------------------------------------------------------------------- */

export default function CalendarPage() {
  const ownerKey = getOwnerKey();

  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [calendarUid, setCalendarUid] = useState("");

  const range = useMemo(() => getCalendarRange(cursor, view), [cursor, view]);

  /* ---------------------------------------------------------------------- */
  /* Calendars — same pattern as CalendarMine / CalendarTeam                 */
  /* ---------------------------------------------------------------------- */

  const {
    data: calendarsData,
    isFetching: isFetchingCalendars,
    isError: isCalendarsError,
  } = useGetCalendarsQuery({ ownerKey }, { skip: !ownerKey });

  const calendars = useMemo(
    () => extractCalendars(calendarsData),
    [calendarsData],
  );

  const defaultCalendar =
    calendars.find(
      (calendar) =>
        calendar?.isdefault === true ||
        calendar?.isDefault === true ||
        calendar?.default === true,
    ) ?? calendars[0];

  const activeCalendarUid =
    calendarUid || getCalendarUid(defaultCalendar) || "";

  /* ---------------------------------------------------------------------- */
  /* Events                                                                  */
  /* ---------------------------------------------------------------------- */

  const {
    data: rawEvents,
    isFetching,
    isError,
  } = useGetCalendarEventsQuery(
    {
      ownerKey,
      calendarUid: activeCalendarUid,
      range,
      byinstance: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    {
      skip: !ownerKey || !activeCalendarUid,
    },
  );

  const events = useMemo(() => extractEvents(rawEvents), [rawEvents]);

  const { data: projectsData, isError: isProjectsError } =
    useGetProjectsQuery();

  const projects = useMemo(() => {
    if (Array.isArray(projectsData)) return projectsData;
    if (Array.isArray(projectsData?.data)) return projectsData.data;
    if (Array.isArray(projectsData?.projects)) return projectsData.projects;
    return [];
  }, [projectsData]);

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load Zoho Calendar events");
    }
  }, [isError]);

  useEffect(() => {
    if (isCalendarsError) {
      toast.error("Failed to load Zoho Calendars");
    }
  }, [isCalendarsError]);

  useEffect(() => {
    if (isProjectsError) {
      toast.error("Failed to load projects");
    }
  }, [isProjectsError]);

  useEffect(() => {
    if (calendarUid) return;

    const possibleUid = localStorage.getItem("zoho_calendar_uid");
    if (possibleUid) {
      setCalendarUid(possibleUid);
    }
  }, [calendarUid]);

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
        event.organizer,
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
      if (!map[key]) map[key] = [];
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

  const headerTitle = useMemo(() => {
    const year = cursor.getFullYear();

    if (view === "year") {
      return <span className="font-bold">{year}</span>;
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

  const shift = (amount) => {
    const next = new Date(cursor);

    if (view === "day") next.setDate(next.getDate() + amount);
    if (view === "week") next.setDate(next.getDate() + amount * 7);
    if (view === "month") next.setMonth(next.getMonth() + amount);
    if (view === "year") next.setFullYear(next.getFullYear() + amount);

    setCursor(next);
  };

  const goToday = () => setCursor(new Date());

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
      <div className="mb-5" data-testid="calendar-header">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
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

          <div className="flex items-center gap-2 flex-wrap">
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

            <button
              type="button"
              onClick={() => openCreate(new Date())}
              disabled={!activeCalendarUid}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold hover:bg-[#173A31] shadow-sm disabled:opacity-50"
              data-testid="calendar-add-event"
            >
              <Plus size={14} />
              Add Event
            </button>
          </div>
        </div>

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

      {!ownerKey && (
        <div className="bg-[#FFF8E8] border border-[#EBD9A7] rounded-xl px-4 py-3 text-[12px] text-[#7A621F] mb-4">
          Connect your Zoho account before using Calendar.
        </div>
      )}

      {ownerKey && !activeCalendarUid && !isFetchingCalendars && (
        <div className="bg-[#FFF8E8] border border-[#EBD9A7] rounded-xl px-4 py-3 text-[12px] text-[#7A621F] mb-4">
          No Zoho Calendar is selected. Please configure your default calendar.
        </div>
      )}

      {isFetchingCalendars && (
        <div className="flex items-center gap-2 text-[12px] text-[#7A8586] mb-3">
          <Loader2 size={14} className="animate-spin" />
          Loading calendars…
        </div>
      )}

      {isFetching && (
        <div className="flex items-center gap-2 text-[12px] text-[#7A8586] mb-3">
          <Loader2 size={14} className="animate-spin" />
          Updating Zoho Calendar…
        </div>
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
          onMonthClick={(month) => {
            setCursor(new Date(cursor.getFullYear(), month, 1));
            setView("month");
          }}
        />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
        {EVENT_TYPES.map((type) => (
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

      <CreateEventModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEvent(null);
        }}
        initialDate={modalDate}
        projects={projects}
        existingEvent={editingEvent}
        ownerKey={ownerKey}
        calendarUid={activeCalendarUid}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Month / Week / Day / Year views — unchanged from your original              */
/* -------------------------------------------------------------------------- */

function MonthView({ cursor, eventsByDay, onDayClick, onEventClick }) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, previousMonthDays - i),
      currentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), currentMonth: true });
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

      <div className="grid grid-cols-7">
        {cells.map((cell, index) => {
          const key = getDateKey(cell.date);
          const events = eventsByDay[key] || [];
          const todayCell = isSameDay(cell.date, today);

          return (
            <div
              key={index}
              onClick={() => onDayClick(cell.date)}
              className={`min-h-[125px] md:min-h-[145px] p-2 border-r border-b border-[#E7EBE9] cursor-pointer transition-colors hover:bg-[#FAFBFA] ${
                !cell.currentMonth ? "bg-[#FCFCFB]" : "bg-white"
              }`}
              data-testid={`month-cell-${key}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                    todayCell
                      ? "bg-[#1F453B] text-white"
                      : cell.currentMonth
                        ? "text-[#3F4B4C]"
                        : "text-[#C2CACA]"
                  }`}
                >
                  {cell.date.getDate()}
                </span>
                {events.length > 0 && (
                  <span className="text-[9px] font-medium text-[#9AA4A5]">
                    {events.length}
                  </span>
                )}
              </div>
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
        style={{ gridTemplateColumns: "58px repeat(7, minmax(120px, 1fr))" }}
      >
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
                  className={`mt-1 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                    active ? "bg-[#1F453B] text-white" : "text-[#333333]"
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>
            </div>
          );
        })}

        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <div className="h-16 border-b border-[#EEF1EF] flex items-start justify-end pr-2 pt-2 text-[9px] text-[#8A9697]">
              {formatHour(hour)}
            </div>
            {days.map((date) => {
              const key = getDateKey(date);
              const events = (eventsByDay[key] || []).filter((event) => {
                if (event.all_day) return hour === 7;
                const start = parseZohoDate(event.starts_at);
                return start && start.getHours() === hour;
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

function DayView({ cursor, eventsByDay, onDayClick, onEventClick }) {
  const key = getDateKey(cursor);
  const events = eventsByDay[key] || [];
  const hours = Array.from({ length: 15 }, (_, index) => index + 7);

  return (
    <div
      className="bg-white border border-[rgba(31,69,59,0.09)] rounded-xl overflow-hidden"
      data-testid="calendar-day-view"
    >
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
              {events.length} event{events.length !== 1 ? "s" : ""} scheduled
            </div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "72px 1fr" }}>
        {hours.map((hour) => {
          const hourEvents = events.filter((event) => {
            if (event.all_day) return hour === 7;
            const start = parseZohoDate(event.starts_at);
            return start && start.getHours() === hour;
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

        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let day = 1; day <= daysInMonth; day++) cells.push(day);

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
                if (!day) return <div key={index} />;

                const date = new Date(year, monthIndex, day);
                const key = getDateKey(date);
                const hasEvents = (eventsByDay[key] || []).length > 0;
                const isToday = isSameDay(date, new Date());

                return (
                  <div
                    key={index}
                    className={`relative h-5 flex items-center justify-center text-[9px] ${
                      isToday
                        ? "font-bold text-[#1F453B]"
                        : hasEvents
                          ? "font-bold text-[#333333]"
                          : "text-[#8A9697]"
                    }`}
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

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const value = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${value} ${suffix}`;
}
