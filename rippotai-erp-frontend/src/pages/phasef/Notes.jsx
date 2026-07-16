import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pin, PinOff } from "lucide-react";
import {
  Shell,
  Card,
  Input,
  TextArea,
  Btn,
  BtnGhost,
  fmtDate,
  useProjects,
} from "../../components/Shared";

export function NotesAll() {
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
