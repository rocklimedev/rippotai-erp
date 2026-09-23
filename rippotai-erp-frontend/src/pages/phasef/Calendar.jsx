import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  Clock3,
  X,
} from "lucide-react";

import { Shell, Card, Input, Btn, BtnGhost } from "../../components/Shared";

import {
  useGetCalendarsQuery,
  useGetCalendarEventsQuery,
  useCreateCalendarEventMutation,
} from "../../api/connectors/calendar.api";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const TIMEZONE = "Asia/Kolkata";

const EVENT_TYPES = [
  {
    value: "client_meeting",
    label: "Client Meeting",
    color: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-500",
    zohoColor: "#4A90E2",
  },
  {
    value: "site_visit",
    label: "Site Visit",
    color: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
    zohoColor: "#F5A623",
  },
  {
    value: "vendor_call",
    label: "Vendor Call",
    color: "bg-purple-50 text-purple-700 border-purple-100",
    dot: "bg-purple-500",
    zohoColor: "#9013FE",
  },
  {
    value: "internal_meeting",
    label: "Internal Meeting",
    color: "bg-slate-50 text-slate-700 border-slate-100",
    dot: "bg-slate-500",
    zohoColor: "#64748B",
  },
  {
    value: "presentation",
    label: "Presentation",
    color: "bg-pink-50 text-pink-700 border-pink-100",
    dot: "bg-pink-500",
    zohoColor: "#E83E8C",
  },
  {
    value: "milestone_due",
    label: "Milestone Due",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
    zohoColor: "#10B981",
  },
  {
    value: "quotation_deadline",
    label: "Quotation Deadline",
    color: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-500",
    zohoColor: "#EF4444",
  },
  {
    value: "handover",
    label: "Handover",
    color: "bg-cyan-50 text-cyan-700 border-cyan-100",
    dot: "bg-cyan-500",
    zohoColor: "#06B6D4",
  },
  {
    value: "personal",
    label: "Personal",
    color: "bg-gray-50 text-gray-700 border-gray-100",
    dot: "bg-gray-500",
    zohoColor: "#6B7280",
  },
];

const DEFAULT_EVENT_TYPE = "internal_meeting";

const getEventType = (type) => {
  return (
    EVENT_TYPES.find((item) => item.value === type) ||
    EVENT_TYPES.find((item) => item.value === DEFAULT_EVENT_TYPE) ||
    EVENT_TYPES[0]
  );
};

/* -------------------------------------------------------------------------- */
/* Owner Key                                                                  */
/* -------------------------------------------------------------------------- */

