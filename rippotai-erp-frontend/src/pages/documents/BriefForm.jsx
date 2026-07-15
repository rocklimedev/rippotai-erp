import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SectionForm } from "../../components/SectionForm";
import { useAutoSave } from "../../hooks/use-autosave";
import { useGetProjectsQuery } from "../../api/project.api";
import { useCreateProjectBriefMutation } from "../../api/brief.api";
import { BRIEF_SECTIONS } from "../../hooks/brief-sections";

const SAVE_KEY = "bc.brief.draft";

export function BriefForm() {
  const nav = useNavigate();
  const { data: projects = [] } = useGetProjectsQuery();
  const [createProjectBrief, { isLoading }] = useCreateProjectBriefMutation();

  const [projectId, setProjectId] = useState("");
  const [values, setValues] = useAutoSave(SAVE_KEY, {});

  const handleFieldChange = (section, key, value) =>
    setValues((o) => ({
      ...o,
      [section]: { ...(o[section] || {}), [key]: value },
    }));

  const handleSubmit = async () => {
    if (!projectId) return toast.error("Select a project first");
    try {
      const data = await createProjectBrief({
        project_id: projectId,
        sections: values,
      }).unwrap();
      toast.success(
        `Generated ${data.doc_no} · ${(data.pdf_size / 1024).toFixed(1)} KB`,
      );
      localStorage.removeItem(SAVE_KEY);
      nav("/documents/all");
    } catch {
      toast.error("Submission failed");
    }
  };

  return (
    <SectionForm
      title="Project Brief"
      subtitle="Multi-section client brief · autosaved locally · generates a signed PDF"
      sections={BRIEF_SECTIONS}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
    />
  );
}
