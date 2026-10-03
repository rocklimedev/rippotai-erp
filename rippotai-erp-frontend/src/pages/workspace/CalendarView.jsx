// Calendar: month / week / agenda over INOS events + task due dates, milestones, payment dues,
// quotation expiries and site visits. /calendar (team), /calendar/mine, /calendar/team
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, MapPin, Trash2, Pencil, ExternalLink } from "lucide-react";
import {
  Page, PageHeader, Card, Button, Toolbar, ToolbarSpacer, Segmented, Tabs, Pill, EmptyState,
  Field, TextInput, TextArea, SelectInput, ChoiceGroup,
} from "@/components/inos";
import { Modal } from "@/components/forms/commerce-form-ui";
import { useGetWsCalendarFeedQuery, useCreateWsEventMutation, useUpdateWsEventMutation, useDeleteWsEventMutation } from "@/api/workspace/workspace.api";
import { ProjectPicker, useUsersList, ymd, fmtDate, fmtTime, Loading, Meta } from "./shared";

export const EVENT_TYPES = [
  { value: "client_meeting", label: "Client meeting", tone: "brand" },
  { value: "internal_meeting", label: "Internal meeting", tone: "info" },
  { value: "site_visit", label: "Site visit", tone: "ok" },
  { value: "presentation", label: "Presentation", tone: "lilac" },
  { value: "vendor_call", label: "Vendor call", tone: "peach" },
  { value: "handover", label: "Handover", tone: "warn" },
  { value: "personal", label: "Personal", tone: "mute" },
];
const SOURCES = {
  event: { label: "Events", tone: "brand" },
  task: { label: "Task due", tone: "info" },
  milestone: { label: "Milestones", tone: "lilac" },
  payment: { label: "Payments due", tone: "warn" },
  quotation: { label: "Quote expiry", tone: "peach" },
  site_visit: { label: "Site visits", tone: "ok" },
};
const toneOf = (it) => (it.source === "event" ? EVENT_TYPES.find((t) => t.value === it.kind)?.tone || "info" : SOURCES[it.source]?.tone || "mute");
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const startOfWeek = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const sameDay = (a, b) => ymd(a) === ymd(b);

function Chip({ it, onClick, wide }) {
  const tone = toneOf(it);
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(it); }}
      title={it.title}
      data-testid="cal-item"
      style={{
        display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left", border: 0, cursor: "pointer",
        background: `var(--${tone === "brand" ? "brand-50" : `${tone}-bg`})`, color: tone === "brand" ? "var(--brand)" : `var(--${tone}-fg)`,
        borderRadius: 6, padding: wide ? "6px 8px" : "2px 6px", fontSize: 12, fontWeight: 600, lineHeight: 1.35,
        textDecoration: it.status === "completed" || it.status === "COMPLETED" ? "line-through" : "none",
      }}
    >
      {!it.all_day && it.source === "event" && <span style={{ fontWeight: 500, opacity: 0.8, flexShrink: 0 }}>{fmtTime(it.date)}</span>}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: wide ? "normal" : "nowrap" }}>{it.title}</span>
    </button>
  );
}

