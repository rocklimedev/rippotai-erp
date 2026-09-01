import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";
import {
  useGetDrawingsQuery,
  useCreateDrawingMutation,
  useAddDrawingRevisionMutation,
} from "../../api/drawing.api";

import { useGetDocumentTypesQuery } from "../../api/document.api";
import { useGetProjectsQuery } from "../../api/project.api";

/* =========================================================
   Drawings
========================================================= */

export function DrawingsAll({ projectId }) {
  const nav = useNavigate();

  /*
   * Backend requires:
   * GET /drawings?projectId=...
   *
   * If this page is meant to show drawings across ALL projects,
   * the backend controller will need a different endpoint.
   */
  const { data: rows = [], isLoading } = useGetDrawingsQuery(
    { projectId },
    {
      skip: !projectId,
    },
  );

  return (
    <Shell
      title="All Drawings"
      subtitle={`${rows.length} drawing${
        rows.length !== 1 ? "s" : ""
      } · revisions preserved`}
      action={
        <button
          type="button"
          onClick={() => nav("/design-studio/new")}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Upload size={14} />
          Upload Drawing
        </button>
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
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#6B7B7C]">
                    Loading drawings...
                  </td>
                </tr>
              )}

              {!isLoading &&
                rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => nav(`/documents/drawings/${r.id}`)}
                    className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                    data-testid={`drawing-row-${r.id}`}
                  >
                    <td className="px-3 py-2.5 font-mono font-semibold text-[#333333]">
                      {r.drawingNumber}
                    </td>

                    <td className="px-3 py-2.5">{r.title}</td>

                    <td className="px-3 py-2.5">{r.discipline || "—"}</td>

                    <td className="px-3 py-2.5">
                      {r.revisions?.[0]?.revision || "—"}
                    </td>

                    <td className="px-3 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11.5px] font-semibold ${
                          r.status === "Superseded"
                            ? "bg-[#EAEEF0] text-[#6B7B7C]"
                            : "bg-[#D8E0DA] text-[#333333]"
                        }`}
                      >
                        {r.status || "Draft"}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {(r.revisions?.[0]?.issueDate || r.updatedAt || "").slice(
                        0,
                        10,
                      )}
                    </td>
                  </tr>
                ))}

              {!isLoading && !rows.length && (
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

/* =========================================================
   Drawing Upload
========================================================= */

export function DrawingUpload() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    projectId: "",
    title: "",
    drawingNumber: "",
    documentTypeId: "",
    discipline: "Architecture",
    issuePurpose: "",
    status: "Draft",
    remarks: "",
  });

  const [revisionForm, setRevisionForm] = useState({
    revision: "A",
    issueDate: "",
    issuePurpose: "",
    status: "Draft",
    remarks: "",
    uploadedBy: "",
    uploadedByName: "",
  });

  const [file, setFile] = useState(null);

  const { data: projects = [] } = useGetProjectsQuery({});
  const { data: documentTypes = [], isLoading: documentTypesLoading } =
    useGetDocumentTypesQuery({
      isActive: true,
    });
  const [createDrawing, { isLoading: creating }] = useCreateDrawingMutation();

  const [addDrawingRevision, { isLoading: uploading }] =
    useAddDrawingRevisionMutation();

  const submitting = creating || uploading;

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateRevisionForm = (key, value) => {
    setRevisionForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.projectId) {
      toast.error("Please select a project");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Drawing title is required");
      return;
    }

    if (!form.drawingNumber.trim()) {
      toast.error("Drawing number is required");
      return;
    }

    if (!file) {
      toast.error("Pick a drawing file");
      return;
    }

    try {
      /*
       * STEP 1
       * Create drawing metadata.
       *
       * POST /drawings
       */
      const drawing = await createDrawing({
        projectId: form.projectId,
        documentTypeId: form.documentTypeId || undefined,
        title: form.title,
        drawingNumber: form.drawingNumber,
        discipline: form.discipline || undefined,
        issuePurpose: form.issuePurpose || undefined,
        status: form.status || "Draft",
        remarks: form.remarks || undefined,
      }).unwrap();

      /*
       * STEP 2
       * Upload the actual drawing file as a revision.
       *
       * POST /drawings/:id/revisions
       */
      await addDrawingRevision({
        id: drawing.id,
        data: {
          revision: revisionForm.revision || undefined,
          issueDate: revisionForm.issueDate || undefined,
          issuePurpose:
            revisionForm.issuePurpose || form.issuePurpose || undefined,
          status: revisionForm.status || form.status || "Draft",
          remarks: revisionForm.remarks || form.remarks || undefined,
          uploadedBy: revisionForm.uploadedBy || undefined,
          uploadedByName: revisionForm.uploadedByName || undefined,
        },
        file,
      }).unwrap();

      toast.success("Drawing uploaded successfully");

      nav(`/documents/drawings/${drawing.id}`);
    } catch (error) {
      console.error("Drawing upload failed:", error);

      toast.error(
        error?.data?.message || error?.message || "Failed to upload drawing",
      );
    }
  };

  return (
    <Shell
      title="Upload Drawing"
      subtitle="Create a drawing and upload its first revision"
    >
      <Card>
        <form onSubmit={submit} className="grid gap-3 max-w-2xl md:grid-cols-2">
          {/* Project */}
          <div className="md:col-span-2">
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Project
            </label>

            <select
              required
              className="bc-input h-10 w-full"
              value={form.projectId}
              onChange={(e) => updateForm("projectId", e.target.value)}
            >
              <option value="">Select project...</option>

              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {/* Document Type */}
          <div className="md:col-span-2">
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Document Type
            </label>

            <select
              required
              className="bc-input h-10 w-full"
              value={form.documentTypeId}
              onChange={(e) => updateForm("documentTypeId", e.target.value)}
              disabled={documentTypesLoading}
            >
              <option value="">
                {documentTypesLoading
                  ? "Loading document types..."
                  : "Select document type..."}
              </option>

              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          {/* Title */}
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Title
            </label>

            <Input
              required
              type="text"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
            />
          </div>

          {/* Drawing Number */}
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Drawing Number
            </label>

            <Input
              required
              type="text"
              value={form.drawingNumber}
              onChange={(e) => updateForm("drawingNumber", e.target.value)}
            />
          </div>

          {/* Discipline */}
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Discipline
            </label>

            <Input
              type="text"
              value={form.discipline}
              onChange={(e) => updateForm("discipline", e.target.value)}
            />
          </div>

          {/* Revision */}
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Revision
            </label>

            <Input
              type="text"
              value={revisionForm.revision}
              onChange={(e) => updateRevisionForm("revision", e.target.value)}
            />
          </div>

          {/* Issue Date */}
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Issue Date
            </label>

            <Input
              type="date"
              value={revisionForm.issueDate}
              onChange={(e) => updateRevisionForm("issueDate", e.target.value)}
            />
          </div>

          {/* Issue Purpose */}
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Issue Purpose
            </label>

            <Input
              type="text"
              value={form.issuePurpose}
              onChange={(e) => updateForm("issuePurpose", e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Status
            </label>

            <select
              className="bc-input h-10 w-full"
              value={form.status}
              onChange={(e) => updateForm("status", e.target.value)}
            >
              <option value="Draft">Draft</option>
              <option value="For Review">For Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Superseded">Superseded</option>
            </select>
          </div>

          {/* Remarks */}
          <div className="md:col-span-2">
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Remarks
            </label>

            <textarea
              className="bc-input min-h-[90px] w-full"
              value={form.remarks}
              onChange={(e) => updateForm("remarks", e.target.value)}
            />
          </div>

          {/* File */}
          <div className="md:col-span-2">
            <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
              Drawing File
            </label>

            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-[14px]"
            />

            {file && (
              <p className="mt-1 text-xs text-[#6B7B7C]">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="h-11 px-5 rounded-lg bg-[#1F453B] text-white font-semibold w-fit inline-flex items-center gap-2 md:col-span-2 disabled:opacity-60"
          >
            <Upload size={15} />

            {creating
              ? "Creating Drawing..."
              : uploading
                ? "Uploading Revision..."
                : "Upload Drawing"}
          </button>
        </form>
      </Card>
    </Shell>
  );
}
