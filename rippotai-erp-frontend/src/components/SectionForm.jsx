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

  const filledCount = Object.values(values || {}).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== "" && value !== null && value !== undefined;
  }).length;

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
          {isSubmitting ? "Saving..." : "Save Site Recce"}
        </button>
      }
    >
      {/* =======================================
          PROJECT SELECT
      ======================================== */}

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

      {/* =======================================
          LAYOUT
      ======================================== */}

      <div className="grid md:grid-cols-[240px_1fr] gap-5">
        {/* ================= Sidebar ================ */}

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

        {/* ================= Main Content ================ */}

        <Card>
          <div className="text-lg font-semibold text-[#333333] mb-4">
            {currentSection?.title}
          </div>
          {/* =======================================
              CUSTOM SECTION RENDERER
          ======================================== */}

          {currentSection?.type && renderSection ? (
            renderSection(currentSection)
          ) : (
            <div className="grid gap-4">
              {(currentSection?.fields || []).map((field) => (
                <div key={field.key}>
                  <label className="block text-[13px] font-semibold text-[#333333] mb-1">
                    {field.label}
                  </label>

                  {/* TEXTAREA */}

                  {field.type === "textarea" ? (
                    <TextArea
                      rows={field.rows || 4}
                      value={values?.[field.key] || ""}
                      onChange={(e) =>
                        onFieldChange(
                          currentSection.title,
                          field.key,
                          e.target.value,
                        )
                      }
                    />
                  ) : field.type === "date" ? (
                    /* DATE */

                    <Input
                      type="date"
                      value={values?.[field.key] || ""}
                      onChange={(e) =>
                        onFieldChange(
                          currentSection.title,
                          field.key,
                          e.target.value,
                        )
                      }
                    />
                  ) : field.type === "time" ? (
                    /* TIME */

                    <Input
                      type="time"
                      value={values?.[field.key] || ""}
                      onChange={(e) =>
                        onFieldChange(
                          currentSection.title,
                          field.key,
                          e.target.value,
                        )
                      }
                    />
                  ) : field.type === "select" ? (
                    /* SELECT */

                    <select
                      className="bc-input h-10 w-full"
                      value={values?.[field.key] || ""}
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
                    /* DEFAULT TEXT */

                    <Input
                      type={field.type || "text"}
                      value={values?.[field.key] || ""}
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
              ))}
            </div>
          )}

          {/* =======================================
              NAVIGATION
          ======================================== */}

          <div className="flex justify-between mt-6">
            <button
              type="button"
              disabled={active === 0}
              onClick={() => setActive((previous) => previous - 1)}
              className="h-9 px-4 rounded-lg border border-[rgba(31,69,59,0.14)] text-sm disabled:opacity-50"
            >
              ← Previous
            </button>

            <button
              type="button"
              disabled={active === sections.length - 1}
              onClick={() => setActive((previous) => previous + 1)}
              className="h-9 px-4 rounded-lg border border-[rgba(31,69,59,0.14)] text-sm disabled:opacity-50"
            >
              Next →
            </button>
          </div>

          {/* =======================================
              FOOTER
          ======================================== */}

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
