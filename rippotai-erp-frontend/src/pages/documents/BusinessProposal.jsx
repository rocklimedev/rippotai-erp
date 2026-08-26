import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  Shell,
  Card,
  Input,
  CATEGORIES,
  downloadDocument,
} from "../../hooks/shared";
import {
  useGetDocumentsQuery,
  useDeleteDocumentMutation,
  useLockDocumentMutation,
  useUnlockDocumentMutation,
  useLazyDownloadDocumentQuery,
  useUpdateDocumentMutation,
  useReplaceDocumentFileMutation,
} from "../../api/document.api"; // adjust to wherever documentApi is defined

/* ---------- All Documents ---------- */
export function BusinessProposalAll() {
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

  // RTK Query replaces the manual load()/api.get() call. It refetches
  // automatically whenever q/cat/projectFilter change, and whenever a
  // mutation below invalidates the "Documents" tag.
  const {
    data: rows = [],
    isFetching,
    refetch,
  } = useGetDocumentsQuery({ q, category: cat, project_id: projectFilter });

  const [lockDocument] = useLockDocumentMutation();
  const [unlockDocument] = useUnlockDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  const [triggerDownload] = useLazyDownloadDocumentQuery();

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
      if (r.isLocked) {
        await unlockDocument(r.id).unwrap();
        toast.success("Unapproved");
      } else {
        await lockDocument(r.id).unwrap();
        toast.success("Approved");
      }
      // no manual load() needed — invalidatesTags: ["Documents"] refetches for us
    } catch (e) {
      toast.error(e?.data?.detail || "Failed");
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
      await deleteDocument(r.id).unwrap();
      toast.success("Deleted");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed");
    }
  };

  const openView = async (r) => {
    setViewing(r);
    setPdfUrl(null);
    if ((r.mime || "").includes("pdf")) {
      try {
        // triggerDownload hits the same /documents/:id/download endpoint,
        // via the shared RTK Query cache/dedup instead of a bespoke axios call.
        const blob = await triggerDownload(r.id).unwrap();
        setPdfUrl(URL.createObjectURL(blob));
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
                              {r.isLocked ? (
                                <CheckCircle2
                                  size={14}
                                  className="shrink-0"
                                  style={{ color: "#4CAF50" }}
                                  title={`Approved by ${r.lockedBy || "—"}`}
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
                            {r.uploadedByName || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-[#6B7B7C]">
                            {(r.document_date || r.createdAt || "").slice(
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
                                disabled={r.isLocked}
                                className="p-1.5 rounded hover:bg-[#EAEEF0] text-[#333333] disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                  r.isLocked
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
                                  r.isLocked ? "Unapprove (admin)" : "Approve"
                                }
                                data-testid={`doc-lock-${r.id}`}
                                aria-label={
                                  r.isLocked ? "Unapprove" : "Approve"
                                }
                              >
                                {r.isLocked ? (
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
                                disabled={r.isLocked}
                                className="p-1.5 rounded hover:bg-[#F4E1D6] text-[#B04D26] disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                  r.isLocked
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
              {!isFetching && !rows.length && (
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
        <EditDocumentModal doc={editing} onClose={() => setEditing(null)} />
      )}
    </Shell>
  );
}
export function EditDocumentModal({ doc, onClose }) {
  const [form, setForm] = useState({
    title: doc.title || "",
    category: doc.category || "Agreements",
    remarks: doc.remarks || "",
    project_id: doc.project_id || "",
  });
  const [projects, setProjects] = useState([]);
  const [file, setFile] = useState(null);

  const [updateDocument, { isLoading: saving }] = useUpdateDocumentMutation();
  const [replaceDocumentFile] = useReplaceDocumentFileMutation();

  useEffect(() => {
    // No RTK endpoint for projects was provided alongside documentApi,
    // so this list stays on the plain axios client.
    api
      .get("/projects?limit=100")
      .then((r) => setProjects(r.data))
      .catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await updateDocument({ id: doc.id, data: form }).unwrap();
      if (file) {
        await replaceDocumentFile({ id: doc.id, file }).unwrap();
      }
      toast.success("Document updated");
      // invalidatesTags: ["Documents"] on both mutations refreshes the list;
      // just close the modal.
      onClose();
    } catch (er) {
      toast.error(er?.data?.detail || "Save failed");
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
