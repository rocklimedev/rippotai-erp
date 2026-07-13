import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, FileSpreadsheet } from "lucide-react";

import { useCreateBoqMutation, useGetTemplatesQuery } from "../../api/boq.api";
import { useGetProjectsQuery } from "../../api/project.api";

export default function BoqNew() {
  const nav = useNavigate();
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("");

  const { data: projects = [], isLoading: projectsLoading } =
    useGetProjectsQuery({ limit: 50 });
  const { data: templates = [], isLoading: templatesLoading } =
    useGetTemplatesQuery();

  const [createBoq, { isLoading: busy }] = useCreateBoqMutation();

  const submit = async (e) => {
    e.preventDefault();
    if (!projectId) {
      toast.error("Please pick a project");
      return;
    }
    try {
      const data = await createBoq({
        project_id: projectId,
        title: title || undefined,
        template_id: templateId || undefined,
      }).unwrap();
      toast.success("BOQ created");
      nav(`/boq/${data.id}`);
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to create BOQ");
    }
  };

  const project = projects.find((p) => p.id === projectId);

  return (
    <div className="max-w-2xl mx-auto" data-testid="boq-new-page">
      <button
        onClick={() => nav("/boq")}
        className="text-[13px] text-[#6B7B7C] hover:text-[#333333] flex items-center gap-1 mb-4"
      >
        <ArrowLeft size={14} /> Back to BOQ Dashboard
      </button>
      <div className="bc-card p-8">
        <div className="w-12 h-12 rounded-2xl bg-[#EAEEF0] flex items-center justify-center mb-5">
          <FileSpreadsheet size={20} className="text-[#333333]" />
        </div>
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
          Create BOQ · Step 1 of 1
        </div>
        <h1 className="text-2xl font-bold text-[#333333] tracking-tight">
          New Bill of Quantities
        </h1>
        <p className="text-[13px] text-[#6B7B7C] mt-1 mb-6">
          Pick a project and (optionally) a template. You can add categories,
          items, units and rates in the editor.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
              Project *
            </label>
            <select
              className="bc-input"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              disabled={projectsLoading}
              data-testid="boq-new-project"
            >
              <option value="">
                {projectsLoading ? "Loading projects…" : "Select a project…"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {project && (
              <div className="mt-2 text-[11.5px] text-[#B5C4B6]">
                Client:{" "}
                <span className="text-[#6B7B7C]">{project.client_name}</span> ·
                Location:{" "}
                <span className="text-[#6B7B7C]">{project.location}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
              BOQ Title (optional)
            </label>
            <input
              className="bc-input"
              placeholder="Auto-generated from project"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="boq-new-title"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
              Template (optional)
            </label>
            <select
              className="bc-input"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              disabled={templatesLoading}
              data-testid="boq-new-template"
            >
              <option value="">
                {templatesLoading ? "Loading templates…" : "Start blank"}
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => nav("/boq")}
              className="h-11 px-4 rounded-xl border border-[#B5C4B6] bg-white hover:bg-[#EAEEF0] text-[13px] font-semibold text-[#6B7B7C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-11 flex-1 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              data-testid="boq-new-submit"
            >
              {busy ? (
                "Creating…"
              ) : (
                <>
                  Create & Open Editor <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}