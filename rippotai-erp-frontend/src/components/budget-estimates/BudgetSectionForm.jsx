import React, { useMemo } from "react";
import { ArrowLeft } from "lucide-react";

import {
  Page,
  PageHeader,
  Button,
  Field,
  TextInput,
  SelectInput,
  TextArea,
  FormActions,
} from "@/components/inos";
import { DocSection, DocLayout, Grid, Affix, Check } from "@/components/forms/commerce-form-ui";

/**
 * Stacked, numbered-section form shell for budget estimates.
 * Field config: { key, label, type, placeholder, required, description (hint), fullWidth, options, affix: "₹" | "%" }
 */
export function BudgetSectionForm({
  title,
  subtitle,
  crumbs,
  sections = [],
  values = {},
  onFieldChange,
  projects = [],
  projectId = "",
  onProjectChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  renderSection,
  submitLabel = "Save estimate",
  aside,
  children,
}) {
  const filledCount = useMemo(() => {
    let count = 0;

    Object.values(values || {}).forEach((value) => {
      if (Array.isArray(value)) {
        if (value.length > 0) count++;
        return;
      }

      if (value !== "" && value !== null && value !== undefined) {
        count++;
      }
    });

    return count;
  }, [values]);

  const handleFieldChange = (section, key, value) => {
    if (!section) return;
    onFieldChange?.(section.key || section.title, key, value);
  };

  const renderControl = (section, field, fieldValue) => {
    const onChange = (event) => handleFieldChange(section, field.key, event.target.value);

    if (field.type === "textarea") {
      return <TextArea rows={field.rows || 4} value={fieldValue} placeholder={field.placeholder || ""} onChange={onChange} />;
    }
    if (field.type === "select") {
      return (
        <SelectInput value={fieldValue || ""} onChange={onChange} placeholder={field.placeholder || "Select…"}>
          {(field.options || []).map((option) => {
            const optionValue = typeof option === "object" ? option.value : option;
            const optionLabel = typeof option === "object" ? option.label : option;
            return (
              <option key={optionValue} value={String(optionValue)}>
                {optionLabel}
              </option>
            );
          })}
        </SelectInput>
      );
    }
    if (field.type === "checkbox") {
      return (
        <div style={{ minHeight: 40, display: "flex", alignItems: "center" }}>
          <Check checked={Boolean(fieldValue)} onChange={(e) => handleFieldChange(section, field.key, e.target.checked)}>
            {field.checkboxLabel || field.label}
          </Check>
        </div>
      );
    }
    const input = (
      <TextInput
        type={field.type || "text"}
        min={field.min}
        max={field.max}
        step={field.type === "number" ? field.step || "0.01" : undefined}
        inputMode={field.type === "number" ? "decimal" : undefined}
        value={fieldValue}
        placeholder={field.placeholder || ""}
        onChange={onChange}
        style={field.type === "number" ? { textAlign: "right" } : undefined}
      />
    );
    if (field.affix === "₹") return <Affix pre="₹">{input}</Affix>;
    if (field.affix === "%") return <Affix post="%">{input}</Affix>;
    return input;
  };

  const renderFields = (section) => (
    <Grid cols={section.columns || 2}>
      {(section?.fields || []).map((field) => {
        const sectionKey = section.key || section.title;
        const sectionData = values?.[sectionKey] || {};
        const fieldValue = sectionData?.[field.key] ?? values?.[field.key] ?? "";

        return (
          <Field
            key={field.key}
            label={field.type === "checkbox" ? null : field.label}
            required={field.required}
            hint={field.description}
            full={field.fullWidth}
          >
            {renderControl(section, field, fieldValue)}
          </Field>
        );
      })}
    </Grid>
  );

  const renderSectionBody = (section) => {
    if (section?.type && renderSection) {
      return renderSection(section);
    }
    return renderFields(section);
  };

  const hasProjects = projects?.length > 0;
  const offset = hasProjects ? 1 : 0;

  const body = (
    <>
      {hasProjects && (
        <DocSection step={1} title="Project" description="Which project this estimate is for.">
          <Grid cols={2}>
            <Field label="Project" required htmlFor="bsf-project">
              <SelectInput
                id="bsf-project"
                value={projectId || ""}
                onChange={(e) => onProjectChange?.(e.target.value)}
                placeholder="Select project"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </Grid>
        </DocSection>
      )}

      {sections.map((section, index) => (
        <DocSection
          key={section.key || section.title}
          step={index + 1 + offset}
          title={section.title}
          description={section.description}
          actions={section.actions}
        >
          {renderSectionBody(section)}
        </DocSection>
      ))}
    </>
  );

  return (
    <Page width={aside ? undefined : "form"}>
      <PageHeader
        crumbs={crumbs}
        title={title}
        subtitle={subtitle}
        actions={
          onCancel && (
            <Button variant="ghost" icon={ArrowLeft} onClick={onCancel}>
              Back
            </Button>
          )
        }
      />

      <form
        className="inos-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
      >
        {aside ? <DocLayout aside={aside}>{body}</DocLayout> : body}
        {children}
        <FormActions
          note={`Draft autosaves on this device · ${filledCount} field${filledCount !== 1 ? "s" : ""} filled`}
          onCancel={onCancel}
          submitLabel={submitLabel}
          submitting={isSubmitting}
        />
      </form>
    </Page>
  );
}

export default BudgetSectionForm;
