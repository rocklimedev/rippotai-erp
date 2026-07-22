import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Edit3, Trash2, Printer, FileText } from "lucide-react";
import { Shell, Card } from "../../hooks/shared";
import {
  useGetProjectBriefQuery,
  useDeleteProjectBriefMutation,
} from "../../api/brief.api";

const statusBadgeClass = (status) => {
  switch (status) {
    case "approved":
      return "bg-[#E4F3E8] text-[#1F7A3D]";
    case "submitted":
      return "bg-[#FDEFD9] text-[#B0740F]";
    default:
      return "bg-[#EAEEF0] text-[#333333]";
  }
};

export function ProjectBriefView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [lightbox, setLightbox] = useState(null);

  const {
    data: brief,
    isFetching,
    isError,
  } = useGetProjectBriefQuery(id, { skip: !id });

  const [deleteProjectBrief, { isLoading: deleting }] = useDeleteProjectBriefMutation();

  const removeBrief = async () => {
    if (!window.confirm("Delete this project brief? This cannot be undone.")) return;
    try {
      await deleteProjectBrief(id).unwrap();
      toast.success("Project brief deleted");
      nav("/documents/all");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to delete");
    }
  };

  const printReport = () => {
    window.print();
  };

  if (isFetching) {
    return (
      <Shell title="Project Brief">
        <div className="text-[13px] text-[#6B7B7C]">Loading…</div>
      </Shell>
    );
  }

  if (isError || !brief) {
    return (
      <Shell title="Project Brief">
        <Card>
          <div className="text-center text-[#B5C4B6] py-8">
            Project brief not found, or you don't have access to it.
          </div>
        </Card>
      </Shell>
    );
  }

  const project = brief.project || {};
  const sections = brief.sections || {};

  return (
    <Shell
      title="Project Brief Report"
      subtitle={`${project.name || "Project"} • ${brief.doc_no || ""}`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/documents/all")}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={() => nav(`/documents/brief/${id}/edit`)}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <Edit3 size={14} /> Edit
          </button>
          <button
            onClick={printReport}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <Printer size={14} /> Print
          </button>
          <button
            onClick={removeBrief}
            disabled={deleting}
            className="h-10 px-4 rounded-lg border border-[#E3B7A4] text-[13px] font-semibold text-[#B04D26] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      }
    >
      {/* A4 Styled Document */}
      <div className="max-w-4xl mx-auto bg-white shadow-sm border border-[#E5E5E5] print:shadow-none print:border-none">
        {/* Header */}
        <div className="border-b border-[#E5E5E5] px-10 py-8 bg-[#F8F9F8]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-semibold tracking-tight text-[#1F2937]">
                PROJECT BRIEF
              </div>
              <div className="text-lg text-[#4B5563] mt-1">{project.name}</div>
              <div className="text-sm text-[#6B7280] mt-0.5">{project.site_location}</div>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${statusBadgeClass(brief.status)}`}>
                {brief.status?.toUpperCase() || "DRAFT"}
              </div>
              <div className="mt-4 text-sm text-[#6B7280]">
                Document No: <span className="font-medium text-[#1F2937]">{brief.doc_no}</span>
              </div>
              <div className="text-sm text-[#6B7280]">
                Created: <span className="font-medium text-[#1F2937]">
                  {new Date(brief.created_at || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Render All Sections Dynamically */}
        {Object.entries(sections).map(([sectionTitle, fields]) => (
          <div key={sectionTitle} className="px-10 py-8 border-b border-[#E5E5E5]">
            <h2 className="text-lg font-semibold mb-6 text-[#1F2937] border-b pb-2">
              {sectionTitle}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
              {Object.entries(fields || {}).map(([key, value]) => {
                const label = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase());

                return (
                  <div key={key} className={typeof value === "string" && value.length > 100 ? "md:col-span-2" : ""}>
                    <span className="text-[#6B7280] block mb-1">{label}</span>
                    <span className="font-medium text-[#1F2937] whitespace-pre-wrap">
                      {value || "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="px-10 py-6 border-t text-xs text-[#6B7280] flex justify-between bg-[#F8F9F8]">
          <div>Generated on {new Date().toLocaleDateString()}</div>
          <div>Brief ID: {brief.id}</div>
        </div>
      </div>

      {/* Lightbox (if you add images later) */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.url}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </Shell>
  );
}