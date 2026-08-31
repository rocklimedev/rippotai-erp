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
  FolderKanban,
  X,
  Check,
} from "lucide-react";

import {
  Shell,
  Card,
  Input,
  Btn,
  BtnGhost,
  fmtDT,
  useProjects,
} from "../../components/Shared";

import {
  useGetMyCalendarEventsQuery,
  useGetCalendarEventsQuery,
  useCreateCalendarEventMutation,
} from "../../api/calendar.api";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const EVENT_TYPES = [
  {
    value: "client_meeting",
    label: "Client Meeting",
    color: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-500",
  },
  {
    value: "site_visit",
    label: "Site Visit",
    color: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
  },
  {
    value: "vendor_call",
    label: "Vendor Call",
    color: "bg-purple-50 text-purple-700 border-purple-100",
    dot: "bg-purple-500",
  },
  {
    value: "internal_meeting",
    label: "Internal Meeting",
    color: "bg-slate-50 text-slate-700 border-slate-100",
    dot: "bg-slate-500",
  },
  {
    value: "presentation",
    label: "Presentation",
    color: "bg-pink-50 text-pink-700 border-pink-100",
    dot: "bg-pink-500",
  },
  {
    value: "milestone_due",
    label: "Milestone Due",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  {
    value: "quotation_deadline",
    label: "Quotation Deadline",
    color: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-500",
  },
  {
    value: "handover",
    label: "Handover",
    color: "bg-cyan-50 text-cyan-700 border-cyan-100",
    dot: "bg-cyan-500",
  },
  {
    value: "personal",
    label: "Personal",
    color: "bg-gray-50 text-gray-700 border-gray-100",
    dot: "bg-gray-500",
  },
];

const getEventType = (type) =>
  EVENT_TYPES.find((item) => item.value === type) || EVENT_TYPES[0];

const formatTime = (date) =>
  new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/* -------------------------------------------------------------------------- */
/* My Calendar                                                                */
/* -------------------------------------------------------------------------- */

export function CalendarMine() {
  const { data: events = [], isLoading: busy } = useGetMyCalendarEventsQuery();

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
      {/* Summary strip */}
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
              <div className="text-[11px] text-[#6B7B7C]">Total Events</div>
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
                {
                  events.filter((e) => new Date(e.starts_at) >= new Date())
                    .length
                }
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
                {events.filter((e) => e.type === "site_visit").length}
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
                {events.filter((e) => e.type === "quotation_deadline").length}
              </div>
              <div className="text-[11px] text-[#6B7B7C]">Deadlines</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {busy ? (
          <div className="flex items-center justify-center py-16 text-[#6B7B7C] text-[13px]">
            <Loader2 size={17} className="animate-spin mr-2" />
            Loading your calendar…
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-[#F1F4F3] flex items-center justify-center mb-4">
              <CalendarDays size={25} className="text-[#1F453B]" />
            </div>

            <div className="text-[15px] font-semibold text-[#333333]">
              Your calendar is empty
            </div>

            <div className="text-[12.5px] text-[#8A9697] mt-1 mb-5">
              Meetings and events you attend will appear here.
            </div>

            <Btn onClick={() => window.location.assign("/calendar/team")}>
              <Plus size={14} />
              Create Event
            </Btn>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(31,69,59,0.08)]">
            {events.map((e) => {
              const type = getEventType(e.type);

              return (
                <div
                  key={e.id}
                  className="p-4 md:p-5 hover:bg-[#FAFBFB] transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Date */}
                    <div className="w-16 shrink-0 text-center">
                      <div className="text-[10px] uppercase font-semibold tracking-wider text-[#9AA5A5]">
                        {new Date(e.starts_at).toLocaleDateString("en-IN", {
                          month: "short",
                        })}
                      </div>

                      <div className="text-[32px] font-bold leading-none text-[#1F453B] mt-1">
                        {new Date(e.starts_at).getDate()}
                      </div>

                      <div className="text-[10px] text-[#8A9697] mt-1">
                        {new Date(e.starts_at).toLocaleDateString("en-IN", {
                          weekday: "short",
                        })}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[15px] font-semibold text-[#333333] truncate">
                            {e.title}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12px] text-[#7A8586]">
                            <span className="inline-flex items-center gap-1">
                              <Clock3 size={12} />
                              {formatTime(e.starts_at)}
                            </span>

                            {e.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={12} />
                                {e.location}
                              </span>
                            )}

                            {e.project_name && (
                              <span className="inline-flex items-center gap-1">
                                <FolderKanban size={12} />
                                {e.project_name}
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
  const projects = useProjects();

  const { data: events = [], isLoading: loading } = useGetCalendarEventsQuery({
    limit: 300,
  });

  const [createCalendarEvent, { isLoading: creating }] =
    useCreateCalendarEventMutation();

  const [monthDate, setMonthDate] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    type: "client_meeting",
    starts_at: "",
    ends_at: "",
    project_id: "",
    location: "",
  });

  const today = new Date();

  /* ---------------------------------------------------------------------- */
  /* Month Grid                                                             */
  /* ---------------------------------------------------------------------- */

  const monthGrid = useMemo(() => {
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();

    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const arr = [];

    for (let i = 0; i < firstDay; i++) {
      arr.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(new Date(y, m, d));
    }

    while (arr.length % 7 !== 0) {
      arr.push(null);
    }

    return arr;
  }, [monthDate]);

  /* ---------------------------------------------------------------------- */
  /* Events by Day                                                          */
  /* ---------------------------------------------------------------------- */

  const evByDay = useMemo(() => {
    const map = {};

    for (const e of events) {
      if (!e.starts_at) continue;

      const date = new Date(e.starts_at);

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      if (!map[key]) map[key] = [];

      map[key].push(e);
    }

    Object.values(map).forEach((items) => {
      items.sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      );
    });

    return map;
  }, [events]);

  /* ---------------------------------------------------------------------- */
  /* Stats                                                                   */
  /* ---------------------------------------------------------------------- */

  const monthEvents = useMemo(() => {
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();

    return events.filter((e) => {
      const d = new Date(e.starts_at);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [events, monthDate]);

  const monthLabel = monthDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                 */
  /* ---------------------------------------------------------------------- */

  const goPrev = () => {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goNext = () => {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const goToday = () => {
    setMonthDate(new Date());
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.starts_at) {
      toast.error("Title and start time are required");
      return;
    }

    if (form.ends_at && new Date(form.ends_at) < new Date(form.starts_at)) {
      toast.error("End time cannot be before start time");
      return;
    }

    try {
      await createCalendarEvent({
        ...form,
        ends_at: form.ends_at || form.starts_at,
      }).unwrap();

      toast.success("Event created successfully");

      setForm({
        title: "",
        type: "client_meeting",
        starts_at: "",
        ends_at: "",
        project_id: "",
        location: "",
      });

      setShowForm(false);
    } catch (error) {
      toast.error(error?.data?.message || "Unable to create event");
    }
  };

  return (
    <Shell
      label="Calendar"
      title="Team Calendar"
      subtitle="Plan meetings, site visits, deadlines and studio activities"
      action={
        <Btn onClick={() => setShowForm((s) => !s)} data-testid="new-event-btn">
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Close" : "New Event"}
        </Btn>
      }
    >
      {/* ------------------------------------------------------------------ */}
      {/* Top Stats                                                          */}
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
                {monthEvents.filter((e) => e.type === "client_meeting").length}
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
                {monthEvents.filter((e) => e.type === "site_visit").length}
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
                {
                  monthEvents.filter(
                    (e) =>
                      e.type === "quotation_deadline" ||
                      e.type === "milestone_due",
                  ).length
                }
              </div>
              <div className="text-[11px] text-[#7A8586]">Deadlines</div>
            </div>

            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Check size={18} className="text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Create Event Form                                                   */}
      {/* ------------------------------------------------------------------ */}

      {showForm && (
        <Card className="mb-5 border-[#DCE5E1] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(31,69,59,0.08)] bg-[#FAFBFB]">
            <div className="text-[15px] font-semibold text-[#333333]">
              Create New Event
            </div>

            <div className="text-[12px] text-[#7A8586] mt-0.5">
              Add an event to the team calendar.
            </div>
          </div>

          <form onSubmit={submit} className="p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Event Title
                </label>

                <Input
                  required
                  placeholder="e.g. Client presentation — Villa Project"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Event Type
                </label>

                <select
                  className="bc-input h-10 w-full"
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
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

              <div>
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Project
                </label>

                <select
                  className="bc-input h-10 w-full"
                  value={form.project_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      project_id: e.target.value,
                    })
                  }
                >
                  <option value="">General / No Project</option>

                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Starts At
                </label>

                <Input
                  required
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      starts_at: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Ends At
                </label>

                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ends_at: e.target.value,
                    })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[12px] font-semibold text-[#4D5A5B] mb-1.5 block">
                  Location
                </label>

                <Input
                  placeholder="Office, project site, Zoom, client office…"
                  value={form.location}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      location: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[rgba(31,69,59,0.08)]">
              <BtnGhost type="button" onClick={() => setShowForm(false)}>
                Cancel
              </BtnGhost>

              <Btn type="submit" disabled={creating}>
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
      {/* Calendar                                                            */}
      {/* ------------------------------------------------------------------ */}

      <Card className="overflow-hidden !p-0">
        {/* Calendar toolbar */}
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
        {loading ? (
          <div className="py-20 flex items-center justify-center text-[#7A8586] text-[13px]">
            <Loader2 size={17} className="animate-spin mr-2" />
            Loading calendar…
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
              {monthGrid.map((d, i) => {
                const iso = d
                  ? [
                      d.getFullYear(),
                      String(d.getMonth() + 1).padStart(2, "0"),
                      String(d.getDate()).padStart(2, "0"),
                    ].join("-")
                  : null;

                const evs = iso ? evByDay[iso] || [] : [];

                const todayCell = d && isSameDay(d, today);

                return (
                  <div
                    key={i}
                    className={`
                      bg-white
                      min-h-[110px]
                      md:min-h-[135px]
                      p-1.5
                      md:p-2
                      relative
                      ${!d ? "bg-[#F7F9F8]" : ""}
                    `}
                  >
                    {d && (
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
                          {d.getDate()}
                        </div>

                        {evs.length > 0 && (
                          <span className="text-[9px] text-[#9AA5A5]">
                            {evs.length}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      {evs.slice(0, 4).map((e) => {
                        const type = getEventType(e.type);

                        return (
                          <div
                            key={e.id}
                            title={`${e.title} — ${formatTime(e.starts_at)}`}
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
                                {formatTime(e.starts_at)}
                              </span>
                            </div>

                            <div className="text-[10px] font-medium truncate mt-0.5">
                              {e.title}
                            </div>
                          </div>
                        );
                      })}

                      {evs.length > 4 && (
                        <div className="text-[9px] font-semibold text-[#7A8586] px-1">
                          +{evs.length - 4} more
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
            {EVENT_TYPES.slice(0, 6).map((type) => (
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
