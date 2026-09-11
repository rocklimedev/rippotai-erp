import React, { useMemo } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { Shell, Card, Input, TextArea } from "./Shared"; // adjust path

/**
 * Enhanced BriefSectionForm
 * Supports: text, textarea, number, date, select, checkbox, multiselect,
 * table, restriction-table, and conditional visibility (showWhen).
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
  submitLabel = "Save Brief",
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

  // ----------------------------------------------------------
  // Render a single field
  // ----------------------------------------------------------

  const renderField = (section, field) => {
    if (!isFieldVisible(field)) return null;

    const fieldValue = values?.[field.key] ?? "";

    // ---- TABLE ----
    if (field.type === "table") {
      const rows = getTableRows(field.key);
      const columns = field.columns || [];

      return (
        <div key={field.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[13px] font-semibold text-[#333333]">
              {field.label}
            </label>
            <button
              type="button"
              onClick={() =>
                addTableRow(
                  field.key,
                  columns.reduce((acc, col) => {
                    acc[col.key] = "";
                    return acc;
                  }, {}),
                )
              }
              className="inline-flex items-center gap-1 text-sm font-medium text-[#1F453B] hover:underline"
            >
              <Plus size={14} />
              {field.addLabel || "Add row"}
            </button>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-[#94A3A5]">
              No rows yet. Click “Add” to begin.
            </p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFA]">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-2 text-left font-semibold text-[#333333]"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      {columns.map((col) => (
                        <td key={col.key} className="px-3 py-2">
                          {col.type === "date" ? (
                            <Input
                              type="date"
                              value={row[col.key] ?? ""}
                              onChange={(e) =>
                                updateTableRow(
                                  field.key,
                                  idx,
                                  col.key,
                                  e.target.value,
                                )
                              }
                            />
                          ) : (
                            <Input
                              type="text"
                              value={row[col.key] ?? ""}
                              placeholder={col.placeholder || ""}
                              onChange={(e) =>
                                updateTableRow(
                                  field.key,
                                  idx,
                                  col.key,
                                  e.target.value,
                                )
                              }
                            />
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeTableRow(field.key, idx)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove row"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // ---- RESTRICTION TABLE (dropdown creates the row) ----
    if (field.type === "restriction-table") {
      const rows = getTableRows(field.key);
      const options = field.restrictionOptions || [];

      // Only show types not already used
      const usedTypes = new Set(rows.map((r) => r.type));
      const availableOptions = options.filter((o) => !usedTypes.has(o.value));

      return (
        <div key={field.key} className="space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <label className="block text-[13px] font-semibold text-[#333333]">
              {field.label}
            </label>

            <div className="flex items-center gap-2">
              <select
                className="bc-input h-9 min-w-[260px]"
                value=""
                onChange={(e) => {
                  const type = e.target.value;
                  if (!type) return;
                  addTableRow(field.key, { type, details: "" });
                }}
              >
                <option value="">+ Add restriction type…</option>
                {availableOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-[#94A3A5]">
              No restrictions added yet. Choose a type from the dropdown.
            </p>
          ) : (
            <div className="space-y-3">
              {rows.map((row, idx) => {
                const label =
                  options.find((o) => o.value === row.type)?.label || row.type;

                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 border rounded-lg bg-[#FAFBFC]"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="text-[13px] font-semibold text-[#333333]">
                        {label}
                      </div>
                      <TextArea
                        rows={2}
                        value={row.details ?? ""}
                        placeholder="Details / notes…"
                        onChange={(e) =>
                          updateTableRow(
                            field.key,
                            idx,
                            "details",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTableRow(field.key, idx)}
                      className="mt-1 text-red-500 hover:text-red-700"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // ---- MULTISELECT (simple checkbox list) ----
    if (field.type === "multiselect") {
      const selected = Array.isArray(fieldValue) ? fieldValue : [];
      const options = field.options || [];

      const toggle = (optionValue) => {
        const next = selected.includes(optionValue)
          ? selected.filter((v) => v !== optionValue)
          : [...selected, optionValue];
        handleFieldChange(section, field.key, next);
      };

      return (
        <div key={field.key} className="space-y-2">
          <label className="block text-[13px] font-semibold text-[#333333]">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.description && (
            <p className="text-xs text-[#94A3A5]">{field.description}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {options.map((option) => {
              const optionValue =
                typeof option === "object" ? option.value : option;
              const optionLabel =
                typeof option === "object" ? option.label : option;
              const checked = selected.includes(optionValue);

              return (
                <label
                  key={optionValue}
                  className="flex items-center gap-2 text-sm text-[#333333] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(optionValue)}
                    className="h-4 w-4"
                  />
                  {optionLabel}
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    // ---- STANDARD FIELDS ----
    return (
      <div key={field.key} className={field.fullWidth ? "md:col-span-2" : ""}>
        <label className="block text-[13px] font-semibold text-[#333333] mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {field.description && (
          <p className="text-xs text-[#94A3A5] mb-1">{field.description}</p>
        )}

        {field.type === "textarea" ? (
          <TextArea
            rows={field.rows || 4}
            value={fieldValue}
            placeholder={field.placeholder || ""}
            onChange={(event) =>
              handleFieldChange(section, field.key, event.target.value)
            }
          />
        ) : field.type === "date" ? (
          <Input
            type="date"
            value={fieldValue}
            onChange={(event) =>
              handleFieldChange(section, field.key, event.target.value)
            }
          />
        ) : field.type === "number" ? (
          <Input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step || "0.01"}
            value={fieldValue}
            placeholder={field.placeholder || ""}
            onChange={(event) =>
              handleFieldChange(section, field.key, event.target.value)
            }
          />
        ) : field.type === "select" ? (
          <select
            className="bc-input h-10 w-full"
            value={fieldValue}
            onChange={(event) =>
              handleFieldChange(section, field.key, event.target.value)
            }
          >
            <option value="">{field.placeholder || "Select..."}</option>
            {(field.options || []).map((option) => {
              const optionValue =
                typeof option === "object" ? option.value : option;
              const optionLabel =
                typeof option === "object" ? option.label : option;
              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              );
            })}
          </select>
        ) : field.type === "checkbox" ? (
          <label className="flex items-center gap-2 h-10">
            <input
              type="checkbox"
              checked={Boolean(fieldValue)}
              onChange={(event) =>
                handleFieldChange(section, field.key, event.target.checked)
              }
              className="h-4 w-4"
            />
            <span className="text-sm text-[#333333]">
              {field.checkboxLabel || field.label}
            </span>
          </label>
        ) : (
          <Input
            type={field.type || "text"}
            value={fieldValue}
            placeholder={field.placeholder || ""}
            onChange={(event) =>
              handleFieldChange(section, field.key, event.target.value)
            }
          />
        )}
      </div>
    );
  };

  // ----------------------------------------------------------
  // Section body
  // ----------------------------------------------------------

  const renderSectionBody = (section) => {
    if (section?.type && renderSection) {
      return renderSection(section);
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {(section?.fields || []).map((field) => (
          <div
            key={field.key}
            className={
              field.type === "table" ||
              field.type === "restriction-table" ||
              field.type === "textarea" ||
              field.type === "multiselect" ||
              field.fullWidth
                ? "md:col-span-2"
                : ""
            }
          >
            {renderField(section, field)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Shell
      title={title}
      subtitle={subtitle}
      action={
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save size={15} />
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      }
    >
      {/* PROJECT SELECTOR */}
      <Card>
        <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
          Project
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="bc-input h-10 max-w-lg"
            value={projectId}
            onChange={(event) => onProjectChange?.(event.target.value)}
          >
            <option value="">Select Project</option>
            {(projects || []).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {onAddProject && (
            <button
              type="button"
              onClick={onAddProject}
              className="h-10 px-3 rounded-lg border border-[#1F453B] text-[#1F453B] text-sm font-medium hover:bg-[#F0F7F5]"
            >
              + New Project
            </button>
          )}
        </div>
      </Card>

      {/* ALL SECTIONS STACKED */}
      <div className="space-y-5">
        {sections.map((section, index) => {
          const sectionKey = section.key || section.title;

          return (
            <Card key={sectionKey}>
              <div className="mb-5">
                <div className="text-lg font-semibold text-[#333333]">
                  <span className="mr-1">{index + 1}.</span>
                  {section.title}
                </div>
                {section.description && (
                  <p className="text-sm text-[#6B7B7C] mt-1">
                    {section.description}
                  </p>
                )}
              </div>

              {renderSectionBody(section)}
            </Card>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-[#94A3A5] text-center">
        Draft autosaved locally • {filledCount} field
        {filledCount !== 1 ? "s" : ""} completed
      </div>

      {children}
    </Shell>
  );
}

export default BriefSectionForm;
