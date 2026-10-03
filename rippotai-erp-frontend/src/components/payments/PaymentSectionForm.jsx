import React from "react";
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
import { DocSection, DocLayout, Grid } from "@/components/forms/commerce-form-ui";

/**
 * Generic multi-section form shell.
 *
 * Renders every section stacked vertically as one continuous form:
 * numbered sections, labels above fields, one sticky action bar.
 * Optional: crumbs, onCancel, aside (sticky summary on wide screens).
 */
export function PaymentSectionForm({
  title,
  subtitle,
  crumbs,
  sections,
  values,
  onFieldChange,
  projects,
  projectId,
  onProjectChange,
  disableProject,
  onSubmit,
  onCancel,
  isSubmitting,
  renderSection,
  submitLabel,
  aside,
  children,
}) {
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

  // Renders the plain field grid for a given section
  const renderFields = (section) => (
    <Grid cols={2}>
      {(section?.fields || []).map((field) => {
        const sectionData = values?.[section.title] || {};
        const fieldValue = sectionData?.[field.key] ?? "";
        const onChange = (e) => onFieldChange(section.title, field.key, e.target.value);

        return (
          <Field key={field.key} label={field.label} full={field.type === "textarea"}>
            {field.type === "textarea" ? (
              <TextArea rows={field.rows || 4} value={fieldValue} onChange={onChange} placeholder={field.placeholder} />
            ) : field.type === "select" ? (
              <SelectInput value={fieldValue || ""} onChange={onChange} placeholder="Select…">
                {(field.options || []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectInput>
            ) : (
              <TextInput type={field.type || "text"} value={fieldValue} onChange={onChange} placeholder={field.placeholder} />
            )}
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

  const offset = projects ? 1 : 0;

  const body = (
    <>
      {projects && (
        <DocSection step={1} title="Project" description="Which project this document belongs to.">
          <Grid cols={2}>
            <Field label="Project" required htmlFor="psf-project" hint={disableProject ? "Can't be changed after creation." : undefined}>
              <SelectInput
                id="psf-project"
                value={projectId || ""}
                onChange={(e) => onProjectChange?.(e.target.value)}
                disabled={disableProject}
                placeholder="Select project"
              >
                {projects?.map((project) => (
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
          key={section.title}
          step={index + 1 + offset}
          title={section.label || section.title}
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

        <FormActions
          note={`Draft autosaves on this device · ${filledCount} field${filledCount !== 1 ? "s" : ""} filled`}
          onCancel={onCancel}
          submitLabel={submitLabel || "Save"}
          submitting={isSubmitting}
        />
      </form>

      {children}
    </Page>
  );
}

export default PaymentSectionForm;
