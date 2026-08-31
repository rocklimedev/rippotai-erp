import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  downloadDocument,
  CATEGORIES,
} from "../../hooks/shared";
import {
  useGetDocumentsQuery,
  useGetDocumentTypesQuery,
  useDeleteDocumentMutation,
  useLockDocumentMutation,
  useUnlockDocumentMutation,
  useLazyDownloadDocumentQuery,
  useUpdateDocumentMutation,
  useReplaceDocumentFileMutation,
} from "../../api/document.api";
import { useGetProjectsQuery } from "../../api/project.api";

/* ============================================================
   ALL DOCUMENTS
============================================================ */

export function DocumentsAll() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const projectFilter = searchParams.get("project_id") || "";

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useGetDocumentsQuery({
    projectId: projectFilter || undefined,
    category: cat || undefined,
  });
  const { data: documentTypes = [], isLoading: documentTypesLoading } =
    useGetDocumentTypesQuery();
  const [lockDocument] = useLockDocumentMutation();
  const [unlockDocument] = useUnlockDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  const [triggerDownload] = useLazyDownloadDocumentQuery();
  const categories = useMemo(() => {
    const source = Array.isArray(documentTypes)
      ? documentTypes
      : documentTypes?.data || [];

    return source;
  }, [documentTypes]);
  /*
   * Local search because backend currently does not expose ?q=
   */
  const filteredRows = useMemo(() => {
    const search = q.trim().toLowerCase();

    if (!search) {
      return rows;
    }

    return rows.filter((doc) => {
      return (
        doc.title?.toLowerCase().includes(search) ||
        doc.filename?.toLowerCase().includes(search) ||
        doc.category?.toLowerCase().includes(search) ||
        doc.project_name?.toLowerCase().includes(search)
      );
    });
  }, [rows, q]);

  const groups = useMemo(() => {
    const grouped = {};

    for (const row of filteredRows) {
      const projectName = row.project_name || row.projectName || "Unassigned";

      if (!grouped[projectName]) {
        grouped[projectName] = [];
      }

      grouped[projectName].push(row);
    }

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredRows]);

  const toggleLock = async (document) => {
    try {
      /*
       * Replace this with your actual authenticated user ID.
       *
       * If your backend later gets userId from JWT,
       * remove userId from the frontend completely.
       */
      const userId = document.currentUserId;

      if (!userId) {
        toast.error("Current user ID is required");
        return;
      }

      if (document.isLocked) {
        await unlockDocument({
          id: document.id,
          userId,
        }).unwrap();

        toast.success("Document unapproved");
      } else {
        await lockDocument({
          id: document.id,
          userId,
        }).unwrap();

        toast.success("Document approved");
      }
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.data?.detail ||
          "Failed to update document approval",
      );
    }
  };

  const deleteDoc = async (document) => {
    const title = document.title?.trim() || document.filename || "Untitled";

    if (!window.confirm(`Delete "${title}"?`)) {
      return;
    }

    try {
      await deleteDocument(document.id).unwrap();

      toast.success("Document deleted");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.data?.detail ||
          "Failed to delete document",
      );
    }
  };

  const openView = async (document) => {
    setViewing(document);
    setPdfUrl(null);

    if ((document.mime || "").includes("pdf")) {
      try {
        const blob = await triggerDownload(document.id).unwrap();

        const url = URL.createObjectURL(blob);

        setPdfUrl(url);
      } catch {
        toast.error("Preview failed");
      }
    }
  };

  const closeView = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    setPdfUrl(null);
    setViewing(null);
  };

  return (
    <Shell
      title="All Documents"
      subtitle={`${filteredRows.length} document${
        filteredRows.length !== 1 ? "s" : ""
      } across the workspace`}
      action={
        <button
          type="button"
          onClick={() =>
            nav(
              projectFilter
                ? `/documents/upload?project_id=${projectFilter}`
                : "/documents/upload",
            )
          }
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Upload size={14} />
          Upload Document
        </button>
      }
    >
      {/* Filters */}

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

          {categories.map((type) => (
            <option key={type.id} value={type.name}>
              {type.name}
            </option>
          ))}
        </select>

        {projectFilter && (
          <button
            type="button"
            onClick={() => nav("/documents/all")}
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
                {[
                  "Title",
                  "Category",
                  "Version",
                  "Status",
                  "Uploaded By",
                  "Date",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]"
                  >
                    {heading}
                  </th>
                ))}

                <th className="text-right px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C] w-[180px]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {isFetching && !rows.length && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#6B7B7C]">
                    Loading documents…
                  </td>
                </tr>
              )}

              {groups.map(([projectName, items]) => {
                const isCollapsed = !!collapsed[projectName];

                return (
                  <React.Fragment key={projectName}>
                    <tr
                      className="bg-[#F0F4F1] border-t-2 border-[rgba(31,69,59,0.12)] cursor-pointer"
                      onClick={() =>
                        setCollapsed((current) => ({
                          ...current,
                          [projectName]: !isCollapsed,
                        }))
                      }
                    >
                      <td
                        colSpan={7}
                        className="px-3 py-2.5 font-bold text-[13.5px] text-[#333333]"
                      >
                        <span className="inline-block w-4">
                          {isCollapsed ? "▸" : "▾"}
                        </span>

                        {projectName}

                        <span className="text-[#6B7B7C] font-normal text-[12px] ml-1">
                          · {items.length} document
                          {items.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                    </tr>

                    {!isCollapsed &&
                      items.map((document) => (
                        <tr
                          key={document.id}
                          onClick={() => openView(document)}
                          className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                          data-testid={`doc-row-${document.id}`}
                        >
                          <td className="px-3 py-2.5 font-semibold text-[#333333] max-w-[280px]">
                            <div className="flex items-center gap-1.5 truncate">
                              {document.isLocked ? (
                                <CheckCircle2
                                  size={14}
                                  className="shrink-0 text-[#4CAF50]"
                                  title={`Approved by ${
                                    document.lockedBy || "—"
                                  }`}
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
                                  document.title?.trim() ||
                                  document.filename ||
                                  "Untitled"
                                }
                                className="truncate"
                              >
                                {document.title?.trim() ||
                                  document.filename ||
                                  "Untitled"}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-2.5">
                            {document.category || "—"}
                          </td>

                          <td className="px-3 py-2.5">
                            {document.version || "V1"}
                          </td>

                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#EAEEF0] text-[#333333]">
                              {document.status || "draft"}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-[#6B7B7C]">
                            {document.uploadedByName || "—"}
                          </td>

                          <td className="px-3 py-2.5 text-[#6B7B7C]">
                            {(
                              document.documentDate ||
                              document.document_date ||
                              document.createdAt ||
                              ""
                            ).slice(0, 10)}
                          </td>

                          <td
                            className="px-3 py-2.5 text-right"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  downloadDocument(
                                    document.id,
                                    document.filename,
                                  )
                                }
                                className="p-1.5 rounded hover:bg-[#EAEEF0]"
                                title="Download"
                              >
                                <Download size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditing(document)}
                                disabled={document.isLocked}
                                className="p-1.5 rounded hover:bg-[#EAEEF0] disabled:opacity-40"
                                title={
                                  document.isLocked
                                    ? "Approved — unapprove to edit"
                                    : "Edit Document"
                                }
                              >
                                <Edit3 size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleLock(document)}
                                className="p-1.5 rounded hover:bg-[#EAEEF0]"
                                title={
                                  document.isLocked ? "Unapprove" : "Approve"
                                }
                              >
                                {document.isLocked ? (
                                  <CheckCircle2
                                    size={15}
                                    className="text-[#4CAF50]"
                                  />
                                ) : (
                                  <Circle
                                    size={15}
                                    className="text-[#B5C4B6]"
                                  />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteDoc(document)}
                                disabled={document.isLocked}
                                className="p-1.5 rounded hover:bg-[#F4E1D6] text-[#B04D26] disabled:opacity-40"
                                title={
                                  document.isLocked
                                    ? "Approved — unapprove to delete"
                                    : "Delete"
                                }
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

              {!isLoading && !filteredRows.length && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    No documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================
          VIEWER
      ======================================================== */}

      {viewing && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={closeView}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold truncate">
                  {viewing.title?.trim() || viewing.filename || "Untitled"}
                </div>

                <div className="text-[12px] text-[#6B7B7C] truncate">
                  {viewing.project_name || "—"} · {viewing.category || "—"} ·{" "}
                  {viewing.version || "V1"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadDocument(viewing.id, viewing.filename)}
                  className="h-9 px-3 rounded-lg border text-[13px] font-semibold inline-flex items-center gap-1.5"
                >
                  <Download size={13} />
                  Download
                </button>

                <button
                  type="button"
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
                  alt={viewing.title || "Document"}
                  src={`/api/documents/${viewing.id}/download`}
                  className="max-w-full max-h-[70vh] mx-auto"
                />
              ) : (
                <div className="text-center py-16 text-[#6B7B7C]">
                  <FileText size={40} className="mx-auto mb-3" />

                  <div className="text-[13px]">
                    Preview not available for this file type.
                  </div>

                  <div className="text-[12px] mt-1">
                    Use Download to open it locally.
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

/* ============================================================
   EDIT DOCUMENT
============================================================ */

export function EditDocumentModal({ doc, onClose }) {
  const [form, setForm] = useState({
    title: doc.title || "",
    category: doc.category || "",
    remarks: doc.remarks || "",
    projectId: doc.projectId || doc.project_id || "",
  });

  const [file, setFile] = useState(null);

  const { data: projects = [] } = useGetProjectsQuery({});
  const { data: documentTypes = [], isLoading: documentTypesLoading } =
    useGetDocumentTypesQuery();

  const categories = useMemo(() => {
    const source = Array.isArray(documentTypes)
      ? documentTypes
      : documentTypes?.data || [];

    return source;
  }, [documentTypes]);
  const [updateDocument, { isLoading: saving }] = useUpdateDocumentMutation();

  const [replaceDocumentFile, { isLoading: replacing }] =
    useReplaceDocumentFileMutation();

  const save = async (event) => {
    event.preventDefault();

    try {
      await updateDocument({
        id: doc.id,
        data: form,
      }).unwrap();

      if (file) {
        await replaceDocumentFile({
          id: doc.id,
          file,
        }).unwrap();
      }

      toast.success("Document updated");

      onClose();
    } catch (error) {
      toast.error(error?.data?.message || error?.data?.detail || "Save failed");
    }
  };

  const savingAny = saving || replacing;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[500px] max-w-full p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-[18px] font-semibold mb-4">Edit Document</div>

        <form onSubmit={save} className="grid gap-3">
          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Title
            </label>

            <Input
              required
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Category
            </label>
            <select
              className="bc-input"
              value={form.category}
              onChange={(event) =>
                setForm({
                  ...form,
                  category: event.target.value,
                })
              }
              disabled={documentTypesLoading}
            >
              <option value="">
                {documentTypesLoading
                  ? "Loading categories…"
                  : "Select category"}
              </option>

              {categories.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Project
            </label>

            <select
              className="bc-input"
              value={form.projectId}
              onChange={(event) =>
                setForm({
                  ...form,
                  projectId: event.target.value,
                })
              }
            >
              <option value="">— Unassigned —</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Remarks
            </label>

            <textarea
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              value={form.remarks}
              onChange={(event) =>
                setForm({
                  ...form,
                  remarks: event.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Replace file
            </label>

            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="text-[12px]"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border text-[13px] font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savingAny}
              className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold disabled:opacity-60"
            >
              {savingAny ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
