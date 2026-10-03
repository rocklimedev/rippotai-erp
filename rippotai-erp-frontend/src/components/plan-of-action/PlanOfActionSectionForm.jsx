import React from "react";
import { useNavigate } from "react-router-dom";

import { Button, Field, TextInput, TextArea, FormActions } from "@/components/inos";
import {
  DocFormLayout,
  DocSection,
  ProjectPicker,
  OptionSelect,
  isFilled,
  slugId,
  useAutosaveNote,
} from "@/components/forms/crm-form-ui";

/**
 * Shared multi-section form shell used by Plan of Action (and similar docs).
 *
 * - Simple sections (e.g. Overview) render a field grid from `section.fields`.
 * - Typed sections (phases / team / terms) are delegated to `renderSection`.
 *
 * Optional extras (additive, API otherwise unchanged):
 *   crumbs, onSaveDraft, onCancel,
 *   sectionMeta: { [section.title]: { description, done, count, actions } }
 */
export function PlanOfActionSectionForm({
  title,
  subtitle,
  sections,
  values,
  onFieldChange,
  projects,
  projectId,
  onProjectChange,
  onSubmit,
  isSubmitting,
  renderSection,
  submitLabel,
  children,
  crumbs,
  onSaveDraft,
  onCancel,
  sectionMeta = {},
  autosave = true,
}) {
  const navigate = useNavigate();
  const autosaveNote = useAutosaveNote(values, { enabled: autosave });

  // Filled count for both simple and complex forms
  const filledCount = React.useMemo(() => {
    let count = 0;

    Object.values(values || {}).forEach((val) => {
      if (Array.isArray(val)) {
        count += val.length > 0 ? 1 : 0;
      } else if (typeof val === "object" && val !== null) {
        count += Object.values(val).filter(
          (v) =>
            v !== "" &&
            v !== null &&
            v !== undefined &&
            !(Array.isArray(v) && v.length === 0),
        ).length;
      } else if (val !== "" && val !== null && val !== undefined) {
        count++;
      }
    });

    return count;
  }, [values]);

  // Renders the plain field grid for a given section (values nested by section title)
  const renderFields = (section) => (
    <div className="inos-form-grid">
      {(section?.fields || []).map((field) => {
        const sectionData = values?.[section.title] || {};
        const fieldValue = sectionData?.[field.key] ?? "";
        const set = (v) => onFieldChange(section.title, field.key, v);
        const wide = field.type === "textarea" || field.type === "text" || field.fullWidth;

        return (
          <Field
            key={field.key}
            label={field.label}
            required={field.required}
            hint={field.hint}
            full={wide}
          >
            {field.type === "textarea" ? (
              <TextArea
                rows={field.rows || 4}
                value={fieldValue}
                placeholder={field.placeholder || ""}
                onChange={(e) => set(e.target.value)}
              />
            ) : field.type === "date" ? (
              <TextInput type="date" value={fieldValue} onChange={(e) => set(e.target.value)} />
            ) : field.type === "time" ? (
              <TextInput type="time" value={fieldValue} onChange={(e) => set(e.target.value)} />
            ) : field.type === "select" ? (
              <OptionSelect value={fieldValue} options={field.options || []} onChange={set} />
            ) : (
              <TextInput
                type={field.type || "text"}
                inputMode={field.type === "number" ? "numeric" : undefined}
                min={field.type === "number" ? 0 : undefined}
                value={fieldValue}
                placeholder={field.placeholder || ""}
                onChange={(e) => set(e.target.value)}
              />
            )}
          </Field>
        );
      })}
    </div>
  );

  const isCustomSection = (section) => Boolean(section?.type && renderSection);

  const renderSectionBody = (section) => {
    if (isCustomSection(section)) {
      return renderSection(section);
    }
    return renderFields(section);
  };

  const defaultDone = (section) => {
    if (isCustomSection(section)) return false;
    return (section?.fields || []).some((f) => isFilled(values?.[section.title]?.[f.key]));
  };

  const projectSectionId = "sec-project";
  const nav = [
    { id: projectSectionId, label: "Project", done: Boolean(projectId) },
    ...(sections || []).map((section, i) => {
      const meta = sectionMeta[section.title] || {};
      return {
        id: slugId(section.title || section.type, i),
        label: section.title,
        done: meta.done ?? defaultDone(section),
        count: meta.count,
      };
    }),
  ];

  return (
    <DocFormLayout crumbs={crumbs} title={title} subtitle={subtitle} nav={nav}>
      <DocSection
        id={projectSectionId}
        step={1}
        title="Project"
        description="Which project is this document for?"
        done={Boolean(projectId)}
      >
        <ProjectPicker projects={projects || []} value={projectId} onChange={onProjectChange} />
      </DocSection>

      {(sections || []).map((section, index) => {
        const meta = sectionMeta[section.title] || {};
        return (
          <DocSection
            key={section.title || section.type || index}
            id={nav[index + 1].id}
            step={index + 2}
            title={section.title}
            description={meta.description || section.description}
            done={nav[index + 1].done}
            actions={meta.actions}
          >
            {renderSectionBody(section)}
          </DocSection>
        );
      })}

      <FormActions
        note={autosaveNote || `${filledCount} field${filledCount !== 1 ? "s" : ""} completed`}
        extra={
          onSaveDraft && (
            <Button variant="secondary" onClick={onSaveDraft}>
              Save draft
            </Button>
          )
        }
        onCancel={onCancel || (() => navigate(-1))}
        submitLabel={isSubmitting ? "Saving…" : submitLabel || "Save plan of action"}
        submitDisabled={isSubmitting}
        onSubmit={onSubmit}
      />

      {children}
    </DocFormLayout>
  );
}

export default PlanOfActionSectionForm;
