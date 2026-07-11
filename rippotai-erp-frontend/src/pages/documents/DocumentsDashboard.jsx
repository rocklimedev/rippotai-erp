import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { RefreshCw, Plus, FolderOpen, FileText } from "lucide-react";

export default function DocumentsDashboard() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const load = () => {
    setLoading(true);
    api
      .get("/documents/project-cards")
      .then((r) => setCards(r.data || []))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const openAdd = (projectId) => {
    // Navigate to upload page pre-selecting the project
    nav(`/documents/upload?project_id=${projectId}`);
  };

  return (
    <div>
      <div
        className="flex items-center justify-between mb-4 gap-3 flex-wrap"
        data-testid="dashboard-header-documents"
      >
        <div className="min-w-0">
          <h1
            className="text-[36px] font-bold text-[#333333] truncate"
            style={{ fontFamily: "Poppins" }}
          >
            Documents
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            data-testid="dashboard-refresh-documents"
            onClick={load}
            title="Refresh dashboard data"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[rgba(31,69,59,0.14)] bg-white text-[#333333] hover:bg-[#F4F6F7]"
            aria-label="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            data-testid="dashboard-cta-documents"
            onClick={() => nav("/documents/upload")}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold hover:opacity-90"
            style={{ backgroundColor: "#1F453B" }}
          >
            <Plus size={14} /> Add Document
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[13px] text-[#B5C4B6]">
          Loading projects…
        </div>
      ) : cards.length === 0 ? (
        <div className="py-16 text-center text-[#B5C4B6]">
          <FolderOpen size={40} className="mx-auto mb-3 text-[#B5C4B6]" />
          <div className="text-[13px]">No projects yet.</div>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
          data-testid="documents-project-grid"
        >
          {cards.map((c) => (
            <div
              key={c.project_id}
              data-testid={`project-card-${c.project_id}`}
              className="bc-card p-5 group cursor-pointer hover:shadow-md transition-shadow relative"
              onClick={() => nav(`/documents/all?project_id=${c.project_id}`)}
              role="button"
              tabIndex={0}
            >
              <button
                data-testid={`project-card-add-${c.project_id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openAdd(c.project_id);
                }}
                title="Add document to this project"
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-[#1F453B] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-100"
              >
                <Plus size={16} />
              </button>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#EAEEF0] text-[#333333] flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1 pr-8">
                  <div
                    title={c.project_name}
                    className="text-[15px] font-semibold text-[#333333] truncate"
                    style={{ fontFamily: "Poppins" }}
                  >
                    {c.project_name || "—"}
                  </div>
                  <div
                    title={c.client_name || ""}
                    className="text-[12px] text-[#6B7B7C] truncate"
                  >
                    {c.client_name || c.location || "—"}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[rgba(31,69,59,0.08)] pt-3">
                <div className="text-[32px] font-bold text-[#333333] leading-none">
                  {c.count}
                </div>
                <div className="text-[11px] text-[#6B7B7C] uppercase tracking-widest">
                  documents
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
