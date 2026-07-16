import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import {
  Shell,
  Card,
  Input,
  Btn,
  BtnGhost,
  fmtDT,
  useProjects,
} from "../../components/Shared";

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
