import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  ImageOff,
  ExternalLink,
} from "lucide-react";

import { Shell, Card } from "../../hooks/shared";
import { useGetDrawingByIdQuery } from "../../api/documents/drawing.api";

const statusBadgeClass = (status) =>
  String(status || "").toLowerCase() === "superseded"
    ? "bg-[#EAEEF0] text-[#6B7B7C]"
    : "bg-[#D8E0DA] text-[#333333]";

const formatBytes = (bytes) => {
  if (bytes === null || bytes === undefined) return "—";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(1)} ${units[index]}`;
};

const formatDate = (date) => {
  if (!date) return "—";

  return String(date).slice(0, 10);
};

const Field = ({ label, children }) => (
  <div>
    <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C]">
      {label}
    </div>

    <div className="text-[14px] text-[#333333] mt-0.5">{children ?? "—"}</div>
  </div>
);

export default function DrawingsView() {
  const { id } = useParams();
  const nav = useNavigate();

  const {
    data: drawing,
    isFetching,
    isError,
  } = useGetDrawingByIdQuery(id, {
    skip: !id,
  });

  if (isFetching) {
    return (
      <Shell title="Drawing" subtitle="Loading…">
        <div className="text-[13px] text-[#6B7B7C]">Loading drawing…</div>
      </Shell>
    );
  }

  if (isError || !drawing) {
    return (
      <Shell title="Drawing" subtitle="Not found">
        <Card>
          <div className="text-center text-[#6B7B7C] py-8">
            Drawing not found, or you don't have access to it.
          </div>
        </Card>
      </Shell>
    );
  }

  /*
   * ---------------------------------------------------------
   * IMPORTANT
   * ---------------------------------------------------------
   * Your API response stores the actual uploaded file inside
   * drawing.revisions[].
   *
   * Example:
   *
   * drawing.revisions[0].url
   * drawing.revisions[0].mime
   * drawing.revisions[0].filename
   * drawing.revisions[0].size
   */

  const revisions = Array.isArray(drawing.revisions) ? drawing.revisions : [];

  /*
   * Prefer the latest revision.
   *
   * If your backend guarantees revisions are already sorted,
   * this is enough. Otherwise, sorting by created_at gives us
   * the newest uploaded revision.
   */
  const latestRevision =
    revisions.length > 0
      ? [...revisions].sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();

          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();

          return dateB - dateA;
        })[0]
      : null;

  /*
   * File information comes from the revision.
   */
  const fileUrl = latestRevision?.url || null;
  const mime = latestRevision?.mime || "";
  const filename = latestRevision?.filename || "Drawing file";

  const isImage = mime.startsWith("image/");
  const isPdf =
    mime === "application/pdf" || mime.toLowerCase().includes("pdf");

  /*
   * The document-level status and metadata are here.
   * Revision-level status and metadata are in latestRevision.
   */
  const documentStatus = drawing.status || latestRevision?.status;

  const revision = latestRevision?.revision || drawing.revision || "—";

  const issueDate = latestRevision?.issueDate || drawing.issueDate;

  const issuePurpose = latestRevision?.issuePurpose || drawing.issuePurpose;

  const remarks = latestRevision?.remarks || drawing.remarks;

  const fileSize = latestRevision?.size;

  const createdAt =
    latestRevision?.created_at ||
    latestRevision?.createdAt ||
    drawing.created_at ||
    drawing.createdAt;

  const updatedAt =
    latestRevision?.updated_at ||
    latestRevision?.updatedAt ||
    drawing.updated_at ||
    drawing.updatedAt;

  /*
   * ---------------------------------------------------------
   * DOWNLOAD
   * ---------------------------------------------------------
   */

  const handleDownload = () => {
    if (!fileUrl) return;

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <Shell
      title={drawing.title || "Untitled Drawing"}
      subtitle={`${drawing.project_name || "Unassigned"} · Rev. ${revision}`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/design-studio/all")}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 hover:bg-[#F4F6F7] transition"
          >
            <ArrowLeft size={14} />
            All Drawings
          </button>

          {fileUrl && (
            <button
              onClick={handleDownload}
              className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#16382F] transition"
              data-testid="drawing-download"
            >
              <Download size={14} />
              Download
            </button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* =====================================================
            PREVIEW
        ====================================================== */}

        <Card className="lg:col-span-2">
          <div className="bg-[#F4F6F7] rounded-lg min-h-[420px] flex items-center justify-center overflow-hidden">
            {!fileUrl ? (
              <div className="text-center py-16 text-[#6B7B7C]">
                <ImageOff size={40} className="mx-auto mb-3 text-[#B5C4B6]" />

                <div className="text-[13px]">
                  No file uploaded for this drawing.
                </div>
              </div>
            ) : isImage ? (
              /*
               * =================================================
               * IMAGE PREVIEW
               * =================================================
               */

              <div className="w-full h-full min-h-[420px] flex items-center justify-center p-4">
                <img
                  src={fileUrl}
                  alt={drawing.title || filename}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                  onError={(event) => {
                    console.error("Drawing image failed to load:", fileUrl);

                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : isPdf ? (
              /*
               * =================================================
               * PDF PREVIEW
               * =================================================
               */

              <iframe
                title="drawing-pdf"
                src={fileUrl}
                className="w-full h-[70vh] rounded-lg border-0"
              />
            ) : (
              /*
               * =================================================
               * UNSUPPORTED FILE
               * =================================================
               */

              <div className="text-center py-16 text-[#6B7B7C]">
                <FileText size={40} className="mx-auto mb-3 text-[#B5C4B6]" />

                <div className="text-[13px]">
                  Preview not available for this file type.
                </div>

                <div className="text-[12px] mt-1">
                  {mime || "Unknown file type"}
                </div>

                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1F453B] hover:underline"
                >
                  <ExternalLink size={14} />
                  Open File
                </a>
              </div>
            )}
          </div>
        </Card>

        {/* =====================================================
            DETAILS
        ====================================================== */}

        <Card>
          <div className="space-y-4">
            {/* FILE NAME */}

            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#B5C4B6] shrink-0" />

              <span
                className="text-[13.5px] font-semibold text-[#333333] truncate"
                title={filename}
              >
                {filename}
              </span>
            </div>

            {/* STATUS */}

            <div>
              <span
                className={`px-2 py-0.5 rounded-full text-[11.5px] font-semibold ${statusBadgeClass(
                  documentStatus,
                )}`}
              >
                {documentStatus || "—"}
              </span>
            </div>

            {/* BASIC INFORMATION */}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Drawing No.">
                <span className="font-mono">
                  {drawing.drawingNumber || "—"}
                </span>
              </Field>

              <Field label="Discipline">{drawing.discipline || "—"}</Field>

              <Field label="Revision">{revision}</Field>

              <Field label="Issue Date">{formatDate(issueDate)}</Field>

              <Field label="Project">{drawing.project_name || "—"}</Field>

              <Field label="File Size">{formatBytes(fileSize)}</Field>

              <Field label="Document Type">
                {drawing.documentType?.name || "—"}
              </Field>

              <Field label="Phase">
                {drawing.documentType?.phaseName || drawing.phaseCode || "—"}
              </Field>

              <Field label="Sheet Number">{drawing.sheetNumber || "—"}</Field>

              <Field label="Scale">{drawing.scale || "—"}</Field>
            </div>

            {/* ISSUE PURPOSE */}

            <Field label="Issue Purpose">{issuePurpose || "—"}</Field>

            {/* REMARKS */}

            <Field label="Remarks">{remarks || "—"}</Field>

            {/* REVISION INFORMATION */}

            <div className="pt-3 border-t border-[rgba(31,69,59,0.08)]">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C] mb-3">
                Revision Information
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Revision">{revision}</Field>

                <Field label="Revision Status">
                  {latestRevision?.status || "—"}
                </Field>

                <Field label="Uploaded By">
                  {latestRevision?.uploadedByName ||
                    latestRevision?.uploadedBy ||
                    "—"}
                </Field>

                <Field label="Revision Date">
                  {formatDate(
                    latestRevision?.issueDate || latestRevision?.created_at,
                  )}
                </Field>
              </div>
            </div>

            {/* DATES */}

            <div className="pt-3 border-t border-[rgba(31,69,59,0.08)] grid grid-cols-2 gap-4">
              <Field label="Uploaded">{formatDate(createdAt)}</Field>

              <Field label="Last Updated">{formatDate(updatedAt)}</Field>
            </div>

            {/* DOCUMENT TYPE DETAILS */}

            {drawing.documentType && (
              <div className="pt-3 border-t border-[rgba(31,69,59,0.08)]">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C] mb-3">
                  Document Type
                </div>

                <div className="space-y-3">
                  <Field label="Code">
                    <span className="font-mono text-[12px]">
                      {drawing.documentType.code || "—"}
                    </span>
                  </Field>

                  <Field label="Section">
                    {drawing.documentType.sectionCode
                      ? `${drawing.documentType.sectionCode} · ${
                          drawing.documentType.sectionName || ""
                        }`
                      : "—"}
                  </Field>

                  <Field label="Requirement">
                    {drawing.documentType.requirementType || "—"}
                  </Field>

                  <Field label="Approval Required">
                    {drawing.documentType.requiresApproval ? "Yes" : "No"}
                  </Field>
                </div>
              </div>
            )}

            {/* ALL REVISIONS */}

            {revisions.length > 1 && (
              <div className="pt-3 border-t border-[rgba(31,69,59,0.08)]">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B7B7C] mb-3">
                  Revisions
                </div>

                <div className="space-y-2">
                  {revisions.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-[#F4F6F7] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#333333]">
                          Rev. {item.revision || "—"}
                        </div>

                        <div className="text-[11px] text-[#6B7B7C] truncate">
                          {item.filename || "File"}
                        </div>
                      </div>

                      <div className="text-[11px] text-[#6B7B7C] shrink-0 ml-3">
                        {formatDate(item.issueDate || item.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