function EventModal({ initial, onClose }) {
  const editing = !!initial?.id;
  const { users } = useUsersList();
  const d0 = initial?.date ? new Date(initial.date) : new Date();
  const [f, setF] = useState(() => ({
    title: initial?.title || "",
    type: initial?.kind || "client_meeting",
    date: ymd(d0),
    start: initial?.id && !initial.all_day ? d0.toTimeString().slice(0, 5) : "11:00",
    end: initial?.end ? new Date(initial.end).toTimeString().slice(0, 5) : "12:00",
    all_day: !!initial?.all_day,
    project_id: initial?.project_id || null,
    location: initial?.location || "",
    description: initial?.description || "",
    attendees: Array.isArray(initial?.attendees) ? initial.attendees : [],
  }));
  const [errors, setErrors] = useState({});
  const [createEvent, { isLoading: c }] = useCreateWsEventMutation();
  const [updateEvent, { isLoading: u }] = useUpdateWsEventMutation();
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }));

  const save = async () => {
    const e = {};
    if (!f.title.trim()) e.title = "Add a title.";
    if (!f.date) e.date = "Pick a date.";
    if (!f.all_day && f.end && f.start && f.end <= f.start) e.end = "End must be after start.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const starts = f.all_day ? new Date(`${f.date}T00:00:00`) : new Date(`${f.date}T${f.start}:00`);
    const ends = f.all_day ? new Date(`${f.date}T23:59:00`) : f.end ? new Date(`${f.date}T${f.end}:00`) : null;
    const body = {
      title: f.title.trim(), type: f.type, starts_at: starts.toISOString(), ends_at: ends ? ends.toISOString() : undefined,
      all_day: f.all_day, project_id: f.project_id || null, location: f.location || undefined,
      description: f.description || undefined, attendees: f.attendees,
    };
    try {
      if (editing) await updateEvent({ id: initial.id, ...body }).unwrap();
      else await createEvent(body).unwrap();
      toast.success(editing ? "Event updated" : "Event added");
      onClose();
    } catch (err) {
      const m = err?.data?.message;
      toast.error(Array.isArray(m) ? m.join(", ") : m || "Couldn't save the event");
    }
  };

  const toggleAttendee = (email) =>
    setF((s) => ({ ...s, attendees: s.attendees.includes(email) ? s.attendees.filter((x) => x !== email) : [...s.attendees, email] }));

  return (
    <Modal
      title={editing ? "Edit event" : "New event"}
      onClose={onClose}
      size="lg"
      testId="event-modal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={c || u} data-testid="event-save">{editing ? "Save event" : "Add event"}</Button>
        </>
      }
    >
      <form className="inos-modal-body" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="Title" required error={errors.title}>
          <TextInput autoFocus value={f.title} onChange={set("title")} placeholder="e.g. Material selection with Mrs Sagar" invalid={!!errors.title} data-testid="event-title" />
        </Field>
        <Field label="Type">
          <ChoiceGroup name="Type" value={f.type} onChange={set("type")} options={EVENT_TYPES} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 16 }}>
          <Field label="Date" required error={errors.date}><TextInput type="date" value={f.date} onChange={set("date")} data-testid="event-date" /></Field>
          <Field label="Starts"><TextInput type="time" value={f.start} onChange={set("start")} disabled={f.all_day} /></Field>
          <Field label="Ends" error={errors.end}><TextInput type="time" value={f.end} onChange={set("end")} disabled={f.all_day} invalid={!!errors.end} /></Field>
        </div>
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: "var(--fs-body)" }}>
          <input type="checkbox" checked={f.all_day} onChange={(e) => set("all_day")(e.target.checked)} /> All day
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Project" optional><ProjectPicker value={f.project_id} onChange={set("project_id")} /></Field>
          <Field label="Location" optional><TextInput value={f.location} onChange={set("location")} placeholder="Site, studio or meeting link" /></Field>
        </div>
        <Field label="People" optional hint="They'll see it on My calendar.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {users.map((usr) => {
              const on = f.attendees.includes(usr.email);
              return (
                <button key={usr.id} type="button" onClick={() => toggleAttendee(usr.email)} className="inos-choice" aria-checked={on} role="checkbox" style={{ minHeight: 32, padding: "4px 10px" }}>
                  {usr.name}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Notes" optional>
          <TextArea rows={3} value={f.description} onChange={set("description")} placeholder="Agenda, things to bring…" />
        </Field>
      </form>
    </Modal>
  );
}

