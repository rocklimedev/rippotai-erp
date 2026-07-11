import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Save,
  Upload,
  FileText,
  Clock,
  Eye,
  Download,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
} from "lucide-react";

// Download helper — MUST use axios (with JWT header) rather than <a href> which
// hits the endpoint anonymously and gets 401 + JSON body that fails to open.
export async function downloadDocument(docId, filename) {
  try {
    const res = await api.get(`/documents/${docId}/download`, {
      responseType: "blob",
    });
    const mime = res.headers?.["content-type"] || "application/octet-stream";
    const url = URL.createObjectURL(new Blob([res.data], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `document-${docId}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  } catch (e) {
    toast.error("Download failed");
  }
}

const Shell = ({ title, subtitle, action, children }) => (
  <div className="space-y-5">
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5 font-semibold">
          Documents
        </div>
        <h1
          className="text-[34px] font-bold text-[#333333]"
          style={{ fontFamily: "Poppins" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] text-[#6B7B7C] mt-1">{subtitle}</p>
        )}
      </div>
      {action}
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

const CATEGORIES = [
  "Agreements",
  "Pitch",
  "Scope of Work",
  "Time and Cost",
  "Project Brief",
  "Site Reki",
  "BOQs",
  "Quotations",
  "Drawings",
  "GFC Drawings",
  "3D Views",
  "Approvals",
  "Other",
  "Handover Documents",
];

/* ---------- All Documents ---------- */
export function DocumentsAll() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [collapsed, setCollapsed] = useState({}); // {projectName: true}
  const [viewing, setViewing] = useState(null); // doc being viewed
  const [editing, setEditing] = useState(null); // doc being edited
  const [pdfUrl, setPdfUrl] = useState(null);
  const nav = useNavigate();
  // Read ?project_id= from location.search to auto-filter
  const projectFilter =
    new URLSearchParams(window.location.search).get("project_id") || "";

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat) params.set("category", cat);
    if (projectFilter) params.set("project_id", projectFilter);
    api.get(`/documents?${params}`).then((r) => setRows(r.data));
  };
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [cat, q]);

  // Group rows by project_name (or "Unassigned")
  const groups = React.useMemo(() => {
    const g = {};
    for (const r of rows) {
      const key = r.project_name || "Unassigned";
      (g[key] = g[key] || []).push(r);
    }
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const toggleLock = async (r) => {
    try {
      await api.post(`/documents/${r.id}/${r.is_locked ? "unlock" : "lock"}`);
      toast.success(r.is_locked ? "Unapproved" : "Approved");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
  };
  const deleteDoc = async (r) => {
    if (
      !window.confirm(
        `Delete "${r.title?.trim() || r.filename || "Untitled"}"?`,
      )
    )
      return;
    try {
      await api.delete(`/documents/${r.id}`);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
  };
  const openView = async (r) => {
    setViewing(r);
    setPdfUrl(null);
    if ((r.mime || "").includes("pdf")) {
      try {
        const res = await api.get(`/documents/${r.id}/download`, {
          responseType: "blob",
        });
        setPdfUrl(
          URL.createObjectURL(
            new Blob([res.data], { type: "application/pdf" }),
          ),
        );
      } catch {
        toast.error("Preview failed");
      }
    }
  };
  const closeView = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setViewing(null);
  };

  return (
    <Shell
      title="All Documents"
      subtitle={`${rows.length} document${rows.length !== 1 ? "s" : ""} across the workspace`}
      action={
        <a
          href="/documents/upload"
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Upload size={14} /> Upload Document
        </a>
      }
    >
      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search title…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <select
          className="bc-input h-10"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        {projectFilter && (
          <button
            onClick={() => {
              nav("/documents/all");
              window.location.reload();
            }}
            className="text-[13px] text-[#333333] font-semibold"
          >
            Clear project filter ×
          </button>
        )}
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table
            className="w-full text-[14px]"
            data-testid="documents-grouped-table"
          >
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Title
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Category
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Version
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Status
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Uploaded By
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Date
                </th>
                <th className="text-right px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C] w-[180px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map(([proj, items]) => {
                const isCollapsed = !!collapsed[proj];
                return (
                  <React.Fragment key={proj}>
                    <tr
                      data-testid={`project-group-${proj}`}
                      className="bg-[#F0F4F1] border-t-2 border-[rgba(31,69,59,0.12)] cursor-pointer"
                      onClick={() =>
                        setCollapsed((c) => ({ ...c, [proj]: !isCollapsed }))
                      }
                    >
                      <td
                        colSpan={7}
                        className="px-3 py-2.5 font-bold text-[13.5px] text-[#333333]"
                        style={{ fontFamily: "Poppins" }}
                      >
                        <span className="inline-block w-4">
                          {isCollapsed ? "▸" : "▾"}
                        </span>{" "}
                        {proj}{" "}
                        <span className="text-[#6B7B7C] font-normal text-[12px] ml-1">
                          · {items.length} document
                          {items.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                    </tr>
                    {!isCollapsed &&
                      items.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => openView(r)}
                          className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                          data-testid={`doc-row-${r.id}`}
                        >
                          <td className="px-3 py-2.5 font-semibold text-[#333333] max-w-[280px]">
                            <div className="flex items-center gap-1.5 truncate">
                              {r.is_locked ? (
                                <CheckCircle2
                                  size={14}
                                  className="shrink-0"
                                  style={{ color: "#4CAF50" }}
                                  title={`Approved by ${r.locked_by || "—"}`}
                                />
                              ) : (
                                <Circle
                                  size={14}
                                  className="text-[#B5C4B6] shrink-0"
                                  title="Not approved"
                                />
                              )}
                              <span
                                title={
                                  r.title?.trim() || r.filename || "Untitled"
                                }
                                className="truncate"
                              >
                                {r.title?.trim() || r.filename || "Untitled"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">{r.category}</td>
                          <td className="px-3 py-2.5">{r.version || "V1"}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#EAEEF0] text-[#333333]">
                              {r.status || "draft"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[#6B7B7C]">
                            {r.uploaded_by_name || r.uploaded_by || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-[#6B7B7C]">
                            {(r.document_date || r.created_at || "").slice(
                              0,
                              10,
                            )}
                          </td>
                          <td
                            className="px-3 py-2.5 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-0.5">
                              <button
                                onClick={() =>
                                  downloadDocument(r.id, r.filename)
                                }
                                className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333]"
                                title="Download"
                                data-testid={`doc-download-${r.id}`}
                              >
                                <Download size={15} />
                              </button>
                              <button
                                onClick={() => setEditing(r)}
                                disabled={r.is_locked}
                                className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333] disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                  r.is_locked
                                    ? "Approved — unapprove to edit."
                                    : "Edit Document"
                                }
                                data-testid={`doc-edit-${r.id}`}
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => toggleLock(r)}
                                className="p-1.5 rounded hover:bg-[#EAEEF0]"
                                title={
                                  r.is_locked ? "Unapprove (admin)" : "Approve"
                                }
                                data-testid={`doc-lock-${r.id}`}
                                aria-label={
                                  r.is_locked ? "Unapprove" : "Approve"
                                }
                              >
                                {r.is_locked ? (
                                  <CheckCircle2
                                    size={15}
                                    style={{ color: "#4CAF50" }}
                                  />
                                ) : (
                                  <Circle
                                    size={15}
                                    className="text-[#B5C4B6]"
                                  />
                                )}
                              </button>
                              <button
                                onClick={() => deleteDoc(r)}
                                disabled={r.is_locked}
                                className="p-1.5 rounded hover:bg-[#F4E1D6] text-[#B04D26] disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                  r.is_locked
                                    ? "Approved — unapprove to delete."
                                    : "Delete"
                                }
                                data-testid={`doc-delete-${r.id}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    No documents yet. Upload the first one or approve a BOQ.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inline document viewer modal */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={closeView}
          data-testid="document-viewer-modal"
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(31,69,59,0.10)]">
              <div className="min-w-0 flex-1">
                <div
                  title={
                    viewing.title?.trim() || viewing.filename || "Untitled"
                  }
                  className="text-[15px] font-semibold text-[#333333] truncate"
                >
                  {viewing.title?.trim() || viewing.filename || "Untitled"}
                </div>
                <div className="text-[12px] text-[#6B7B7C] truncate">
                  {viewing.project_name || "—"} · {viewing.category} ·{" "}
                  {viewing.version || "V1"}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => downloadDocument(viewing.id, viewing.filename)}
                  className="h-9 px-3 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold inline-flex items-center gap-1.5"
                >
                  <Download size={13} /> Download
                </button>
                <button
                  onClick={closeView}
                  className="h-9 px-3 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-[#F4F6F7] p-3">
              {pdfUrl ? (
                <iframe
                  title="pdf-viewer"
                  src={pdfUrl}
                  className="w-full h-[70vh] rounded"
                />
              ) : (viewing.mime || "").startsWith("image/") ? (
                <img
                  alt={viewing.title}
                  src={`${process.env.REACT_APP_BACKEND_URL}/api/documents/${viewing.id}/download`}
                  className="max-w-full max-h-[70vh] mx-auto"
                />
              ) : (
                <div className="text-center py-16 text-[#6B7B7C]">
                  <FileText size={40} className="mx-auto mb-3" />
                  <div className="text-[13px]">
                    Preview not available for this file type.
                  </div>
                  <div className="text-[12px] mt-1">
                    Use the Download button to open it locally.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {editing && (
        <EditDocumentModal
          doc={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </Shell>
  );
}

function EditDocumentModal({ doc, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: doc.title || "",
    category: doc.category || "Agreements",
    remarks: doc.remarks || "",
    project_id: doc.project_id || "",
  });
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  useEffect(() => {
    api
      .get("/projects?limit=100")
      .then((r) => setProjects(r.data))
      .catch(() => {});
  }, []);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/documents/${doc.id}`, form);
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        await api.post(`/documents/${doc.id}/replace`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      toast.success("Document updated");
      onSaved();
    } catch (er) {
      toast.error(er?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="edit-doc-modal"
    >
      <div
        className="bg-white rounded-2xl w-[500px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[18px] font-semibold text-[#333333] mb-4">
          Edit Document
        </div>
        <form onSubmit={save} className="grid gap-3">
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Title
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              data-testid="edit-doc-title"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Category
            </label>
            <select
              className="bc-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Project
            </label>
            <select
              className="bc-input"
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            >
              <option value="">— Unassigned —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Remarks
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Replace file (optional)
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-[12px]"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold disabled:opacity-60"
              data-testid="edit-doc-save"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Upload Document ---------- */
export function DocumentUpload() {
  const nav = useNavigate();
  const [projects, setProjects] = useState([]);
  // Prefill project_id from ?project_id=… query param (used by Documents dashboard "+" icons)
  const initialProjectId =
    new URLSearchParams(window.location.search).get("project_id") || "";
  const [form, setForm] = useState({
    project_id: initialProjectId,
    category: "Agreements",
    title: "",
    visibility: "internal",
    remarks: "",
  });
  const [file, setFile] = useState(null);
  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data || []));
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Pick a file");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("file", file);
    try {
      await api.post("/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded");
      nav("/documents/all");
    } catch {
      toast.error("Upload failed");
    }
  };
  return (
    <Shell
      title="Upload Document"
      subtitle="Attach a file to a project — PDF · Excel · Image (max 25 MB)"
    >
      <Card>
        <form onSubmit={submit} className="grid gap-4 max-w-xl">
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Project
            </label>
            <select
              required
              className="bc-input h-10 w-full"
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Category
            </label>
            <select
              className="bc-input h-10 w-full"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
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
              Visibility
            </label>
            <select
              className="bc-input h-10 w-full"
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            >
              <option value="internal">Internal only</option>
              <option value="client">Visible to client</option>
            </select>
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              File
            </label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files[0])}
              className="text-[14px]"
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Remarks
            </label>
            <TextArea
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
          <button className="h-11 px-5 rounded-lg bg-[#1F453B] text-white font-semibold w-fit inline-flex items-center gap-2">
            <Upload size={15} /> Upload
          </button>
        </form>
      </Card>
    </Shell>
  );
}

/* ---------- Project Documents workspace ---------- */
export function ProjectDocuments() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState("");
  const [pkg, setPkg] = useState(null);
  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data || []));
  }, []);
  useEffect(() => {
    if (!selected) return;
    api
      .get(`/projects/${selected}/documents-workspace`)
      .then((r) => setPkg(r.data));
  }, [selected]);
  return (
    <Shell
      title="Project Documents"
      subtitle="All documents grouped by category — auto-includes BOQ approvals and selected quotations"
    >
      <Card>
        <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
          Select project
        </label>
        <select
          className="bc-input h-10 max-w-md"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Choose…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Card>
      {selected && pkg && (
        <div className="grid gap-4">
          {CATEGORIES.map((cat) => {
            const docs = pkg.categories?.[cat] || [];
            if (!docs.length) return null;
            return (
              <Card key={cat}>
                <div className="flex justify-between mb-3">
                  <div className="text-[15px] font-semibold text-[#333333]">
                    {cat}
                  </div>
                  <div className="text-[12px] text-[#6B7B7C]">
                    {docs.length}
                  </div>
                </div>
                <div className="divide-y divide-[rgba(31,69,59,0.08)]">
                  {docs.map((d) => (
                    <div key={d.id} className="py-2 flex items-center gap-3">
                      <FileText size={16} className="text-[#333333]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-[#333333] truncate">
                          {d.title}
                        </div>
                        <div className="text-[12px] text-[#6B7B7C]">
                          {d.source_app} · {d.version} ·{" "}
                          {(d.created_at || "").slice(0, 10)}
                        </div>
                      </div>
                      <button
                        onClick={() => downloadDocument(d.id, d.filename)}
                        className="p-1.5 hover:bg-[#EAEEF0] rounded"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
          {!Object.values(pkg.categories || {}).some((a) => a.length) && (
            <Card>
              <div className="text-center py-8 text-[#B5C4B6]">
                No documents for this project yet.
              </div>
            </Card>
          )}
        </div>
      )}
    </Shell>
  );
}

/* ---------- Multi-section form (Brief / Reki share this) ---------- */
function useAutoSave(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    const t = setTimeout(
      () => localStorage.setItem(key, JSON.stringify(state)),
      500,
    );
    return () => clearTimeout(t);
  }, [state, key]);
  return [state, setState];
}

function SectionForm({
  title,
  subtitle,
  endpoint,
  sections,
  saveKey,
  withAttachments,
}) {
  const nav = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [active, setActive] = useState(0);
  const [values, setValues] = useAutoSave(saveKey, {});
  const [attachments, setAttachments] = useState([]); // {name, mime, size, remark, content_b64}
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data || []));
  }, []);
  const update = (sec, k, v) =>
    setValues((o) => ({ ...o, [sec]: { ...(o[sec] || {}), [k]: v } }));

  const readFile = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () =>
        res({
          name: file.name,
          mime: file.type,
          size: file.size,
          content_b64: String(r.result).split(",")[1] || "",
          remark: "",
        });
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const results = [];
    for (const f of files) {
      if (f.size > 8 * 1024 * 1024) {
        toast.error(`${f.name}: max 8 MB`);
        continue;
      }
      try {
        results.push(await readFile(f));
      } catch {
        toast.error(`Failed to read ${f.name}`);
      }
    }
    setAttachments((a) => [...a, ...results]);
  };

  const submit = async () => {
    if (!projectId) return toast.error("Select a project first");
    setBusy(true);
    try {
      const body = { project_id: projectId, sections: values };
      if (withAttachments && attachments.length) {
        body.attachments = attachments.map((a) => ({
          filename: a.name,
          mime: a.mime,
          content_b64: a.content_b64,
          remark: a.remark || "",
        }));
      }
      const { data } = await api.post(endpoint, body);
      const attMsg = data.attachments?.length
        ? ` · ${data.attachments.length} attachment(s)`
        : "";
      toast.success(
        `Generated ${data.doc_no} · ${(data.pdf_size / 1024).toFixed(1)} KB${attMsg}`,
      );
      localStorage.removeItem(saveKey);
      if (withAttachments) nav(`/documents/site-reki/${data.id}`);
      else nav("/documents/all");
    } catch {
      toast.error("Submission failed");
    } finally {
      setBusy(false);
    }
  };
  const cur = sections[active];
  return (
    <Shell
      title={title}
      subtitle={subtitle}
      action={
        <button
          onClick={submit}
          disabled={busy}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Save size={14} /> {busy ? "Generating…" : "Complete & Generate PDF"}
        </button>
      }
    >
      <Card>
        <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
          Project
        </label>
        <select
          className="bc-input h-10 max-w-md"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">Choose…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Card>
      <div className="grid md:grid-cols-[220px_1fr] gap-4">
        <Card>
          <div className="text-[12px] uppercase tracking-widest text-[#6B7B7C] mb-2">
            Sections
          </div>
          <div className="flex flex-col gap-1">
            {sections.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setActive(i)}
                className={`text-left px-3 py-2 rounded-lg text-[14px] ${active === i ? "bg-[#1F453B] text-white" : "hover:bg-[#F4F6F7] text-[#333333]"}`}
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <div className="text-[16px] font-semibold text-[#333333] mb-3">
            {cur?.title}
          </div>
          <div className="grid gap-3">
            {(cur?.fields || []).map((f) => (
              <div key={f.key}>
                <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                  {f.label}
                </label>
                {f.type === "textarea" ? (
                  <TextArea
                    rows={f.rows || 3}
                    value={(values[cur.title] || {})[f.key] || ""}
                    onChange={(e) => update(cur.title, f.key, e.target.value)}
                  />
                ) : f.type === "date" ? (
                  <Input
                    type="date"
                    value={(values[cur.title] || {})[f.key] || ""}
                    onChange={(e) => update(cur.title, f.key, e.target.value)}
                  />
                ) : (
                  <Input
                    value={(values[cur.title] || {})[f.key] || ""}
                    onChange={(e) => update(cur.title, f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <button
              disabled={active === 0}
              onClick={() => setActive((a) => a - 1)}
              className="h-9 px-3 rounded-lg border border-[rgba(31,69,59,0.14)] text-[13px]"
            >
              ← Previous
            </button>
            <button
              disabled={active === sections.length - 1}
              onClick={() => setActive((a) => a + 1)}
              className="h-9 px-3 rounded-lg border border-[rgba(31,69,59,0.14)] text-[13px]"
            >
              Next →
            </button>
          </div>
          <div className="text-[11.5px] text-[#B5C4B6] mt-3">
            Draft autosaved to this browser · {Object.keys(values).length}{" "}
            section{Object.keys(values).length !== 1 ? "s" : ""} filled
          </div>
        </Card>
      </div>
      {withAttachments && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[16px] font-semibold text-[#333333]">
                Attachments
              </div>
              <div className="text-[12.5px] text-[#6B7B7C]">
                Upload site photos and reference files. Add a remark to each so
                context isn&apos;t lost.
              </div>
            </div>
            <label
              className="h-9 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold cursor-pointer inline-flex items-center gap-1.5"
              data-testid="reki-upload-input-label"
            >
              <Upload size={14} /> Upload files
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
                data-testid="reki-upload-input"
              />
            </label>
          </div>
          {attachments.length === 0 ? (
            <div
              className="border border-dashed border-[#B5C4B6] rounded-lg py-8 text-center text-[12.5px] text-[#6B7B7C]"
              data-testid="reki-attach-empty"
            >
              No attachments yet. Upload JPG / PNG / PDF / DOC / XLSX (up to 8
              MB each).
            </div>
          ) : (
            <div className="grid gap-3" data-testid="reki-attachments-list">
              {attachments.map((a, i) => {
                const isImg = (a.mime || "").startsWith("image/");
                return (
                  <div
                    key={i}
                    className="flex gap-3 items-start border border-[#EAEEF0] rounded-lg p-2.5"
                    data-testid={`reki-attach-row-${i}`}
                  >
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-[#F4F6F7] flex items-center justify-center shrink-0 border border-[#EAEEF0]">
                      {isImg ? (
                        <img
                          alt={a.name}
                          src={`data:${a.mime};base64,${a.content_b64}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText size={22} className="text-[#6B7B7C]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[13px] font-semibold text-[#333333] truncate">
                          {a.name}
                        </div>
                        <button
                          onClick={() =>
                            setAttachments((list) =>
                              list.filter((_, j) => j !== i),
                            )
                          }
                          className="text-[#B04D26] text-[12px] font-semibold hover:underline shrink-0"
                          data-testid={`reki-attach-remove-${i}`}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="text-[11.5px] text-[#6B7B7C] mb-1.5">
                        {(a.size / 1024).toFixed(1)} KB · {a.mime || "—"}
                      </div>
                      <input
                        placeholder="Remark (optional) — e.g. 'North wall damp patch'"
                        value={a.remark}
                        onChange={(e) =>
                          setAttachments((list) =>
                            list.map((x, j) =>
                              j === i ? { ...x, remark: e.target.value } : x,
                            ),
                          )
                        }
                        className="w-full h-9 px-2 rounded-md border border-[#DDD8CE] bg-[#FAF8F5] text-[13px]"
                        data-testid={`reki-attach-remark-${i}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </Shell>
  );
}

const BRIEF_SECTIONS = [
  {
    title: "Project & Client Information",
    fields: [
      { key: "client_name", label: "Client Name" },
      { key: "contact", label: "Primary Contact" },
      { key: "site_address", label: "Site Address", type: "textarea" },
    ],
  },
  {
    title: "Project Purpose",
    fields: [
      { key: "purpose", label: "Purpose", type: "textarea", rows: 4 },
      { key: "style", label: "Design style / mood" },
    ],
  },
  {
    title: "Users and Occupancy",
    fields: [
      { key: "adults", label: "Adults" },
      { key: "kids", label: "Children" },
      { key: "lifestyle", label: "Lifestyle notes", type: "textarea" },
    ],
  },
  {
    title: "Space Requirements",
    fields: [
      {
        key: "rooms",
        label: "Room list (one per line)",
        type: "textarea",
        rows: 5,
      },
    ],
  },
  {
    title: "Design Preferences",
    fields: [
      { key: "palette", label: "Colour palette" },
      { key: "materials", label: "Preferred materials" },
      {
        key: "inspirations",
        label: "Inspiration references",
        type: "textarea",
      },
    ],
  },
  {
    title: "Functional Requirements",
    fields: [
      { key: "storage", label: "Storage / utility needs", type: "textarea" },
      { key: "tech", label: "Technology / smart home" },
    ],
  },
  {
    title: "Budget and Timeline",
    fields: [
      { key: "budget", label: "Budget range" },
      { key: "start_by", label: "Preferred start", type: "date" },
      { key: "complete_by", label: "Target completion", type: "date" },
    ],
  },
  {
    title: "Project Constraints",
    fields: [
      {
        key: "constraints",
        label: "Constraints / restrictions",
        type: "textarea",
      },
    ],
  },
  {
    title: "Sustainability and Maintenance",
    fields: [
      {
        key: "sustainability",
        label: "Sustainability preferences",
        type: "textarea",
      },
    ],
  },
  {
    title: "Priority and Confirmation",
    fields: [
      {
        key: "priorities",
        label: "Priorities (essential / preferred / optional)",
        type: "textarea",
        rows: 4,
      },
    ],
  },
  {
    title: "Sign-off",
    fields: [
      {
        key: "architect_summary",
        label: "Architect summary",
        type: "textarea",
      },
      { key: "open_questions", label: "Open questions", type: "textarea" },
      { key: "client_comments", label: "Client comments", type: "textarea" },
    ],
  },
];

const REKI_SECTIONS = [
  {
    title: "Survey Information",
    fields: [
      { key: "surveyor", label: "Surveyor" },
      { key: "survey_date", label: "Survey date", type: "date" },
      { key: "weather", label: "Weather / conditions" },
    ],
  },
  {
    title: "Site and Access",
    fields: [
      {
        key: "access_notes",
        label: "Access / lift / stairs",
        type: "textarea",
      },
      { key: "parking", label: "Parking" },
    ],
  },
  {
    title: "Room-by-Room Survey",
    fields: [
      {
        key: "rooms_measured",
        label: "Rooms measured (L×W×H per line)",
        type: "textarea",
        rows: 6,
      },
    ],
  },
  {
    title: "Doors and Windows",
    fields: [{ key: "openings", label: "Openings notes", type: "textarea" }],
  },
  {
    title: "Electrical Survey",
    fields: [
      { key: "electrical", label: "Electrical points / DBs", type: "textarea" },
    ],
  },
  {
    title: "Plumbing and Sanitary",
    fields: [
      { key: "plumbing", label: "Plumbing lines / fixtures", type: "textarea" },
    ],
  },
  {
    title: "HVAC and Ventilation",
    fields: [{ key: "hvac", label: "HVAC / ducts", type: "textarea" }],
  },
  {
    title: "Existing Construction",
    fields: [
      {
        key: "structure",
        label: "Existing structure / condition",
        type: "textarea",
      },
    ],
  },
  {
    title: "Light and Environment",
    fields: [
      { key: "light", label: "Natural light / noise / air", type: "textarea" },
    ],
  },
  {
    title: "Safety and Restrictions",
    fields: [
      {
        key: "safety",
        label: "Society / municipal restrictions",
        type: "textarea",
      },
    ],
  },
  {
    title: "Survey Completion",
    fields: [
      { key: "observations", label: "Major observations", type: "textarea" },
      { key: "missing", label: "Missing info / follow-ups", type: "textarea" },
      { key: "submitted_by", label: "Submitted by" },
    ],
  },
];

export const ProjectBriefForm = () => (
  <SectionForm
    title="Project Brief"
    subtitle="Multi-section client brief · autosaved locally · generates a signed PDF"
    endpoint="/documents/forms/project-brief"
    sections={BRIEF_SECTIONS}
    saveKey="bc.brief.draft"
  />
);
export const SiteRekiForm = () => (
  <SectionForm
    title="Site Reki"
    subtitle="Site survey · autosaves every keystroke · generates a Noto-Sans PDF with rooms table"
    endpoint="/documents/forms/site-reki"
    sections={REKI_SECTIONS}
    saveKey="bc.reki.draft"
    withAttachments
  />
);

export function SiteRekiView() {
  const { id } = useParams();
  const nav = useNavigate();
  const API = process.env.REACT_APP_BACKEND_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("bc_token") : null;
  const [doc, setDoc] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [imgUrls, setImgUrls] = useState({});
  useEffect(() => {
    api
      .get(`/documents/${id}/reki`)
      .then(async (r) => {
        setDoc(r.data);
        // Preload image blobs (auth required — can't use raw URLs)
        const urls = {};
        for (const a of r.data.attachments || []) {
          if ((a.mime || "").startsWith("image/")) {
            try {
              const resp = await api.get(
                `/documents/${id}/attachments/${a.id}`,
                { responseType: "blob" },
              );
              urls[a.id] = URL.createObjectURL(resp.data);
            } catch {}
          }
        }
        setImgUrls(urls);
      })
      .catch(() => toast.error("Failed to load Site Reki"));
    return () => {
      Object.values(imgUrls).forEach(URL.revokeObjectURL);
    };
    // eslint-disable-next-line
  }, [id]);
  const download = async (att) => {
    try {
      const resp = await api.get(`/documents/${id}/attachments/${att.id}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  };
  if (!doc)
    return (
      <Shell title="Site Reki">
        <div className="text-[13px] text-[#6B7B7C]">Loading…</div>
      </Shell>
    );
  const attachments = doc.attachments || [];
  return (
    <Shell
      title={doc.title || "Site Reki"}
      subtitle={`${doc.filename || ""} · ${doc.uploaded_by_name || ""} · ${(doc.document_date || doc.created_at || "").slice(0, 10)}`}
      action={
        <button
          onClick={() => nav("/documents/all")}
          className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333]"
        >
          Back to Documents
        </button>
      }
    >
      <Card>
        <div className="text-[15px] font-semibold text-[#333333] mb-2">
          Report
        </div>
        <div className="grid gap-3">
          {Object.entries(doc.sections || {}).map(([sec, fields]) => (
            <div key={sec} className="border border-[#EAEEF0] rounded-lg p-3">
              <div className="text-[13px] font-semibold text-[#333333] mb-1.5">
                {sec}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(fields || {}).map(([k, v]) => (
                  <div key={k} className="text-[12.5px]">
                    <span className="text-[#6B7B7C]">{k}:</span>{" "}
                    <span className="text-[#333333]">{String(v || "—")}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(doc.sections || {}).length === 0 && (
            <div className="text-[12.5px] text-[#6B7B7C]">
              No sections captured.
            </div>
          )}
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-semibold text-[#333333]">
            Attachments
          </div>
          <div className="text-[12px] text-[#6B7B7C]">
            {attachments.length} file{attachments.length !== 1 ? "s" : ""}
          </div>
        </div>
        {attachments.length === 0 ? (
          <div className="text-[12.5px] text-[#6B7B7C]">
            No attachments were added to this Site Reki.
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            data-testid="reki-view-grid"
          >
            {attachments.map((a) => {
              const isImg = (a.mime || "").startsWith("image/");
              return (
                <div
                  key={a.id}
                  className="border border-[#EAEEF0] rounded-lg overflow-hidden bg-white"
                  data-testid={`reki-view-attach-${a.id}`}
                >
                  {isImg ? (
                    <button
                      onClick={() => setLightbox(a)}
                      className="block w-full aspect-[4/3] bg-[#F4F6F7]"
                    >
                      {imgUrls[a.id] ? (
                        <img
                          alt={a.filename}
                          src={imgUrls[a.id]}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[12px] text-[#6B7B7C]">
                          Loading…
                        </div>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => download(a)}
                      className="w-full h-32 flex flex-col items-center justify-center gap-1 bg-[#F4F6F7] hover:bg-[#EAEEF0]"
                    >
                      <FileText size={30} className="text-[#6B7B7C]" />
                      <div className="text-[12.5px] font-semibold text-[#333333] px-2 truncate max-w-full">
                        {a.filename}
                      </div>
                      <div className="text-[11px] text-[#6B7B7C]">
                        {(a.size / 1024).toFixed(1)} KB · click to download
                      </div>
                    </button>
                  )}
                  <div className="p-2.5">
                    <div className="text-[12px] font-semibold text-[#333333] truncate">
                      {a.filename}
                    </div>
                    <div className="text-[12.5px] text-[#333333] mt-0.5">
                      {a.remark || (
                        <span className="text-[#B5C4B6] italic">No remark</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
          data-testid="reki-lightbox"
        >
          <img
            alt={lightbox.filename}
            src={imgUrls[lightbox.id]}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </Shell>
  );
}

/* ---------- Drawings ---------- */
export function DrawingsAll() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get("/drawings").then((r) => setRows(r.data));
  }, []);
  return (
    <Shell
      title="All Drawings"
      subtitle={`${rows.length} drawing${rows.length !== 1 ? "s" : ""} · revisions preserved`}
      action={
        <a
          href="/documents/drawings/upload"
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Upload size={14} /> Upload Drawing
        </a>
      }
    >
      <Card>
        <div className="table-container overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Drawing No.
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Title
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Discipline
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Rev.
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Status
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Issued
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[rgba(31,69,59,0.08)]"
                >
                  <td className="px-3 py-2.5 font-mono font-semibold text-[#333333]">
                    {r.drawing_number}
                  </td>
                  <td className="px-3 py-2.5">{r.title}</td>
                  <td className="px-3 py-2.5">{r.discipline}</td>
                  <td className="px-3 py-2.5">{r.revision}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11.5px] font-semibold ${r.status === "superseded" ? "bg-[#EAEEF0] text-[#6B7B7C]" : "bg-[#D8E0DA] text-[#333333]"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[#6B7B7C]">
                    {(r.issue_date || "").slice(0, 10)}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#B5C4B6]">
                    No drawings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}

export function DrawingUpload() {
  const nav = useNavigate();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    project_id: "",
    title: "",
    drawing_number: "",
    discipline: "Architecture",
    revision: "R1",
    issue_date: "",
    issue_purpose: "",
    status: "Draft",
    remarks: "",
  });
  const [file, setFile] = useState(null);
  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data || []));
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Pick a drawing file");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("file", file);
    try {
      await api.post("/drawings", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Drawing uploaded — previous revisions marked superseded");
      nav("/documents/drawings");
    } catch {
      toast.error("Upload failed");
    }
  };
  return (
    <Shell
      title="Upload Drawing"
      subtitle="New revisions supersede prior ones · history is preserved"
    >
      <Card>
        <form onSubmit={submit} className="grid gap-3 max-w-2xl md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Project
            </label>
            <select
              required
              className="bc-input h-10 w-full"
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {[
            ["title", "Title"],
            ["drawing_number", "Drawing Number"],
            ["discipline", "Discipline"],
            ["revision", "Revision"],
            ["issue_date", "Issue Date", "date"],
            ["issue_purpose", "Issue Purpose"],
            ["status", "Status"],
            ["remarks", "Remarks"],
          ].map(([k, label, type]) => (
            <div key={k}>
              <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
                {label}
              </label>
              <Input
                type={type || "text"}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              File
            </label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files[0])}
              className="text-[14px]"
            />
          </div>
          <button className="h-11 px-5 rounded-lg bg-[#1F453B] text-white font-semibold w-fit inline-flex items-center gap-2 md:col-span-2">
            <Upload size={15} /> Upload Drawing
          </button>
        </form>
      </Card>
    </Shell>
  );
}
