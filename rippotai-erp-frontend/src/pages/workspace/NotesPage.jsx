// Notes: quick shared / private notes, optionally linked to a project or client.
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, StickyNote, Pin, Lock, Trash2 } from "lucide-react";
import {
  Page, PageHeader, Card, Button, Toolbar, ToolbarSpacer, SearchInput, Segmented, SelectInput, Pill, EmptyState,
  Field, TextInput, TextArea, ChoiceGroup,
} from "@/components/inos";
import { Modal } from "@/components/forms/commerce-form-ui";
import { useGetWsNotesQuery, useCreateWsNoteMutation, useUpdateWsNoteMutation, useDeleteWsNoteMutation } from "@/api/workspace/workspace.api";
import { ProjectPicker, ClientPicker, useProjectsList, useClientsList, relTime, Loading, Meta } from "./shared";

export const NOTE_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "meeting", label: "Meeting" },
  { value: "site", label: "Site" },
  { value: "design", label: "Design" },
  { value: "client", label: "Client" },
  { value: "idea", label: "Idea" },
];
const TONES = [
  { value: "mute", label: "Plain" },
  { value: "ok", label: "Mint" },
  { value: "warn", label: "Butter" },
  { value: "info", label: "Sky" },
  { value: "lilac", label: "Lilac" },
  { value: "peach", label: "Peach" },
];

export function NoteEditor({ note, defaults = {}, onClose }) {
  const editing = !!note?.id;
  const [f, setF] = useState(() => ({
    title: note?.title || "",
    body: note?.body || "",
    category: note?.category || defaults.category || "general",
    tone: note?.tone || "mute",
    project_id: note?.project_id ?? defaults.project_id ?? null,
    client_id: note?.client_id ?? defaults.client_id ?? null,
    pinned: !!note?.pinned,
    is_shared: note ? !!note.is_shared : true,
  }));
  const [err, setErr] = useState("");
  const [createNote, { isLoading: c }] = useCreateWsNoteMutation();
  const [updateNote, { isLoading: u }] = useUpdateWsNoteMutation();
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }));

  const save = async () => {
    if (!f.title.trim()) return setErr("Give the note a title.");
    try {
      if (editing) await updateNote({ id: note.id, ...f, title: f.title.trim() }).unwrap();
      else await createNote({ ...f, title: f.title.trim() }).unwrap();
      toast.success(editing ? "Note saved" : "Note added");
      onClose(true);
    } catch (e) {
      toast.error(e?.data?.message || "Couldn't save the note");
    }
  };

  return (
    <Modal
      title={editing ? "Edit note" : "New note"}
      subtitle="Notes are visible to the team unless you make them private."
      onClose={() => onClose(false)}
      size="lg"
      testId="note-modal"
      footer={
        <>
          <Button variant="ghost" onClick={() => onClose(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={c || u} data-testid="note-save">{editing ? "Save note" : "Add note"}</Button>
        </>
      }
    >
      <form className="inos-modal-body" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="Title" required error={err}>
          <TextInput autoFocus value={f.title} onChange={(e) => { setErr(""); set("title")(e); }} placeholder="e.g. Client call — kitchen finishes" invalid={!!err} data-testid="note-title" />
        </Field>
        <Field label="Note" optional>
          <TextArea rows={7} value={f.body} onChange={set("body")} placeholder="Write freely — decisions, measurements, follow-ups…" data-testid="note-body" />
        </Field>
        <Field label="Category">
          <ChoiceGroup name="Category" value={f.category} onChange={set("category")} options={NOTE_CATEGORIES} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Project" optional><ProjectPicker value={f.project_id} onChange={set("project_id")} /></Field>
          <Field label="Client" optional><ClientPicker value={f.client_id} onChange={set("client_id")} /></Field>
        </div>
        <Field label="Colour">
          <ChoiceGroup name="Colour" value={f.tone} onChange={set("tone")} options={TONES} />
        </Field>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: "var(--fs-body)" }}>
            <input type="checkbox" checked={f.pinned} onChange={(e) => set("pinned")(e.target.checked)} /> Pin to top
          </label>
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: "var(--fs-body)" }}>
            <input type="checkbox" checked={!f.is_shared} onChange={(e) => set("is_shared")(!e.target.checked)} /> Private (only me)
          </label>
        </div>
      </form>
    </Modal>
  );
}

