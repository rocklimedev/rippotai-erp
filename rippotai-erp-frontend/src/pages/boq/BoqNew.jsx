import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { Page, PageHeader, Button, Field, TextInput, SelectInput, FormActions } from "@/components/inos";
import { DocSection, Grid } from "@/components/forms/commerce-form-ui";

import {
  useCreateBoqMutation,
  useGetTemplatesQuery,
} from "../../api/boq/boq.api";
import { useGetProjectsQuery } from "../../api/projects/project.api";
import NewProjectModal from "../../components/projects/CreateNewProject";
const CREATE_NEW_PROJECT = "__create_new_project__";

export default function BoqNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Preselect the project when arriving from a project page (?project_id=…).
  const [projectId, setProjectId] = useState(
    () => searchParams.get("project_id") || searchParams.get("projectId") || "",
  );
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

  const selectedTemplate = templates.find((t) => t.id === templateId);

  return (
    <Page width="form">
      <PageHeader
        crumbs={[
          { label: "Ledger", to: "/ledger" },
          { label: "BOQs", to: "/ledger/boq/all" },
          { label: "New" },
        ]}
        title="New bill of quantities"
        subtitle="Pick the project, optionally start from a template, then continue in the BOQ editor."
        actions={
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate("/boq")}>
            Back to BOQs
          </Button>
        }
      />

      <form onSubmit={submit} className="inos-form">
        <DocSection step={1} title="Project" description="Every BOQ belongs to one project.">
          <Grid cols={1}>
            <Field label="Project" required htmlFor="boq-project" hint="Not listed? Create it without leaving this page.">
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SelectInput
                    id="boq-project"
                    value={projectId}
                    onChange={handleProjectSelectChange}
                    disabled={projectsLoading}
                    required
                  >
                    <option value="">{projectsLoading ? "Loading projects…" : "Select project"}</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                    <option value={CREATE_NEW_PROJECT}>+ Create new project…</option>
                  </SelectInput>
                </div>
                <Button variant="secondary" icon={Plus} onClick={() => setShowNewProjectModal(true)}>
                  New project
                </Button>
              </div>
            </Field>
          </Grid>
        </DocSection>

        <DocSection step={2} title="Details" description="Both optional — you can change them in the editor.">
          <Grid cols={2}>
            <Field label="BOQ title" optional htmlFor="boq-title" hint="Leave blank to name it after the project.">
              <TextInput
                id="boq-title"
                value={title}
                placeholder={selectedProject ? `e.g. ${selectedProject.name} — interiors BOQ` : "e.g. Interiors BOQ"}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field
              label="Start from"
              htmlFor="boq-template"
              hint={selectedTemplate?.description || (templateId ? "Categories and items are copied from the template." : "An empty BOQ you fill in yourself.")}
            >
              <SelectInput
                id="boq-template"
                value={templateId}
                disabled={templatesLoading}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">{templatesLoading ? "Loading templates…" : "Blank BOQ"}</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </Grid>
        </DocSection>

        <FormActions
          onCancel={() => navigate("/boq")}
          submitLabel={
            busy ? (
              "Creating…"
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                Create & open editor <ArrowRight size={16} aria-hidden />
              </span>
            )
          }
          submitting={busy}
        />
      </form>

      <NewProjectModal
        open={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreated={handleProjectCreated}
      />
    </Page>
  );
}
