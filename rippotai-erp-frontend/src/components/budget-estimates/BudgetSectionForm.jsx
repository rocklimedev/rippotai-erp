import React, { useMemo, useState } from "react";
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
  const [active, setActive] = useState(0);

  const currentSection = sections[active];

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

  const handleFieldChange = (key, value) => {
    if (!currentSection) return;

    onFieldChange?.(currentSection.key || currentSection.title, key, value);
  };

  const goPrevious = () => {
    setActive((previous) => Math.max(previous - 1, 0));
  };

  const goNext = () => {
    setActive((previous) => Math.min(previous + 1, sections.length - 1));
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
          MAIN WIZARD
      ====================================================== */}

      <div className="grid md:grid-cols-[240px_1fr] gap-5">
        {/* ===================================================
            SIDEBAR
        ==================================================== */}

        <Card>
          <div className="text-xs uppercase tracking-widest text-[#6B7B7C] mb-3">
            Estimate Sections
          </div>

          <div className="flex flex-col gap-1">
            {sections.map((section, index) => {
              const sectionKey = section.key || section.title;

              return (
                <button
                  key={sectionKey}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`text-left rounded-lg px-3 py-2 text-sm transition ${
                    active === index
                      ? "bg-[#1F453B] text-white"
                      : "hover:bg-[#F4F6F7] text-[#333]"
                  }`}
                >
                  <span className="mr-1">{index + 1}.</span>

                  {section.title}
                </button>
              );
            })}
          </div>
        </Card>

        {/* ===================================================
            CONTENT
        ==================================================== */}

        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-lg font-semibold text-[#333333]">
                {currentSection?.title}
              </div>

              {currentSection?.description && (
                <p className="text-sm text-[#6B7B7C] mt-1">
                  {currentSection.description}
                </p>
              )}
            </div>

            <div className="text-xs text-[#94A3A5]">
              {active + 1} / {sections.length}
            </div>
          </div>

          {/* =================================================
              CUSTOM SECTION
          ================================================== */}

          {currentSection?.type && renderSection ? (
            renderSection(currentSection)
          ) : (
            /* =================================================
               STANDARD FIELDS
            ================================================== */

            <div className="grid gap-4">
              {(currentSection?.fields || []).map((field) => {
                const sectionKey = currentSection.key || currentSection.title;

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

                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>

                    {field.description && (
                      <p className="text-xs text-[#94A3A5] mb-1">
                        {field.description}
                      </p>
                    )}

                    {/* TEXTAREA */}
                    {field.type === "textarea" ? (
                      <TextArea
                        rows={field.rows || 4}
                        value={fieldValue}
                        placeholder={field.placeholder || ""}
                        onChange={(event) =>
                          handleFieldChange(field.key, event.target.value)
                        }
                      />
                    ) : field.type === "date" ? (
                      /* DATE */
                      <Input
                        type="date"
                        value={fieldValue}
                        onChange={(event) =>
                          handleFieldChange(field.key, event.target.value)
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
                          handleFieldChange(field.key, event.target.value)
                        }
                      />
                    ) : field.type === "select" ? (
                      /* SELECT */
                      <select
                        className="bc-input h-10 w-full"
                        value={fieldValue}
                        onChange={(event) =>
                          handleFieldChange(field.key, event.target.value)
                        }
                      >
                        <option value="">
                          {field.placeholder || "Select..."}
                        </option>

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
                            handleFieldChange(field.key, event.target.checked)
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
                          handleFieldChange(field.key, event.target.value)
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* =================================================
              NAVIGATION
          ================================================== */}

          <div className="flex justify-between mt-6 pt-5 border-t border-gray-100">
            <button
              type="button"
              disabled={active === 0}
              onClick={goPrevious}
              className="h-9 px-4 rounded-lg border border-[rgba(31,69,59,0.14)] text-sm disabled:opacity-50"
            >
              ← Previous
            </button>

            <button
              type="button"
              disabled={active === sections.length - 1}
              onClick={goNext}
              className="h-9 px-4 rounded-lg border border-[rgba(31,69,59,0.14)] text-sm disabled:opacity-50"
            >
              Next →
            </button>
          </div>

          <div className="mt-4 text-xs text-[#94A3A5]">
            Draft autosaved locally • {filledCount} field
            {filledCount !== 1 ? "s" : ""} completed
          </div>
        </Card>
      </div>

      {children}
    </Shell>
  );
}

export default BudgetSectionForm;
