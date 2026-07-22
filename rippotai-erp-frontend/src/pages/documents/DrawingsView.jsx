import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, ImageOff } from "lucide-react";

import { Shell, Card } from "../../hooks/shared"; // adjust to wherever these live
import { useGetDrawingByIdQuery } from "../../api/drawing.api"; // adjust to wherever drawingApi is defined

const statusBadgeClass = (status) =>
  status === "superseded"
    ? "bg-[#EAEEF0] text-[#6B7B7C]"
    : "bg-[#D8E0DA] text-[#333333]";

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let val = bytes / 1024;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i += 1;
  }
  return `${val.toFixed(1)} ${units[i]}`;
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
  const { id } = useParams(); // route: /documents/drawings/:id
  const nav = useNavigate();

  const {
    data: drawing,
    isFetching,
    isError,
  } = useGetDrawingByIdQuery(id, { skip: !id });

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
          <div className="text-center text-[#B5C4B6] py-8">
            Drawing not found, or you don't have access to it.
          </div>
        </Card>
      </Shell>
    );
  }

  const isImage = (drawing.mime || "").startsWith("image/");
  const isPdf = (drawing.mime || "").includes("pdf");

  return (
    <Shell
      title={drawing.title || "Untitled Drawing"}
      subtitle={`${drawing.project_name || "Unassigned"} · Rev. ${drawing.revision || "—"}`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/documents/drawings")}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> All Drawings
          </button>
          <a
            href={drawing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1.5"
            data-testid="drawing-download"
          >
            <Download size={14} /> Download
          </a>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="bg-[#F4F6F7] rounded-lg min-h-[420px] flex items-center justify-center overflow-hidden">
            {isImage ? (
              <img
                src={drawing.url}
                alt={drawing.title || drawing.filename}
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : isPdf ? (
              <iframe
                title="drawing-pdf"
                src={drawing.url}
                className="w-full h-[70vh] rounded"
              />
            ) : (
              <div className="text-center py-16 text-[#6B7B7C]">
                <ImageOff size={40} className="mx-auto mb-3 text-[#B5C4B6]" />
                <div className="text-[13px]">
                  Preview not available for this file type.
                </div>
                <div className="text-[12px] mt-1">
                  Use the Download button to open it locally.
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#B5C4B6] shrink-0" />
              <span
                className="text-[13.5px] font-semibold text-[#333333] truncate"
                title={drawing.filename}
              >
                {drawing.filename}
              </span>
            </div>

            <div>
              <span
                className={`px-2 py-0.5 rounded-full text-[11.5px] font-semibold ${statusBadgeClass(drawing.status)}`}
              >
                {drawing.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Drawing No.">
                <span className="font-mono">
                  {drawing.drawingNumber || "—"}
                </span>
              </Field>
              <Field label="Discipline">{drawing.discipline}</Field>
              <Field label="Revision">{drawing.revision}</Field>
              <Field label="Issue Date">
                {(drawing.issueDate || "").slice(0, 10) || "—"}
              </Field>
              <Field label="Project">{drawing.project_name}</Field>
              <Field label="File Size">{formatBytes(drawing.size)}</Field>
            </div>

            <Field label="Issue Purpose">{drawing.issuePurpose}</Field>
            <Field label="Remarks">{drawing.remarks}</Field>

            <div className="pt-3 border-t border-[rgba(31,69,59,0.08)] grid grid-cols-2 gap-4">
              <Field label="Uploaded">
                {(drawing.createdAt || "").slice(0, 10) || "—"}
              </Field>
              <Field label="Last Updated">
                {(drawing.updatedAt || "").slice(0, 10) || "—"}
              </Field>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}