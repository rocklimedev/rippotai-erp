import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, FileSpreadsheet } from "lucide-react";

import { useCreateBoqMutation, useGetTemplatesQuery } from "../../api/boq.api";
import { useGetProjectsQuery } from "../../api/project.api";
import NewProjectModal from "../../components/projects/CreateNewProject";
const CREATE_NEW_PROJECT = "__create_new_project__";

export default function BoqNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const {
    data: projects = [],
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useGetProjectsQuery({ limit: 50 });

  const {
    data: templates = [],
    isLoading: templatesLoading,
    isSuccess: templatesLoaded,
  } = useGetTemplatesQuery();

  const [createBoq, { isLoading: busy }] = useCreateBoqMutation();

  // Read template_id from URL
  useEffect(() => {
    const id = searchParams.get("template_id");

    if (id) {
      setTemplateId(id);
    } else {
      setTemplateId("");
    }
  }, [searchParams]);

  // Validate template
  useEffect(() => {
    if (!templatesLoaded) return;

    const found = templates.find((t) => t.id === templateId);

    if (!templateId) {
      return;
    }

    if (!found) {
      toast.error("Template not found.");
      setTemplateId("");
    }
  }, [templatesLoaded, templates, templateId]);

  const handleProjectSelectChange = (e) => {
    const value = e.target.value;

    if (value === CREATE_NEW_PROJECT) {
      // Don't actually set this as the projectId — open the modal instead.
      setShowNewProjectModal(true);
      return;
    }

    setProjectId(value);
  };

  const handleProjectCreated = async (project) => {
    // getProjects invalidates on createProject, but refetch explicitly too
    // so the new project is guaranteed to be in the list before we select it.
    await refetchProjects();
    setProjectId(project.id);
    toast.success(`"${project.name}" selected for this BOQ.`);
  };

  const submit = async (e) => {
    e.preventDefault();

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

      toast.success("BOQ created successfully.");

      navigate(`/boq/${boq.id}`);
    } catch (err) {
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Project *</label>

              <button
                type="button"
                onClick={() => setShowNewProjectModal(true)}
                className="text-xs font-medium text-[#1F453B] hover:underline"
              >
                + Create New Project
              </button>
            </div>

            <select
              className="bc-input"
              value={projectId}
              onChange={handleProjectSelectChange}
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

              <option value={CREATE_NEW_PROJECT}>+ Create New Project…</option>
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
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Template</label>

            <select
              className="bc-input"
              value={templateId}
              disabled={templatesLoading}
              onChange={(e) => setTemplateId(e.target.value)}
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

      <NewProjectModal
        open={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}