function ItemModal({ it, onClose, onEdit }) {
  const navigate = useNavigate();
  const [del, { isLoading }] = useDeleteWsEventMutation();
  const src = SOURCES[it.source];
  const typeLabel = it.source === "event" ? EVENT_TYPES.find((t) => t.value === it.kind)?.label || it.kind : src?.label;
  const link =
    it.source === "task" ? `/tasks/${it.id}` :
    it.source === "quotation" ? `/procurement/estimates/${it.id}` :
    it.source === "site_visit" ? "/site-operations/visit-assignments" :
    it.project_id ? `/projects/${it.project_id}` : null;
  const remove = async () => {
    if (!window.confirm("Delete this event?")) return;
    try { await del(it.id).unwrap(); toast.success("Event deleted"); onClose(); } catch { toast.error("Couldn't delete"); }
  };
  return (
    <Modal
      title={it.title}
      subtitle={typeLabel}
      onClose={onClose}
      testId="item-modal"
      footer={
        <>
          {it.source === "event" && <Button variant="ghost" icon={Trash2} onClick={remove} loading={isLoading}>Delete</Button>}
          {link && <Button icon={ExternalLink} onClick={() => navigate(link)}>Open {it.source === "task" ? "task" : it.source === "quotation" ? "quotation" : it.source === "site_visit" ? "site visits" : "project"}</Button>}
          {it.source === "event" && <Button variant="primary" icon={Pencil} onClick={() => onEdit(it)}>Edit</Button>}
        </>
      }
    >
      <dl className="inos-kv">
        <dt>When</dt>
        <dd>{fmtDate(it.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}{!it.all_day && it.source === "event" ? `, ${fmtTime(it.date)}${it.end ? ` – ${fmtTime(it.end)}` : ""}` : ""}</dd>
        {it.project_name && (<><dt>Project</dt><dd>{it.project_name}</dd></>)}
        {it.location && (<><dt>Location</dt><dd><MapPin size={13} style={{ verticalAlign: -2 }} /> {it.location}</dd></>)}
        {it.status && (<><dt>Status</dt><dd><Pill tone={toneOf(it)}>{String(it.status).replace(/_/g, " ").toLowerCase()}</Pill></dd></>)}
        {it.assignee_name && (<><dt>Assignee</dt><dd>{it.assignee_name}</dd></>)}
        {it.amount && (<><dt>Amount</dt><dd>₹{Number(it.amount).toLocaleString("en-IN")}</dd></>)}
        {Array.isArray(it.attendees) && it.attendees.length > 0 && (<><dt>People</dt><dd>{it.attendees.join(", ")}</dd></>)}
        {it.description && (<><dt>Notes</dt><dd style={{ whiteSpace: "pre-wrap", fontWeight: 400 }}>{it.description}</dd></>)}
      </dl>
    </Modal>
  );
}

export default function CalendarView({ scope = "team" }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [hidden, setHidden] = useState(() => new Set());
  const [creating, setCreating] = useState(null);
  const [viewing, setViewing] = useState(null);
  const mine = scope === "mine";

  const range = useMemo(() => {
    if (mode === "week") {
      const s = startOfWeek(cursor);
      return { start: s, end: addDays(s, 6), days: [...Array(7)].map((_, i) => addDays(s, i)) };
    }
    if (mode === "agenda") {
      const s = new Date(cursor); s.setHours(0, 0, 0, 0);
      return { start: s, end: addDays(s, 30), days: [] };
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const s = startOfWeek(first);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const weeks = Math.ceil(((last - s) / 86400000 + 1) / 7);
    return { start: s, end: addDays(s, weeks * 7 - 1), days: [...Array(weeks * 7)].map((_, i) => addDays(s, i)) };
  }, [mode, cursor]);

  const { data, isLoading, isFetching, isError, refetch } = useGetWsCalendarFeedQuery({
    from: `${ymd(range.start)}T00:00:00`, to: `${ymd(range.end)}T23:59:59`, mine,
  });
  const items = useMemo(() => (data?.items || []).filter((it) => !hidden.has(it.source)), [data, hidden]);
  const byDay = useMemo(() => {
    const m = {};
    for (const it of items) (m[ymd(it.date)] ||= []).push(it);
    for (const k in m) m[k].sort((a, b) => (a.source === "event" ? 0 : 1) - (b.source === "event" ? 0 : 1) || new Date(a.date) - new Date(b.date));
    return m;
  }, [items]);
  const counts = useMemo(() => {
    const c = {};
    for (const it of data?.items || []) c[it.source] = (c[it.source] || 0) + 1;
    return c;
  }, [data]);

  const step = (n) => {
    const d = new Date(cursor);
    if (mode === "month") d.setMonth(d.getMonth() + n);
    else if (mode === "week") d.setDate(d.getDate() + 7 * n);
    else d.setDate(d.getDate() + 30 * n);
    setCursor(d);
  };
  const label =
    mode === "month" ? cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) :
    `${fmtDate(range.start, { day: "numeric", month: "short" })} – ${fmtDate(range.end, { day: "numeric", month: "short", year: "numeric" })}`;
  const today = new Date();

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Calendar", to: "/calendar" }, { label: mine ? "My calendar" : "Team calendar" }]}
        title={mine ? "My calendar" : "Team calendar"}
        subtitle={mine ? "Your meetings and the tasks due on you." : "Meetings, site visits, task deadlines, milestones and payment dues across the studio."}
        actions={<Button variant="primary" icon={Plus} onClick={() => setCreating({ date: new Date() })} data-testid="new-event">New event</Button>}
      />
      <Tabs value={scope} onChange={(v) => navigate(v === "mine" ? "/calendar/mine" : "/calendar/team")} options={[{ value: "team", label: "Team calendar" }, { value: "mine", label: "My calendar" }]} />
      <Toolbar>
        <Button icon={ChevronLeft} onClick={() => step(-1)} aria-label="Previous" />
        <Button onClick={() => setCursor(new Date())}>Today</Button>
        <Button icon={ChevronRight} onClick={() => step(1)} aria-label="Next" />
        <h2 className="inos-section-title" style={{ margin: "0 8px", minWidth: 180 }} data-testid="cal-label">{label}</h2>
        {isFetching && !isLoading && <Meta>Updating…</Meta>}
        <ToolbarSpacer />
        <Segmented value={mode} onChange={setMode} options={[{ value: "month", label: "Month" }, { value: "week", label: "Week" }, { value: "agenda", label: "Agenda" }]} />
      </Toolbar>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Meta>Show:</Meta>
        {Object.entries(SOURCES).filter(([k]) => !mine || k === "event" || k === "task").map(([k, s]) => {
          const off = hidden.has(k);
          return (
            <button key={k} type="button" onClick={() => setHidden((h) => { const n = new Set(h); off ? n.delete(k) : n.add(k); return n; })} style={{ border: 0, background: "none", padding: 0, cursor: "pointer", opacity: off ? 0.45 : 1 }} aria-pressed={!off}>
              <Pill tone={s.tone}>{s.label} {counts[k] ? `(${counts[k]})` : ""}</Pill>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <Card><Loading /></Card>
      ) : isError ? (
        <Card><EmptyState icon={CalendarDays} title="Couldn't load the calendar" action={<Button onClick={refetch}>Retry</Button>} /></Card>
      ) : mode === "agenda" ? (
        <Card flush>
          {!items.length ? (
            <EmptyState icon={CalendarDays} title="Nothing in the next 30 days" text="Add a meeting or site visit to plan the month." action={<Button variant="primary" icon={Plus} onClick={() => setCreating({ date: new Date() })}>New event</Button>} />
          ) : (
            Object.keys(byDay).sort().map((k) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, padding: "14px 20px", borderTop: "1px solid var(--line)" }}>
                <div>
                  <div style={{ fontWeight: 650 }}>{fmtDate(k, { weekday: "long" })}</div>
                  <Meta>{fmtDate(k, { day: "numeric", month: "long" })}</Meta>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {byDay[k].map((it) => (
                    <div key={it.key} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ flex: 1 }}><Chip it={it} onClick={setViewing} wide /></div>
                      <Meta style={{ width: 200, textAlign: "right" }}>{it.project_name || ""}</Meta>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </Card>
      ) : (
        <Card flush>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
            {WEEKDAYS.map((w) => (
              <div key={w} className="inos-eyebrow" style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>{w}</div>
            ))}
            {range.days.map((d, i) => {
              const k = ymd(d);
              const list = byDay[k] || [];
              const outside = mode === "month" && d.getMonth() !== cursor.getMonth();
              const isToday = sameDay(d, today);
              const max = mode === "week" ? 12 : 3;
              return (
                <div
                  key={k}
                  onClick={() => setCreating({ date: new Date(`${k}T11:00:00`) })}
                  data-testid={`cal-day-${k}`}
                  style={{
                    minHeight: mode === "week" ? 420 : 118, padding: 8, cursor: "pointer",
                    borderRight: (i + 1) % 7 ? "1px solid var(--line)" : "none", borderBottom: "1px solid var(--line)",
                    background: outside ? "var(--surface-2)" : "var(--surface)", display: "flex", flexDirection: "column", gap: 4,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 12.5, fontWeight: 650, width: 24, height: 24, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: isToday ? "var(--brand)" : "transparent", color: isToday ? "#fff" : outside ? "var(--text-3)" : "var(--text)",
                    }}>{d.getDate()}</span>
                    {mode === "week" && <Meta>{fmtDate(d, { month: "short" })}</Meta>}
                  </div>
                  {list.slice(0, max).map((it) => <Chip key={it.key} it={it} onClick={setViewing} wide={mode === "week"} />)}
                  {list.length > max && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setCursor(d); setMode(mode === "month" ? "week" : "agenda"); }} style={{ border: 0, background: "none", textAlign: "left", fontSize: 12, color: "var(--text-2)", cursor: "pointer", padding: "0 6px" }}>
                      +{list.length - max} more
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
      {creating && <EventModal initial={creating} onClose={() => setCreating(null)} />}
      {viewing && <ItemModal it={viewing} onClose={() => setViewing(null)} onEdit={(it) => { setViewing(null); setCreating(it); }} />}
    </Page>
  );
}
