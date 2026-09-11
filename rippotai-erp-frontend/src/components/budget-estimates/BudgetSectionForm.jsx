import React, { useMemo } from "react";
import { Save } from "lucide-react";
import { Shell, Card, Input, TextArea } from "../../hooks/shared";

export function BudgetSectionForm({
  title,
  subtitle,
  sections = [],
  values = {},
  onFieldChange,
  projects = [],
  projectId = "",
  onProjectChange,
  onSubmit,
  isSubmitting = false,
  renderSection,
  submitLabel = "Save Estimate",
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

  // Renders the plain field grid for a given section. Parametrized so
  // it can run once per section in the stacked list below.
  const renderFields = (section) => (
    <div className="grid gap-4">
      {(section?.fields || []).map((field) => {
        const sectionKey = section.key || section.title;

        const sectionData = values?.[sectionKey] || {};

        const fieldValue =
          sectionData?.[field.key] ?? values?.[field.key] ?? "";

        return (
          <div
            key={field.key}
            className={field.fullWidth ? "md:col-span-2" : ""}
          >
            <label className="block text-[13px] font-semibold text-[#333333] mb-1">
              {field.label}

              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.description && (
              <p className="text-xs text-[#94A3A5] mb-1">{field.description}</p>
            )}

            {/* TEXTAREA */}
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
              /* DATE */
              <Input
                type="date"
                value={fieldValue}
                onChange={(event) =>
                  handleFieldChange(section, field.key, event.target.value)
                }
              />
            ) : field.type === "number" ? (
              /* NUMBER */
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
              /* SELECT */
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
              /* CHECKBOX */
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
              /* DEFAULT INPUT */
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
      })}
    </div>
  );

  const renderSectionBody = (section) => {
    // CUSTOM SECTION
    if (section?.type && renderSection) {
      return renderSection(section);
    }

    // STANDARD FIELDS
    return renderFields(section);
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
      {/* =====================================================
          PROJECT SELECTOR
      ====================================================== */}

      {projects?.length > 0 && (
        <Card>
          <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
            Project
          </label>

          <select
            className="bc-input h-10 max-w-lg"
            value={projectId}
            onChange={(event) => onProjectChange?.(event.target.value)}
          >
            <option value="">Select Project</option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </Card>
      )}

      {/* =====================================================
          ALL SECTIONS, STACKED — NO TABS / NO PAGER
      ====================================================== */}

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

export default BudgetSectionForm;
