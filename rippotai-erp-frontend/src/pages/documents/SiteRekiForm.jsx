import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SectionForm } from "../../components/SectionForm";
import { AttachmentsPanel } from "../../components/AttachmentsPanel";
import { useAutoSave } from "../../hooks/use-autosave";
import { readAttachments, toAttachmentPayload } from "../../hooks/file-helpers";
import { useGetProjectsQuery } from "../../api/project.api";
import { useCreateSiteRekiMutation } from "../../api/reki.api";
import { REKI_SECTIONS } from "../../hooks/reki-sections";

const SAVE_KEY = "bc.reki.draft";

export function SiteRekiForm() {
  const nav = useNavigate();
  const { data: projects = [] } = useGetProjectsQuery();
  const [createSiteReki, { isLoading }] = useCreateSiteRekiMutation();

  const [projectId, setProjectId] = useState("");
  const [values, setValues] = useAutoSave(SAVE_KEY, {});
  const [attachments, setAttachments] = useState([]);

  const handleFieldChange = (section, key, value) =>
    setValues((o) => ({
      ...o,
      [section]: { ...(o[section] || {}), [key]: value },
    }));

  const handleAddFiles = async (fileList) => {
    const results = await readAttachments(fileList);
    setAttachments((a) => [...a, ...results]);
  };
  const handleRemove = (index) =>
    setAttachments((list) => list.filter((_, j) => j !== index));
  const handleRemarkChange = (index, remark) =>
    setAttachments((list) =>
      list.map((a, j) => (j === index ? { ...a, remark } : a)),
    );

  const handleSubmit = async () => {
    if (!projectId) return toast.error("Select a project first");
    try {
      const body = { project_id: projectId, sections: values };
      if (attachments.length) {
        body.attachments = toAttachmentPayload(attachments);
      }
      const data = await createSiteReki(body).unwrap();
      const attMsg = data.attachments?.length
        ? ` · ${data.attachments.length} attachment(s)`
        : "";
      toast.success(
        `Generated ${data.doc_no} · ${(data.pdf_size / 1024).toFixed(1)} KB${attMsg}`,
      );
      localStorage.removeItem(SAVE_KEY);
      nav(`/documents/site-reki/${data.id}`);
    } catch {
      toast.error("Submission failed");
    }
  };

  return (
    <SectionForm
      title="Site Reki"
      subtitle="Site survey · autosaves every keystroke · generates a Noto-Sans PDF with rooms table"
      sections={REKI_SECTIONS}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
    >
      <AttachmentsPanel
        attachments={attachments}
        onAddFiles={handleAddFiles}
        onRemove={handleRemove}
        onRemarkChange={handleRemarkChange}
      />
    </SectionForm>
  );
}