export function NoteCard({ note, onOpen, onPin, onDelete, projectName, clientName }) {
  const tone = note.tone && note.tone !== "mute" ? note.tone : null;
  return (
    <div
      onClick={() => onOpen(note)}
      data-testid="note-card"
      style={{
        background: tone ? `var(--${tone}-bg)` : "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)",
        padding: 16, display: "flex", flexDirection: "column", gap: 8, cursor: "pointer", minHeight: 150, boxShadow: "var(--shadow-xs)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontWeight: 650, fontSize: "var(--fs-h3)", color: "var(--text)", flex: 1, lineHeight: 1.3 }}>{note.title}</div>
        {!note.is_shared && <Lock size={14} color="var(--text-3)" aria-label="Private" />}
        {onPin && (
          <button type="button" className="inos-btn inos-btn--ghost inos-btn--sm inos-btn--icon" title={note.pinned ? "Unpin" : "Pin"} onClick={(e) => { e.stopPropagation(); onPin(note); }}>
            <Pin size={14} fill={note.pinned ? "currentColor" : "none"} color={note.pinned ? "var(--brand)" : "var(--text-3)"} />
          </button>
        )}
      </div>
      {note.body && (
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-2)", whiteSpace: "pre-wrap", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", lineHeight: 1.55 }}>
          {note.body}
        </div>
      )}
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <Pill size="sm" dot={false}>{NOTE_CATEGORIES.find((c) => c.value === note.category)?.label || note.category}</Pill>
        {projectName && <Pill size="sm" tone="brand" dot={false}>{projectName}</Pill>}
        {clientName && <Pill size="sm" tone="lilac" dot={false}>{clientName}</Pill>}
        <Meta style={{ marginLeft: "auto" }}>{relTime(note.updated_at)}</Meta>
        {onDelete && (
          <button type="button" className="inos-btn inos-btn--ghost inos-btn--sm inos-btn--icon" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(note); }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function NotesPage() {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("all");
  const [category, setCategory] = useState("");
  const [project, setProject] = useState("");
  const [editing, setEditing] = useState(null);
  const { data, isLoading, isError, refetch } = useGetWsNotesQuery({ scope: scope === "mine" ? "mine" : undefined, category: category || undefined, project_id: project || undefined });
  const [updateNote] = useUpdateWsNoteMutation();
  const [deleteNote] = useDeleteWsNoteMutation();
  const { projects } = useProjectsList();
  const { clients } = useClientsList();
  const pName = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.name])), [projects]);
  const cName = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.name])), [clients]);

  const notes = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = Array.isArray(data) ? data : [];
    return s ? list.filter((n) => `${n.title} ${n.body || ""}`.toLowerCase().includes(s)) : list;
  }, [data, q]);

  const pin = async (n) => {
    try { await updateNote({ id: n.id, pinned: !n.pinned }).unwrap(); } catch { toast.error("Couldn't update"); }
  };
  const remove = async (n) => {
    if (!window.confirm(`Delete “${n.title}”?`)) return;
    try { await deleteNote(n.id).unwrap(); toast.success("Note deleted"); } catch { toast.error("Couldn't delete"); }
  };

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Tasks", to: "/tasks" }, { label: "Notes" }]}
        title="Notes"
        subtitle="Meeting notes, site measurements and ideas — linked to the project or client they belong to."
        actions={<Button variant="primary" icon={Plus} onClick={() => setEditing({})} data-testid="new-note">New note</Button>}
      />
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Search notes" />
        <SelectInput value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 160 }} aria-label="Category">
          <option value="">All categories</option>
          {NOTE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </SelectInput>
        <SelectInput value={project} onChange={(e) => setProject(e.target.value)} style={{ width: 200 }} aria-label="Project">
          <option value="">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectInput>
        <ToolbarSpacer />
        <Segmented value={scope} onChange={setScope} options={[{ value: "all", label: "Team" }, { value: "mine", label: "Mine" }]} />
      </Toolbar>

      {isLoading ? (
        <Card><Loading /></Card>
      ) : isError ? (
        <Card><EmptyState icon={StickyNote} title="Couldn't load notes" action={<Button onClick={refetch}>Retry</Button>} /></Card>
      ) : !notes.length ? (
        <Card>
          <EmptyState
            icon={StickyNote}
            title={q || category || project ? "No notes match" : "No notes yet"}
            text="Capture a quick thought, a client call or site measurements."
            action={<Button variant="primary" icon={Plus} onClick={() => setEditing({})}>New note</Button>}
          />
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} onOpen={setEditing} onPin={pin} onDelete={remove} projectName={pName[n.project_id]} clientName={cName[n.client_id]} />
          ))}
        </div>
      )}
      {editing && <NoteEditor note={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </Page>
  );
}