const getOwnerKey = () => {
  try {
    const raw = localStorage.getItem("bc_user");

    if (!raw) {
      return null;
    }

    const user = JSON.parse(raw);

    return user?.id ?? user?._id ?? null;
  } catch {
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/* Date helpers                                                               */
/* -------------------------------------------------------------------------- */

const pad = (value) => String(value).padStart(2, "0");

/**
 * Format date as Zoho ISO basic format.
 *
 * Zoho create-event API accepts:
 *
 * yyyyMMdd'T'HHmmss'Z'
 *
 * when sending GMT.
 *
 * We send UTC here so the API receives an unambiguous value,
 * while timezone tells Zoho which timezone the event belongs to.
 */
const formatZohoDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return (
    `${date.getUTCFullYear()}` +
    `${pad(date.getUTCMonth() + 1)}` +
    `${pad(date.getUTCDate())}` +
    "T" +
    `${pad(date.getUTCHours())}` +
    `${pad(date.getUTCMinutes())}` +
    `${pad(date.getUTCSeconds())}` +
    "Z"
  );
};

/**
 * Zoho date parser.
 *
 * Supports:
 *
 * 20260923T170000
 * 20260923T170000Z
 * 20260923T170000+0530
 * 20260923T170000-0400
 * 20260923T170000+05:30
 * ISO strings
 */
const parseZohoDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const string = String(value).trim();

  if (!string) {
    return null;
  }

  /* ---------------------------------------------------------------------- */
  /* yyyyMMdd                                                                */
  /* ---------------------------------------------------------------------- */

  const dateOnly = string.match(/^(\d{4})(\d{2})(\d{2})$/);

  if (dateOnly) {
    const [, year, month, day] = dateOnly;

    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0);
  }

  /* ---------------------------------------------------------------------- */
  /* yyyyMMddTHHmm                                                           */
  /* ---------------------------------------------------------------------- */

  const basicShort = string.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(Z|[+-]\d{2}:?\d{2})?$/,
  );

  if (basicShort) {
    const [, year, month, day, hour, minute, timezone] = basicShort;

    return parseBasicDate({
      year,
      month,
      day,
      hour,
      minute,
      second: "00",
      timezone,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* yyyyMMddTHHmmss                                                         */
  /* ---------------------------------------------------------------------- */

  const basic = string.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z|[+-]\d{2}:?\d{2})?$/,
  );

  if (basic) {
    const [, year, month, day, hour, minute, second, timezone] = basic;

    return parseBasicDate({
      year,
      month,
      day,
      hour,
      minute,
      second,
      timezone,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* ISO fallback                                                            */
  /* ---------------------------------------------------------------------- */

  const fallback = new Date(string);

  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const parseBasicDate = ({
  year,
  month,
  day,
  hour,
  minute,
  second,
  timezone,
}) => {
  const y = Number(year);
  const m = Number(month) - 1;
  const d = Number(day);
  const h = Number(hour);
  const min = Number(minute);
  const s = Number(second);

  if (!timezone) {
    return new Date(y, m, d, h, min, s);
  }

  if (timezone === "Z") {
    return new Date(Date.UTC(y, m, d, h, min, s));
  }

  const normalizedTimezone = timezone.replace(":", "");

  const sign = normalizedTimezone.startsWith("-") ? -1 : 1;

  const timezoneHours = Number(normalizedTimezone.slice(1, 3));
  const timezoneMinutes = Number(normalizedTimezone.slice(3, 5));

  const offsetMinutes = sign * (timezoneHours * 60 + timezoneMinutes);

  const utcTime = Date.UTC(y, m, d, h, min, s) - offsetMinutes * 60 * 1000;

  return new Date(utcTime);
};

/* -------------------------------------------------------------------------- */
/* Range helpers                                                              */
/* -------------------------------------------------------------------------- */

const formatRangeDate = (date) => {
  return (
    `${date.getFullYear()}` +
    `${pad(date.getMonth() + 1)}` +
    `${pad(date.getDate())}`
  );
};

/**
 * Zoho event list API allows a maximum range of 31 days.
 *
 * We therefore fetch exactly the selected calendar month.
 */
const getMonthRange = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const start = new Date(year, month, 1);

  const end = new Date(year, month + 1, 0);

  return {
    start: formatRangeDate(start),
    end: formatRangeDate(end),
  };
};

/**
 * For "My Calendar", use a rolling 30-day range.
 */
const getUpcomingRange = () => {
  const start = new Date();

  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 30,
  );

  return {
    start: formatRangeDate(start),
    end: formatRangeDate(end),
  };
};

/* -------------------------------------------------------------------------- */
/* Calendar helpers                                                           */
/* -------------------------------------------------------------------------- */

const extractArray = (data, keys = []) => {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
};

const extractCalendars = (data) => {
  return extractArray(data, ["calendars", "calendar", "data", "response"]);
};

const extractEvents = (data) => {
  return extractArray(data, ["events", "event", "data", "response"]);
};

const getCalendarUid = (calendar) => {
  return (
    calendar?.uid ??
    calendar?.calendaruid ??
    calendar?.calendarUid ??
    calendar?.id
  );
};

const getCalendarName = (calendar) => {
  return (
    calendar?.name ??
    calendar?.title ??
    calendar?.displayname ??
    "Primary Calendar"
  );
};

/* -------------------------------------------------------------------------- */
/* Event normalizer                                                           */
/* -------------------------------------------------------------------------- */

const normalizeEvent = (event) => {
  if (!event) {
    return null;
  }

  const startValue =
    event?.dateandtime?.start ??
    event?.start ??
    event?.starts_at ??
    event?.start_time;

  const endValue =
    event?.dateandtime?.end ?? event?.end ?? event?.ends_at ?? event?.end_time;

  const startDate = parseZohoDate(startValue);
  const endDate = parseZohoDate(endValue);

  if (!startDate) {
    return null;
  }

  const color = String(event?.color || "").toLowerCase();

  const matchedType =
    EVENT_TYPES.find((item) => item.zohoColor.toLowerCase() === color) ||
    getEventType(DEFAULT_EVENT_TYPE);

  return {
    ...event,

    id: event?.uid ?? event?.eventuid ?? event?.id,

    title: event?.title ?? event?.eventtitle ?? "Untitled Event",

    starts_at: startDate,

    ends_at: endDate,

    location: event?.location ?? event?.where ?? event?.location_name ?? "",

    description: event?.description ?? event?.richtext_description ?? "",

    type: matchedType.value,

    isAllDay: event?.isallday === true || event?.isallday === "true",

    color: event?.color ?? "",
  };
};

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

const formatTime = (date) => {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const isSameDay = (a, b) => {
  if (!a || !b) {
    return false;
  }

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const makeDayKey = (date) => {
  if (!date) {
    return null;
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

/* -------------------------------------------------------------------------- */
/* My Calendar                                                                */
/* -------------------------------------------------------------------------- */

export function CalendarMine() {
  const ownerKey = getOwnerKey();

  const {
    data: calendarsData,
    isLoading: calendarsLoading,
    isError: calendarsError,
  } = useGetCalendarsQuery(
    {
      ownerKey,
    },
    {
      skip: !ownerKey,
    },
  );

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

  const calendarUid = getCalendarUid(defaultCalendar);

  const upcomingRange = useMemo(() => getUpcomingRange(), []);

  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsError,
  } = useGetCalendarEventsQuery(
    {
      ownerKey,
      calendarUid,
      range: upcomingRange,
      byinstance: true,
      timezone: TIMEZONE,
    },
    {
      skip: !ownerKey || !calendarUid,
    },
  );

  const events = useMemo(() => {
    return extractEvents(eventsData)
      .map(normalizeEvent)
      .filter(Boolean)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  }, [eventsData]);

  const now = new Date();

  const upcomingEvents = events.filter((event) => event.starts_at >= now);

  const siteVisits = events.filter((event) => event.type === "site_visit");

  const deadlines = events.filter(
    (event) =>
      event.type === "quotation_deadline" || event.type === "milestone_due",
  );

  const busy = calendarsLoading || eventsLoading;

  return (
    <Shell
      label="Calendar"
      title="My Calendar"
      subtitle="Your upcoming meetings, visits and deadlines"
      action={
        <Btn onClick={() => window.location.assign("/calendar/team")}>
          <Plus size={15} />
          New Event
        </Btn>
      }
    >
      {/* ------------------------------------------------------------------ */}
      {/* Summary                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF1EE] flex items-center justify-center">
              <CalendarDays size={18} className="text-[#1F453B]" />
            </div>

            <div>
              <div className="text-[22px] font-bold text-[#333333]">
                {events.length}
              </div>

              <div className="text-[11px] text-[#6B7B7C]">Next 30 Days</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock3 size={18} className="text-blue-600" />
            </div>

            <div>
              <div className="text-[22px] font-bold text-[#333333]">
                {upcomingEvents.length}
              </div>

              <div className="text-[11px] text-[#6B7B7C]">Upcoming</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <MapPin size={18} className="text-amber-600" />
            </div>

            <div>
              <div className="text-[22px] font-bold text-[#333333]">
                {siteVisits.length}
              </div>

              <div className="text-[11px] text-[#6B7B7C]">Site Visits</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <CalendarDays size={18} className="text-red-600" />
            </div>

            <div>
              <div className="text-[22px] font-bold text-[#333333]">
                {deadlines.length}
              </div>

              <div className="text-[11px] text-[#6B7B7C]">Deadlines</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Events                                                              */}
      {/* ------------------------------------------------------------------ */}

      <Card className="overflow-hidden">
        {!ownerKey ? (
          <div className="py-16 text-center text-[13px] text-red-600">
            Unable to identify the current user.
          </div>
        ) : calendarsError || eventsError ? (
          <div className="py-16 text-center">
            <div className="text-[13px] font-semibold text-red-600">
              Unable to load your Zoho Calendar.
            </div>

            <div className="text-[12px] text-[#7A8586] mt-1">
              Please reconnect Zoho if the problem continues.
            </div>
          </div>
        ) : busy ? (
          <div className="flex items-center justify-center py-16 text-[#6B7B7C] text-[13px]">
            <Loader2 size={17} className="animate-spin mr-2" />
            Loading your calendar…
          </div>
        ) : !calendarUid ? (
          <div className="py-16 text-center">
            <CalendarDays size={28} className="mx-auto text-[#1F453B] mb-3" />

            <div className="text-[14px] font-semibold text-[#333333]">
              No Zoho Calendar found
            </div>

            <div className="text-[12px] text-[#7A8586] mt-1">
              Connect your Zoho Calendar account to continue.
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-[#F1F4F3] flex items-center justify-center mb-4">
              <CalendarDays size={25} className="text-[#1F453B]" />
            </div>

            <div className="text-[15px] font-semibold text-[#333333]">
              No upcoming events
            </div>

            <div className="text-[12.5px] text-[#8A9697] mt-1 mb-5">
              Your Zoho Calendar is clear for the next 30 days.
            </div>

            <Btn onClick={() => window.location.assign("/calendar/team")}>
              <Plus size={14} />
              Create Event
            </Btn>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(31,69,59,0.08)]">
            {events.map((event) => {
              const type = getEventType(event.type);

              return (
                <div
                  key={event.id}
                  className="p-4 md:p-5 hover:bg-[#FAFBFB] transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Date */}

                    <div className="w-16 shrink-0 text-center">
                      <div className="text-[10px] uppercase font-semibold tracking-wider text-[#9AA5A5]">
                        {event.starts_at.toLocaleDateString("en-IN", {
                          month: "short",
                        })}
                      </div>

                      <div className="text-[32px] font-bold leading-none text-[#1F453B] mt-1">
                        {event.starts_at.getDate()}
                      </div>

                      <div className="text-[10px] text-[#8A9697] mt-1">
                        {event.starts_at.toLocaleDateString("en-IN", {
                          weekday: "short",
                        })}
                      </div>
                    </div>

                    {/* Content */}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[15px] font-semibold text-[#333333] truncate">
                            {event.title}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12px] text-[#7A8586]">
                            <span className="inline-flex items-center gap-1">
                              <Clock3 size={12} />
                              {event.isAllDay
                                ? "All day"
                                : formatTime(event.starts_at)}
                            </span>

                            {event.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={12} />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${type.color}`}
                        >
                          {type.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </Shell>
  );
}

/* -------------------------------------------------------------------------- */
/* Team Calendar                                                              */
/* -------------------------------------------------------------------------- */

export function CalendarTeam() {
  const ownerKey = getOwnerKey();

  const [monthDate, setMonthDate] = useState(() => new Date());

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    type: "client_meeting",
    starts_at: "",
    ends_at: "",
    location: "",
    description: "",
  });

  /* ---------------------------------------------------------------------- */
  /* Calendars                                                               */
  /* ---------------------------------------------------------------------- */

  const {
    data: calendarsData,
    isLoading: calendarsLoading,
    isError: calendarsError,
  } = useGetCalendarsQuery(
    {
      ownerKey,
    },
    {
      skip: !ownerKey,
    },
  );

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

  const calendarUid = getCalendarUid(defaultCalendar);

  /* ---------------------------------------------------------------------- */
  /* Month range                                                             */
  /* ---------------------------------------------------------------------- */

  const monthRange = useMemo(() => getMonthRange(monthDate), [monthDate]);

  /* ---------------------------------------------------------------------- */
  /* Events                                                                  */
  /* ---------------------------------------------------------------------- */

  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsError,
  } = useGetCalendarEventsQuery(
    {
      ownerKey,
      calendarUid,
      range: monthRange,
      byinstance: true,
      timezone: TIMEZONE,
    },
    {
      skip: !ownerKey || !calendarUid,
    },
  );

  const events = useMemo(() => {
    return extractEvents(eventsData)
      .map(normalizeEvent)
      .filter(Boolean)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  }, [eventsData]);

  /* ---------------------------------------------------------------------- */
  /* Create                                                                  */
  /* ---------------------------------------------------------------------- */

  const [createCalendarEvent, { isLoading: creating }] =
    useCreateCalendarEventMutation();

  /* ---------------------------------------------------------------------- */
  /* Month Grid                                                              */
  /* ---------------------------------------------------------------------- */

  const monthGrid = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const result = [];

    for (let i = 0; i < firstDay; i++) {
      result.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      result.push(new Date(year, month, day));
    }

    while (result.length % 7 !== 0) {
      result.push(null);
    }

    return result;
  }, [monthDate]);

  /* ---------------------------------------------------------------------- */
  /* Events by day                                                           */
  /* ---------------------------------------------------------------------- */

  const evByDay = useMemo(() => {
    const map = {};

    for (const event of events) {
      if (!event.starts_at) {
        continue;
      }

      const key = makeDayKey(event.starts_at);

      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(event);
    }

    Object.values(map).forEach((items) => {
      items.sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
    });

    return map;
  }, [events]);

  /* ---------------------------------------------------------------------- */
  /* Stats                                                                   */
  /* ---------------------------------------------------------------------- */

  const monthEvents = events.filter((event) => {
    const date = event.starts_at;

    return (
      date.getFullYear() === monthDate.getFullYear() &&
      date.getMonth() === monthDate.getMonth()
    );
  });

  const clientMeetings = monthEvents.filter(
    (event) => event.type === "client_meeting",
  );

  const siteVisits = monthEvents.filter((event) => event.type === "site_visit");

  const deadlines = monthEvents.filter(
    (event) =>
      event.type === "quotation_deadline" || event.type === "milestone_due",
  );

  const monthLabel = monthDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();

  /* ---------------------------------------------------------------------- */
  /* Navigation                                                              */
  /* ---------------------------------------------------------------------- */

  const goPrev = () => {
    setMonthDate(
      (date) => new Date(date.getFullYear(), date.getMonth() - 1, 1),
    );
  };

  const goNext = () => {
    setMonthDate(
      (date) => new Date(date.getFullYear(), date.getMonth() + 1, 1),
    );
  };

  const goToday = () => {
    setMonthDate(new Date());
  };

  /* ---------------------------------------------------------------------- */
  /* Form                                                                    */
  /* ---------------------------------------------------------------------- */

  const resetForm = () => {
    setForm({
      title: "",
      type: "client_meeting",
      starts_at: "",
      ends_at: "",
      location: "",
      description: "",
    });
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!ownerKey) {
      toast.error("Unable to identify the current user");
      return;
    }

    if (!calendarUid) {
      toast.error("No Zoho Calendar is available");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Event title is required");
      return;
    }

    if (!form.starts_at) {
      toast.error("Start time is required");
      return;
    }

    const startDate = new Date(form.starts_at);

    const endDate = form.ends_at
      ? new Date(form.ends_at)
      : new Date(startDate.getTime() + 30 * 60 * 1000);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      toast.error("Please enter valid dates");
      return;
    }

    if (endDate <= startDate) {
      toast.error("End time must be after start time");
      return;
    }

    const selectedType = getEventType(form.type);

    const start = formatZohoDate(startDate);

    const end = formatZohoDate(endDate);

    if (!start || !end) {
      toast.error("Unable to format event date");
      return;
    }

    const eventData = {
      title: form.title.trim(),

      dateandtime: {
        timezone: TIMEZONE,
        start,
        end,
      },

      isallday: false,

      color: selectedType.zohoColor,

      ...(form.location.trim()
        ? {
            location: form.location.trim(),
          }
        : {}),

      ...(form.description.trim()
        ? {
            description: form.description.trim(),
          }
        : {}),
    };

    try {
      await createCalendarEvent({
        ownerKey,
        calendarUid,
        body: eventData,
      }).unwrap();

      toast.success("Event created successfully");

      resetForm();

      setShowForm(false);
    } catch (error) {
      console.error("Create Zoho Calendar event failed:", error);

      const message =
        error?.data?.message ||
        error?.data?.zohoResponse?.message ||
        error?.data?.zohoResponse?.error?.message ||
        error?.error ||
        "Unable to create event";

      toast.error(message);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <Shell
      label="Calendar"
      title="Team Calendar"
      subtitle="Plan meetings, site visits, deadlines and studio activities"
      action={
        <Btn
          onClick={() => setShowForm((value) => !value)}
          data-testid="new-event-btn"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}

          {showForm ? "Close" : "New Event"}
        </Btn>
      }
    >
      {/* ------------------------------------------------------------------ */}
      {/* Stats                                                               */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[24px] font-bold text-[#333333]">
                {monthEvents.length}
              </div>

              <div className="text-[11px] text-[#7A8586]">
                Events this month
              </div>
            </div>

            <div className="w-10 h-10 rounded-xl bg-[#EAF1EE] flex items-center justify-center">
              <CalendarDays size={18} className="text-[#1F453B]" />
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[24px] font-bold text-[#333333]">
                {clientMeetings.length}
              </div>

              <div className="text-[11px] text-[#7A8586]">Client meetings</div>
            </div>

            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock3 size={18} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[24px] font-bold text-[#333333]">
                {siteVisits.length}
              </div>

              <div className="text-[11px] text-[#7A8586]">Site visits</div>
            </div>

            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <MapPin size={18} className="text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[24px] font-bold text-[#333333]">
                {deadlines.length}
              </div>

              <div className="text-[11px] text-[#7A8586]">Deadlines</div>
            </div>

            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <CalendarDays size={18} className="text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Calendar selection                                                   */}
      {/* ------------------------------------------------------------------ */}

      {calendars.length > 1 && (
        <Card className="mb-5 !p-4">
          <div className="text-[11px] font-semibold text-[#7A8586] mb-1">
            Connected Zoho Calendar
          </div>

          <div className="text-[14px] font-semibold text-[#333333]">
            {getCalendarName(defaultCalendar)}
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Create form                                                         */}
      {/* ------------------------------------------------------------------ */}

      {showForm && (
        <Card className="mb-5 border-[#DCE5E1] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(31,69,59,0.08)] bg-[#FAFBFB]">
            <div className="text-[15px] font-semibold text-[#333333]">
              Create New Event
            </div>

            <div className="text-[12px] text-[#7A8586] mt-0.5">
              Add an event directly to your Zoho Calendar.
            </div>
          </div>

          <form onSubmit={submit} className="p-5">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Title */}

              <div className="md:col-span-2">
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Event Title
                </label>

                <Input
                  required
                  placeholder="e.g. Client presentation — Villa Project"
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value,
                    })
                  }
                />
              </div>

              {/* Type */}

              <div>
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Event Type
                </label>

                <select
                  className="bc-input h-10 w-full"
                  value={form.type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type: event.target.value,
                    })
                  }
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calendar */}

              <div>
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Calendar
                </label>

                <div className="h-10 flex items-center px-3 rounded-md border border-[#DCE3E1] bg-[#F8FAF9] text-[12px] text-[#526061]">
                  {getCalendarName(defaultCalendar)}
                </div>
              </div>

              {/* Start */}

              <div>
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Starts At
                </label>

                <Input
                  required
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      starts_at: event.target.value,
                    })
                  }
                />
              </div>

              {/* End */}

              <div>
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Ends At
                </label>

                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      ends_at: event.target.value,
                    })
                  }
                />
              </div>

              {/* Location */}

              <div className="md:col-span-2">
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Location
                </label>

                <Input
                  placeholder="Office, project site, client office…"
                  value={form.location}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      location: event.target.value,
                    })
                  }
                />
              </div>

              {/* Description */}

              <div className="md:col-span-2">
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Description
                </label>

                <textarea
                  className="bc-input min-h-[90px] w-full resize-y"
                  placeholder="Event description..."
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Buttons */}

            <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[rgba(31,69,59,0.08)]">
              <BtnGhost type="button" onClick={() => setShowForm(false)}>
                Cancel
              </BtnGhost>

              <Btn
                type="submit"
                disabled={creating || calendarsLoading || !calendarUid}
              >
                {creating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Create Event
                  </>
                )}
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Calendar                                                             */}
      {/* ------------------------------------------------------------------ */}

      <Card className="overflow-hidden !p-0">
        {/* Toolbar */}

        <div className="p-4 md:p-5 border-b border-[rgba(31,69,59,0.08)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-[18px] font-bold text-[#333333]">
                {monthLabel}
              </div>

              <div className="text-[12px] text-[#8A9697] mt-0.5">
                {monthEvents.length} scheduled event
                {monthEvents.length !== 1 ? "s" : ""}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BtnGhost onClick={goToday}>Today</BtnGhost>

              <div className="flex items-center border border-[#DCE3E1] rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={goPrev}
                  className="w-9 h-9 flex items-center justify-center hover:bg-[#F4F6F5] text-[#526061]"
                >
                  <ChevronLeft size={17} />
                </button>

                <div className="w-px h-5 bg-[#E2E7E5]" />

                <button
                  type="button"
                  onClick={goNext}
                  className="w-9 h-9 flex items-center justify-center hover:bg-[#F4F6F5] text-[#526061]"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}

        {!ownerKey || calendarsLoading || eventsLoading ? (
          <div className="py-20 flex items-center justify-center text-[#7A8586] text-[13px]">
            <Loader2 size={17} className="animate-spin mr-2" />
            Loading calendar…
          </div>
        ) : calendarsError || eventsError ? (
          <div className="py-20 text-center">
            <div className="text-[14px] font-semibold text-red-600">
              Unable to load Zoho Calendar
            </div>

            <div className="text-[12px] text-[#7A8586] mt-1">
              Please reconnect your Zoho account and try again.
            </div>
          </div>
        ) : !calendarUid ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <CalendarDays size={30} className="text-[#1F453B] mb-3" />

            <div className="text-[14px] font-semibold text-[#333333]">
              No Zoho Calendar found
            </div>

            <div className="text-[12px] text-[#7A8586] mt-1">
              Connect a Zoho Calendar account to continue.
            </div>
          </div>
        ) : (
          <>
            {/* Week header */}

            <div className="grid grid-cols-7 border-b border-[rgba(31,69,59,0.08)]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-[10px] uppercase tracking-wider font-bold text-[#8A9697] bg-[#FAFBFB]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}

            <div className="grid grid-cols-7 bg-[#E7ECEA] gap-px">
              {monthGrid.map((date, index) => {
                const iso = date ? makeDayKey(date) : null;

                const dayEvents = iso ? evByDay[iso] || [] : [];

                const todayCell = date && isSameDay(date, today);

                return (
                  <div
                    key={index}
                    className={`
                        bg-white
                        min-h-[110px]
                        md:min-h-[135px]
                        p-1.5
                        md:p-2
                        relative
                        ${!date ? "bg-[#F7F9F8]" : ""}
                      `}
                  >
                    {date && (
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className={`
                              w-7 h-7 flex items-center justify-center rounded-full
                              text-[12px] font-semibold
                              ${
                                todayCell
                                  ? "bg-[#1F453B] text-white"
                                  : "text-[#4D5A5B]"
                              }
                            `}
                        >
                          {date.getDate()}
                        </div>

                        {dayEvents.length > 0 && (
                          <span className="text-[9px] text-[#9AA5A5]">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      {dayEvents.slice(0, 4).map((event) => {
                        const type = getEventType(event.type);

                        return (
                          <div
                            key={event.id}
                            title={`${event.title} — ${formatTime(event.starts_at)}`}
                            className={`
                                    group
                                    rounded-md
                                    border
                                    px-1.5
                                    py-1
                                    cursor-pointer
                                    transition-all
                                    hover:shadow-sm
                                    ${type.color}
                                  `}
                          >
                            <div className="flex items-center gap-1">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${type.dot}`}
                              />

                              <span className="text-[9px] font-semibold truncate">
                                {event.isAllDay
                                  ? "All day"
                                  : formatTime(event.starts_at)}
                              </span>
                            </div>

                            <div className="text-[10px] font-medium truncate mt-0.5">
                              {event.title}
                            </div>
                          </div>
                        );
                      })}

                      {dayEvents.length > 4 && (
                        <div className="text-[9px] font-semibold text-[#7A8586] px-1">
                          +{dayEvents.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Legend */}

        <div className="px-4 py-3 border-t border-[rgba(31,69,59,0.08)] bg-[#FAFBFB]">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {EVENT_TYPES.map((type) => (
              <div
                key={type.value}
                className="flex items-center gap-1.5 text-[10px] text-[#7A8586]"
              >
                <span className={`w-2 h-2 rounded-full ${type.dot}`} />

                {type.label}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </Shell>
  );
}
