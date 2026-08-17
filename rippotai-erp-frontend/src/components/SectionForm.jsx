import React, { useState } from "react";
import { Save } from "lucide-react";
import { Shell, Card, Input, TextArea } from "../hooks/shared";

export function SectionForm({
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
  children,
}) {
  const [active, setActive] = useState(0);
  const currentSection = sections[active];

  // Improved filled count for both simple and complex forms
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

  return (
    <Shell
      title={title}
      subtitle={subtitle}
      action={
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save size={15} />
          {isSubmitting
            ? "Saving..."
            : title.includes("Recce")
              ? "Save Site Recce"
              : "Generate Brief"}
        </button>
      }
    >
      {/* Project Selector */}
      <Card>
        <label className="text-[13px] font-semibold text-[#333333] mb-1 block">
          Project
        </label>
        <select
          className="bc-input h-10 max-w-lg"
          value={projectId}
          onChange={(e) => onProjectChange(e.target.value)}
        >
          <option value="">Select Project</option>
          {projects?.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </Card>

      <div className="grid md:grid-cols-[240px_1fr] gap-5">
        {/* Sidebar */}
        <Card>
          <div className="text-xs uppercase tracking-widest text-[#6B7B7C] mb-3">
            Sections
          </div>
          <div className="flex flex-col gap-1">
            {sections.map((section, index) => (
              <button
                key={section.title}
                onClick={() => setActive(index)}
                className={`text-left rounded-lg px-3 py-2 text-sm transition ${
                  active === index
                    ? "bg-[#1F453B] text-white"
                    : "hover:bg-[#F4F6F7] text-[#333]"
                }`}
              >
                {index + 1}. {section.title}
              </button>
            ))}
          </div>
        </Card>

        {/* Main Content */}
        <Card>
          <div className="text-lg font-semibold text-[#333333] mb-4">
            {currentSection?.title}
          </div>

          {/* === CUSTOM RENDERER (For Site Recce) === */}
          {currentSection?.type && renderSection ? (
            renderSection(currentSection)
          ) : (
            /* === SIMPLE FIELDS (For Project Brief) === */
            <div className="grid gap-4">
              {(currentSection?.fields || []).map((field) => {
                // Support nested structure used by BriefForm
                const sectionData = values?.[currentSection.title] || {};
                const fieldValue = sectionData?.[field.key] ?? "";

                return (
                  <div key={field.key}>
                    <label className="block text-[13px] font-semibold text-[#333333] mb-1">
                      {field.label}
                    </label>

                    {field.type === "textarea" ? (
                      <TextArea
                        rows={field.rows || 4}
                        value={fieldValue}
                        onChange={(e) =>
                          onFieldChange(
                            currentSection.title,
                            field.key,
                            e.target.value,
                          )
                        }
                      />
                    ) : field.type === "date" ? (
                      <Input
                        type="date"
                        value={fieldValue}
                        onChange={(e) =>
                          onFieldChange(
                            currentSection.title,
                            field.key,
                            e.target.value,
                          )
                        }
                      />
                    ) : field.type === "time" ? (
                      <Input
                        type="time"
                        value={fieldValue}
                        onChange={(e) =>
                          onFieldChange(
                            currentSection.title,
                            field.key,
                            e.target.value,
                          )
                        }
                      />
                    ) : field.type === "select" ? (
                      <select
                        className="bc-input h-10 w-full"
                        value={fieldValue}
                        onChange={(e) =>
                          onFieldChange(
                            currentSection.title,
                            field.key,
                            e.target.value,
                          )
                        }
                      >
                        <option value="">Select...</option>
                        {(field.options || []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type={field.type || "text"}
                        value={fieldValue}
                        onChange={(e) =>
                          onFieldChange(
                            currentSection.title,
                            field.key,
                            e.target.value,
                          )
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              disabled={active === 0}
              onClick={() => setActive((prev) => prev - 1)}
              className="h-9 px-4 rounded-lg border border-[rgba(31,69,59,0.14)] text-sm disabled:opacity-50"
            >
              ← Previous
            </button>

            <button
              type="button"
              disabled={active === sections.length - 1}
              onClick={() => setActive((prev) => prev + 1)}
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
