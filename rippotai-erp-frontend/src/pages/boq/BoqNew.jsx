import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, FileSpreadsheet } from "lucide-react";

import { useCreateBoqMutation, useGetTemplatesQuery } from "../../api/boq.api";
import { useGetProjectsQuery } from "../../api/project.api";

export default function BoqNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("");

  const { data: projects = [], isLoading: projectsLoading } =
    useGetProjectsQuery({ limit: 50 });

  const {
    data: templates = [],
    isLoading: templatesLoading,
    isSuccess: templatesLoaded,
  } = useGetTemplatesQuery();

  const [createBoq, { isLoading: busy }] = useCreateBoqMutation();

  console.log("======================================");
  console.log("BoqNew Render");
  console.log("Current URL:", window.location.href);
  console.log("Search Params:", searchParams.toString());
  console.log("URL template_id:", searchParams.get("template_id"));
  console.log("Current templateId state:", templateId);
  console.log("Templates Loading:", templatesLoading);
  console.log("Templates:", templates);
  console.log("Projects:", projects);
  console.log("======================================");

  // Read template_id from URL
  useEffect(() => {
    const id = searchParams.get("template_id");

    console.log("Reading template_id from URL:", id);

    if (id) {
      setTemplateId(id);
    } else {
      setTemplateId("");
    }
  }, [searchParams]);

  // Validate template
  useEffect(() => {
    if (!templatesLoaded) return;

    console.log("Templates loaded.");

    console.log(
      "Available template ids:",
      templates.map((t) => t.id),
    );

    console.log("Current templateId:", templateId);

    const found = templates.find((t) => t.id === templateId);

    console.log("Found template:", found);

    if (!templateId) {
      console.log("No template selected.");
      return;
    }

    if (!found) {
      console.error("Template NOT FOUND.");

      toast.error("Template not found.");

      setTemplateId("");
    } else {
      console.log("Template successfully selected:", found);
    }
  }, [templatesLoaded, templates, templateId]);

  const submit = async (e) => {
    e.preventDefault();

    console.log("Submitting...");

    console.log({
      project_id: projectId,
      title,
      source_template_id: templateId,
    });

    if (!projectId) {
      toast.error("Please select a project.");
      return;
    }

    try {
      const boq = await createBoq({
        project_id: projectId,
        title: title || undefined,
        source_template_id: templateId || undefined,
      }).unwrap();

      console.log("BOQ Created:", boq);

      toast.success("BOQ created successfully.");

      navigate(`/boq/${boq.id}`);
    } catch (err) {
      console.error("Create BOQ Error:", err);

      toast.error(
        err?.data?.message || err?.data?.detail || "Failed to create BOQ.",
      );
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/boq")}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-5"
      >
        <ArrowLeft size={16} />
        Back to BOQ Dashboard
      </button>

      <div className="bc-card p-8">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-5">
          <FileSpreadsheet size={22} />
        </div>

        <p className="uppercase tracking-widest text-xs text-gray-400">
          Create BOQ
        </p>

        <h1 className="text-2xl font-bold mt-2">New Bill Of Quantities</h1>

        <p className="text-gray-500 text-sm mt-2 mb-6">
          Select a project and optionally create this BOQ from an existing
          template.
        </p>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium">Project *</label>

            <select
              className="bc-input"
              value={projectId}
              onChange={(e) => {
                console.log("Project Changed:", e.target.value);
                setProjectId(e.target.value);
              }}
              disabled={projectsLoading}
              required
            >
              <option value="">
                {projectsLoading ? "Loading projects..." : "Select Project"}
              </option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            {selectedProject && (
              <div className="mt-2 text-xs text-gray-500">
                Client: {selectedProject.client_name}
                <br />
                Location: {selectedProject.location}
              </div>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">BOQ Title</label>

            <input
              className="bc-input"
              value={title}
              placeholder="Auto generated from project"
              onChange={(e) => {
                console.log("Title Changed:", e.target.value);
                setTitle(e.target.value);
              }}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Template</label>

            <select
              className="bc-input"
              value={templateId}
              disabled={templatesLoading}
              onChange={(e) => {
                console.log("Template Changed:", e.target.value);
                setTemplateId(e.target.value);
              }}
            >
              <option value="">
                {templatesLoading ? "Loading templates..." : "Start Blank"}
              </option>

              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/boq")}
              className="h-11 px-5 rounded-xl border"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={busy}
              className="flex-1 h-11 rounded-xl bg-[#1F453B] text-white flex items-center justify-center gap-2"
            >
              {busy ? (
                "Creating..."
              ) : (
                <>
                  Create & Open Editor
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
