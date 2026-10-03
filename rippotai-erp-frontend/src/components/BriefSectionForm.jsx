import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { Field, TextInput, TextArea, SelectInput, FormActions } from "@/components/inos";
import {
  DocFormLayout,
  DocSection,
  ProjectPicker,
  Choices,
  ChipSelect,
  OptionSelect,
  AddRowButton,
  RowCard,
  IconButton,
  isFilled,
  slugId,
} from "@/components/forms/crm-form-ui";

/**
 * BriefSectionForm
 * Supports: text, textarea, number, date, select, checkbox, multiselect,
 * table, restriction-table, and conditional visibility (showWhen).
 * Props/API unchanged; `crumbs`, `onCancel` are optional extras.
 */
export function BriefSectionForm({
  title,
  subtitle,
  sections = [],
  values = {},
  onFieldChange,
  projects = [],
  projectId = "",
  onProjectChange,
  onAddProject,
  onSubmit,
  isSubmitting = false,
  renderSection,
  submitLabel = "Save brief",
  children,
  projectsLoading,
  crumbs,
  onCancel,
}) {
  const navigate = useNavigate();

  const filledCount = useMemo(() => {
    let count = 0;
    Object.values(values || {}).forEach((value) => {
      if (Array.isArray(value)) {
        if (value.length > 0) count++;
        return;
      }
      if (value !== "" && value !== null && value !== undefined) count++;
    });
    return count;
  }, [values]);

  const handleFieldChange = (section, key, value) => {
    onFieldChange?.(section?.key || section?.title, key, value);
  };

  // ----------------------------------------------------------
  // Table helpers
  // ----------------------------------------------------------

  const getTableRows = (fieldKey) => {
    const rows = values?.[fieldKey];
    return Array.isArray(rows) ? rows : [];
  };

  const updateTableRow = (fieldKey, index, columnKey, value) => {
    const rows = [...getTableRows(fieldKey)];
    rows[index] = { ...(rows[index] || {}), [columnKey]: value };
    handleFieldChange(null, fieldKey, rows);
  };

  const addTableRow = (fieldKey, emptyRow = {}) => {
    const rows = [...getTableRows(fieldKey), emptyRow];
    handleFieldChange(null, fieldKey, rows);
  };

  const removeTableRow = (fieldKey, index) => {
    const rows = getTableRows(fieldKey).filter((_, i) => i !== index);
    handleFieldChange(null, fieldKey, rows);
  };

  // ----------------------------------------------------------
  // Conditional visibility
  // ----------------------------------------------------------

  const isFieldVisible = (field) => {
    if (field.showWhen) {
      const current = values?.[field.showWhen.field];
      return current === field.showWhen.value;
    }
    if (field.showWhenMultiselectIncludes) {
      const current = values?.[field.showWhenMultiselectIncludes.field] || [];
      const arr = Array.isArray(current) ? current : [];
      return arr.includes(field.showWhenMultiselectIncludes.value);
    }
    return true;
  };

  const isWide = (field) =>
    field.type === "table" ||
    field.type === "restriction-table" ||
    field.type === "textarea" ||
    field.type === "multiselect" ||
    field.fullWidth;

  // ----------------------------------------------------------
  // Render a single field
  // ----------------------------------------------------------

  const renderField = (section, field) => {
    if (!isFieldVisible(field)) return null;

    const fieldValue = values?.[field.key] ?? "";
    const set = (v) => handleFieldChange(section, field.key, v);

    // ---- TABLE (compact inline rows) ----
    if (field.type === "table") {
      const rows = getTableRows(field.key);
      const columns = field.columns || [];
      const addRow = () =>
        addTableRow(
          field.key,
          columns.reduce((acc, col) => {
            acc[col.key] = "";
            return acc;
          }, {}),
        );

      return (
        <Field key={field.key} label={field.label} hint={field.description} full>
          {rows.length > 0 && (
            <div className="crmf-table-wrap">
              <table className="crmf-table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      {columns.map((col) => (
                        <td key={col.key}>
                          <TextInput
                            type={col.type === "date" ? "date" : "text"}
                            value={row[col.key] ?? ""}
                            placeholder={col.placeholder || col.label}
                            aria-label={col.label}
                            onChange={(e) => updateTableRow(field.key, idx, col.key, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="actions">
                        <IconButton danger label="Remove row" onClick={() => removeTableRow(field.key, idx)}>
                          <Trash2 />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AddRowButton onClick={addRow}>{field.addLabel || "Add row"}</AddRowButton>
        </Field>
      );
    }

    // ---- RESTRICTION TABLE (dropdown creates the row) ----
    if (field.type === "restriction-table") {
      const rows = getTableRows(field.key);
      const options = field.restrictionOptions || [];
      const usedTypes = new Set(rows.map((r) => r.type));
      const availableOptions = options.filter((o) => !usedTypes.has(o.value));

      return (
        <Field key={field.key} label={field.label} hint="Pick a rule type to add it, then note the details." full>
          {rows.length > 0 && (
            <div className="crmf-rows">
              {rows.map((row, idx) => {
                const label = options.find((o) => o.value === row.type)?.label || row.type;
                return (
                  <RowCard key={idx} title={label} onRemove={() => removeTableRow(field.key, idx)} removeLabel="Remove restriction">
                    <TextArea
                      rows={2}
                      value={row.details ?? ""}
                      placeholder="Details, e.g. work allowed 10am–6pm, no Sundays"
                      aria-label={`${label} details`}
                      onChange={(e) => updateTableRow(field.key, idx, "details", e.target.value)}
                    />
                  </RowCard>
                );
              })}
            </div>
          )}
          <SelectInput
            value=""
            disabled={availableOptions.length === 0}
            placeholder={availableOptions.length ? "+ Add a restriction…" : "All restriction types added"}
            onChange={(e) => {
              const type = e.target.value;
              if (!type) return;
              addTableRow(field.key, { type, details: "" });
            }}
          >
            {availableOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectInput>
        </Field>
      );
    }

    // ---- MULTISELECT (chips) ----
    if (field.type === "multiselect") {
      return (
        <Field key={field.key} label={field.label} required={field.required} hint={field.description || "Select all that apply."} full>
          <ChipSelect name={field.label} value={Array.isArray(fieldValue) ? fieldValue : []} options={field.options || []} onChange={set} />
        </Field>
      );
    }

    // ---- CHECKBOX ----
    if (field.type === "checkbox") {
      return (
        <Field key={field.key} label={field.label} hint={field.description} full={field.fullWidth}>
          <label className="crmf-check" style={{ height: 40 }}>
            <input type="checkbox" checked={Boolean(fieldValue)} onChange={(e) => set(e.target.checked)} />
            {field.checkboxLabel || field.label}
          </label>
        </Field>
      );
    }

    // ---- SELECT: small sets as choice cards ----
    if (field.type === "select") {
      const options = field.options || [];
      const small = options.length > 0 && options.length <= 4;
      return (
        <Field key={field.key} label={field.label} required={field.required} hint={field.description} full={field.fullWidth}>
          {small ? (
            <Choices name={field.label} value={fieldValue} options={options} columns={options.length} onChange={(v) => set(String(v))} />
          ) : (
            <OptionSelect
              value={fieldValue}
              options={options}
              placeholder={field.placeholder || "Select…"}
              onChange={(v) => set(v === "" ? "" : String(v))}
            />
          )}
        </Field>
      );
    }

    // ---- STANDARD FIELDS ----
    return (
      <Field
        key={field.key}
        label={field.label}
        required={field.required}
        hint={field.description}
        full={isWide(field)}
      >
        {field.type === "textarea" ? (
          <TextArea rows={field.rows || 3} value={fieldValue} placeholder={field.placeholder || ""} onChange={(e) => set(e.target.value)} />
        ) : field.type === "date" ? (
          <TextInput type="date" value={fieldValue} onChange={(e) => set(e.target.value)} />
        ) : field.type === "number" ? (
          <TextInput
            type="number"
            inputMode="decimal"
            min={field.min}
            max={field.max}
            step={field.step || "0.01"}
            value={fieldValue}
            placeholder={field.placeholder || ""}
            onChange={(e) => set(e.target.value)}
          />
        ) : (
          <TextInput type={field.type || "text"} value={fieldValue} placeholder={field.placeholder || ""} onChange={(e) => set(e.target.value)} />
        )}
      </Field>
    );
  };

  // ----------------------------------------------------------
  // Section body + completion
  // ----------------------------------------------------------

  const renderSectionBody = (section) => {
    if (section?.type && renderSection) {
      return renderSection(section);
    }
    return <div className="inos-form-grid">{(section?.fields || []).map((field) => renderField(section, field))}</div>;
  };

  const sectionDone = (section) =>
    (section?.fields || []).some((f) => isFieldVisible(f) && f.type !== "checkbox" && isFilled(values?.[f.key]));

  const projectSectionId = "sec-project";
  const nav = [
    { id: projectSectionId, label: "Project", done: Boolean(projectId) },
    ...sections.map((s, i) => ({
      id: slugId(s.key || s.title, i),
      label: s.title,
      done: sectionDone(s),
    })),
  ];

  return (
    <DocFormLayout
      crumbs={crumbs || [{ label: "CRM", to: "/crm" }, { label: "Forms" }, { label: "Project brief" }]}
      title={title}
      subtitle={subtitle}
      nav={nav}
    >
      <DocSection id={projectSectionId} step={1} title="Project" description="Which project is this brief for?" done={Boolean(projectId)}>
        <ProjectPicker
          projects={projects}
          value={projectId}
          onChange={onProjectChange}
          onAdd={onAddProject}
          loading={projectsLoading}
          hint="Site address and project type are filled in from the project."
        />
      </DocSection>

      {sections.map((section, index) => (
        <DocSection
          key={section.key || section.title}
          id={nav[index + 1].id}
          step={index + 2}
          title={section.title}
          description={section.description}
          done={nav[index + 1].done}
        >
          {renderSectionBody(section)}
        </DocSection>
      ))}

      <FormActions
        note={`${filledCount} field${filledCount !== 1 ? "s" : ""} completed`}
        onCancel={onCancel || (() => navigate(-1))}
        submitLabel={isSubmitting ? "Saving…" : submitLabel}
        submitDisabled={isSubmitting}
        onSubmit={onSubmit}
      />

      {children}
    </DocFormLayout>
  );
}

export default BriefSectionForm;
