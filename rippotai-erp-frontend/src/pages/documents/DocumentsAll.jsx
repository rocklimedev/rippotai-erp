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

import { Shell, Card, Input, downloadDocument } from "../../hooks/shared";

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
   HELPERS
============================================================ */

const getDocumentTitle = (document) => {
  return document?.title?.trim() || document?.filename || "Untitled";
};

const getDocumentTypeName = (document) => {
  return document?.documentType?.name || document?.category || "—";
};

const getDocumentTypeCode = (document) => {
  return document?.documentType?.code || "";
};

const getProjectId = (document) => {
  return document?.projectId || document?.project_id || "";
};

const getProjectName = (document, projectMap) => {
  return (
    document?.project_name ||
    document?.projectName ||
    document?.project?.name ||
    projectMap[getProjectId(document)] ||
    "Unassigned"
  );
};

const getDocumentDate = (document) => {
  return (
    document?.documentDate ||
    document?.document_date ||
    document?.created_at ||
    document?.createdAt ||
    ""
  );
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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

  /* ==========================================================
     DOCUMENTS
  ========================================================== */

  const {
    data: documentsResponse,
    isLoading,
    isFetching,
  } = useGetDocumentsQuery({
    projectId: projectFilter || undefined,
    category: cat || undefined,
  });

  /* ==========================================================
     PROJECTS
  ========================================================== */

  const { data: projectsResponse } = useGetProjectsQuery({});

  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) {
      return projectsResponse;
    }

    return projectsResponse?.data || projectsResponse?.projects || [];
  }, [projectsResponse]);

  /* ==========================================================
     PROJECT MAP
  ========================================================== */

  const projectMap = useMemo(() => {
    const map = {};

    for (const project of projects) {
      if (!project?.id) continue;

      map[project.id] =
        project.name ||
        project.projectName ||
        project.title ||
        project.code ||
        project.id;
    }

    return map;
  }, [projects]);

  /* ==========================================================
     NORMALIZE DOCUMENT RESPONSE
     
     API:
       documentType.name
       documentType.code
       projectId
       created_at

     UI:
       category
       project_name
       createdAt
  ========================================================== */

  const rows = useMemo(() => {
    const source = Array.isArray(documentsResponse)
      ? documentsResponse
      : documentsResponse?.data || documentsResponse?.documents || [];

    return source.map((document) => ({
      ...document,

      /* Keep the nested API object */
      documentType: document.documentType || null,

      /* Normalize category */
      category: document.documentType?.name || document.category || "",

      /* Normalize project */
      project_name: getProjectName(document, projectMap),

      /* Normalize project id */
      projectId: getProjectId(document),

      /* Normalize date */
      createdAt: document.createdAt || document.created_at || null,

      /* Normalize uploaded user */
      uploadedByName:
        document.uploadedByName ||
        document.uploaded_by_name ||
        document.uploadedBy?.name ||
        "",
    }));
  }, [documentsResponse, projectMap]);

  /* ==========================================================
     DOCUMENT TYPES
  ========================================================== */

  const { data: documentTypesResponse, isLoading: documentTypesLoading } =
    useGetDocumentTypesQuery();

  const documentTypes = useMemo(() => {
    if (Array.isArray(documentTypesResponse)) {
      return documentTypesResponse;
    }

    return (
      documentTypesResponse?.data || documentTypesResponse?.documentTypes || []
    );
  }, [documentTypesResponse]);

  /* ==========================================================
     MUTATIONS
  ========================================================== */

  const [lockDocument] = useLockDocumentMutation();
  const [unlockDocument] = useUnlockDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  const [triggerDownload] = useLazyDownloadDocumentQuery();

  /* ==========================================================
     SEARCH
  ========================================================== */

  const filteredRows = useMemo(() => {
    const search = q.trim().toLowerCase();

    if (!search) {
      return rows;
    }

    return rows.filter((document) => {
      const title = getDocumentTitle(document);

      const filename = document?.filename || "";

      const category = document?.documentType?.name || document?.category || "";

      const categoryCode = document?.documentType?.code || "";

      const projectName = document?.project_name || "";

      const projectId = document?.projectId || "";

      const remarks = document?.remarks || "";

      return (
        title.toLowerCase().includes(search) ||
        filename.toLowerCase().includes(search) ||
        category.toLowerCase().includes(search) ||
        categoryCode.toLowerCase().includes(search) ||
        projectName.toLowerCase().includes(search) ||
        projectId.toLowerCase().includes(search) ||
        remarks.toLowerCase().includes(search)
      );
    });
  }, [rows, q]);

  /* ==========================================================
     GROUP BY PROJECT
  ========================================================== */

  const groups = useMemo(() => {
    const grouped = {};

    for (const row of filteredRows) {
      const projectName = row.project_name || "Unassigned";

      if (!grouped[projectName]) {
        grouped[projectName] = [];
      }

      grouped[projectName].push(row);
    }

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredRows]);

  /* ==========================================================
     APPROVE / UNAPPROVE
  ========================================================== */

  const toggleLock = async (document) => {
    try {
      /*
       * Your backend should ideally obtain the
       * authenticated user from JWT.
       *
       * Until then this expects currentUserId
       * on the document object.
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

  /* ==========================================================
     DELETE
  ========================================================== */

  const deleteDoc = async (document) => {
    const title = getDocumentTitle(document);

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

  /* ==========================================================
     OPEN VIEW
  ========================================================== */

  const openView = async (document) => {
    setViewing(document);
    setPdfUrl(null);

    if ((document.mime || "").toLowerCase().includes("pdf")) {
      try {
        const blob = await triggerDownload(document.id).unwrap();

        const url = URL.createObjectURL(blob);

        setPdfUrl(url);
      } catch {
        toast.error("Preview failed");
      }
    }
  };

  /* ==========================================================
     CLOSE VIEW
  ========================================================== */

  const closeView = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    setPdfUrl(null);
    setViewing(null);
  };

  /* ==========================================================
     RENDER
  ========================================================== */

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
      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search title, file, project, type…"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          className="max-w-sm"
        />

        <select
          className="bc-input h-10"
          value={cat}
          onChange={(event) => setCat(event.target.value)}
          disabled={documentTypesLoading}
        >
          <option value="">
            {documentTypesLoading
              ? "Loading document types…"
              : "All document types"}
          </option>

          {documentTypes.map((type) => (
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

      {/* ======================================================
          TABLE
      ====================================================== */}

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
                  "Document Type",
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
              {/* ==================================================
                  LOADING
              ================================================== */}

              {isFetching && !rows.length && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#6B7B7C]">
                    Loading documents…
                  </td>
                </tr>
              )}

              {/* ==================================================
                  GROUPS
              ================================================== */}

              {groups.map(([projectName, items]) => {
                const isCollapsed = !!collapsed[projectName];

                return (
                  <React.Fragment key={projectName}>
                    {/* ==========================================
                          PROJECT HEADER
                      ========================================== */}

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

                    {/* ==========================================
                          DOCUMENT ROWS
                      ========================================== */}

                    {!isCollapsed &&
                      items.map((document) => {
                        const title = getDocumentTitle(document);

                        const typeName = getDocumentTypeName(document);

                        const typeCode = getDocumentTypeCode(document);

                        return (
                          <tr
                            key={document.id}
                            onClick={() => openView(document)}
                            className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                            data-testid={`doc-row-${document.id}`}
                          >
                            {/* TITLE */}

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

                                <span title={title} className="truncate">
                                  {title}
                                </span>
                              </div>

                              {document.filename && (
                                <div className="text-[11px] text-[#8A9697] mt-0.5 truncate">
                                  {document.filename}
                                </div>
                              )}
                            </td>

                            {/* DOCUMENT TYPE */}

                            <td className="px-3 py-2.5">
                              <div className="font-medium text-[#333333]">
                                {typeName}
                              </div>

                              {typeCode && (
                                <div className="text-[10.5px] text-[#8A9697] mt-0.5">
                                  {typeCode}
                                </div>
                              )}
                            </td>

                            {/* VERSION */}

                            <td className="px-3 py-2.5">
                              {document.version || "V1"}
                            </td>

                            {/* STATUS */}

                            <td className="px-3 py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#EAEEF0] text-[#333333]">
                                {document.status || "draft"}
                              </span>
                            </td>

                            {/* UPLOADED BY */}

                            <td className="px-3 py-2.5 text-[#6B7B7C]">
                              {document.uploadedByName || "—"}
                            </td>

                            {/* DATE */}

                            <td className="px-3 py-2.5 text-[#6B7B7C]">
                              {formatDate(getDocumentDate(document))}
                            </td>

                            {/* ACTIONS */}

                            <td
                              className="px-3 py-2.5 text-right"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div className="inline-flex items-center gap-0.5">
                                {/* DOWNLOAD */}

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

                                {/* EDIT */}

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

                                {/* APPROVE */}

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

                                {/* DELETE */}

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
                        );
                      })}
                  </React.Fragment>
                );
              })}

              {/* ==================================================
                  EMPTY
              ================================================== */}

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

      {/* ======================================================
          VIEWER
      ====================================================== */}

      {viewing && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={closeView}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold truncate">
                  {getDocumentTitle(viewing)}
                </div>

                <div className="text-[12px] text-[#6B7B7C] truncate">
                  {viewing.project_name || "Unassigned"} ·{" "}
                  {getDocumentTypeName(viewing)} · {viewing.version || "V1"}
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

            {/* CONTENT */}

            <div className="flex-1 overflow-auto bg-[#F4F6F7] p-3">
              {pdfUrl ? (
                <iframe
                  title="pdf-viewer"
                  src={pdfUrl}
                  className="w-full h-[70vh] rounded"
                />
              ) : (viewing.mime || "").toLowerCase().startsWith("image/") ? (
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

      {/* ======================================================
          EDIT MODAL
      ====================================================== */}

      {editing && (
        <EditDocumentModal doc={editing} onClose={() => setEditing(null)} />
      )}
    </Shell>
  );
}

/* ============================================================
   EDIT DOCUMENT MODAL
============================================================ */

export function EditDocumentModal({ doc, onClose }) {
  const [form, setForm] = useState({
    title: doc.title || "",

    /*
     * API now uses documentTypeId.
     * Keep category only as fallback for older records.
     */
    documentTypeId: doc.documentTypeId || doc.document_type_id || "",

    category: doc.category || doc.documentType?.name || "",

    remarks: doc.remarks || "",

    projectId: doc.projectId || doc.project_id || "",
  });

  const [file, setFile] = useState(null);

  /* ==========================================================
     PROJECTS
  ========================================================== */

  const { data: projectsResponse } = useGetProjectsQuery({});

  const projects = useMemo(() => {
    if (Array.isArray(projectsResponse)) {
      return projectsResponse;
    }

    return projectsResponse?.data || projectsResponse?.projects || [];
  }, [projectsResponse]);

  /* ==========================================================
     DOCUMENT TYPES
  ========================================================== */

  const { data: documentTypesResponse, isLoading: documentTypesLoading } =
    useGetDocumentTypesQuery();

  const documentTypes = useMemo(() => {
    if (Array.isArray(documentTypesResponse)) {
      return documentTypesResponse;
    }

    return (
      documentTypesResponse?.data || documentTypesResponse?.documentTypes || []
    );
  }, [documentTypesResponse]);

  /* ==========================================================
     MUTATIONS
  ========================================================== */

  const [updateDocument, { isLoading: saving }] = useUpdateDocumentMutation();

  const [replaceDocumentFile, { isLoading: replacing }] =
    useReplaceDocumentFileMutation();

  /* ==========================================================
     FORM UPDATE
  ========================================================== */

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* ==========================================================
     SAVE
  ========================================================== */

  const save = async (event) => {
    event.preventDefault();

    try {
      /*
       * Send documentTypeId rather than
       * relying on category text.
       */

      const payload = {
        title: form.title,
        documentTypeId: form.documentTypeId || undefined,
        projectId: form.projectId || undefined,
        remarks: form.remarks || "",
      };

      await updateDocument({
        id: doc.id,
        data: payload,
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

  /* ==========================================================
     RENDER
  ========================================================== */

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
          {/* ==================================================
              TITLE
          ================================================== */}

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Title
            </label>

            <Input
              required
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
            />
          </div>

          {/* ==================================================
              DOCUMENT TYPE
          ================================================== */}

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Document Type
            </label>

            <select
              className="bc-input"
              value={form.documentTypeId}
              onChange={(event) =>
                updateForm("documentTypeId", event.target.value)
              }
              disabled={documentTypesLoading}
              required
            >
              <option value="">
                {documentTypesLoading
                  ? "Loading document types…"
                  : "Select document type"}
              </option>

              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                  {type.code ? ` (${type.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* ==================================================
              DOCUMENT PHASE / SECTION
          ================================================== */}

          {form.documentTypeId && (
            <DocumentTypeInfo
              documentTypes={documentTypes}
              documentTypeId={form.documentTypeId}
            />
          )}

          {/* ==================================================
              PROJECT
          ================================================== */}

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Project
            </label>

            <select
              className="bc-input"
              value={form.projectId}
              onChange={(event) => updateForm("projectId", event.target.value)}
            >
              <option value="">— Unassigned —</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name ||
                    project.projectName ||
                    project.title ||
                    project.code ||
                    project.id}
                </option>
              ))}
            </select>
          </div>

          {/* ==================================================
              REMARKS
          ================================================== */}

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Remarks
            </label>

            <textarea
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              value={form.remarks}
              onChange={(event) => updateForm("remarks", event.target.value)}
            />
          </div>

          {/* ==================================================
              FILE
          ================================================== */}

          <div>
            <label className="text-[12px] font-semibold mb-1 block">
              Replace file
            </label>

            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="text-[12px]"
            />

            {file && (
              <div className="mt-1 text-[11px] text-[#6B7B7C]">
                New file: {file.name}
              </div>
            )}
          </div>

          {/* ==================================================
              ACTIONS
          ================================================== */}

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

/* ============================================================
   DOCUMENT TYPE INFO
============================================================ */

function DocumentTypeInfo({ documentTypes, documentTypeId }) {
  const type = documentTypes.find((item) => item.id === documentTypeId);

  if (!type) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[#DDE5DF] bg-[#F4F8F5] px-3 py-2.5">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {type.phaseName && (
          <div>
            <span className="text-[#6B7B7C]">Phase:</span>{" "}
            <span className="font-semibold text-[#333333]">
              {type.phaseName}
            </span>
          </div>
        )}

        {type.sectionCode && (
          <div>
            <span className="text-[#6B7B7C]">Section:</span>{" "}
            <span className="font-semibold text-[#333333]">
              {type.sectionCode}
              {type.sectionName ? ` — ${type.sectionName}` : ""}
            </span>
          </div>
        )}
      </div>

      {type.description && (
        <div className="text-[11px] text-[#6B7B7C] mt-1">
          {type.description}
        </div>
      )}
    </div>
  );
}
