import React from "react";
import { Save } from "lucide-react";
import { Shell, Card, Input, TextArea } from "../../hooks/shared";

/**
 * Generic multi-section form shell.
 *
 * This is a direct extraction of PlanOfActionSectionForm — it never
 * referenced anything POA-specific, so it's pulled out here and reused
 * by both the Plan of Action form and the Payment Schedule / Scope of
 * Work forms (and any future section-based form) instead of being
 * duplicated.
 *
 * Renders every section stacked vertically as one continuous form
 * rather than behind a sidebar + Prev/Next pager.
 */
export function PaymentSectionForm({
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

  // Renders the plain field grid for a given section. Parametrized so
  // it can run once per section in the stacked list below.
  const renderFields = (section) => (
    <div className="grid gap-4">
      {(section?.fields || []).map((field) => {
        const sectionData = values?.[section.title] || {};
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
                  onFieldChange(section.title, field.key, e.target.value)
                }
              />
            ) : field.type === "date" ? (
              <Input
                type="date"
                value={fieldValue}
                onChange={(e) =>
                  onFieldChange(section.title, field.key, e.target.value)
                }
              />
            ) : field.type === "time" ? (
              <Input
                type="time"
                value={fieldValue}
                onChange={(e) =>
                  onFieldChange(section.title, field.key, e.target.value)
                }
              />
            ) : field.type === "select" ? (
              <select
                className="bc-input h-10 w-full"
                value={fieldValue}
                onChange={(e) =>
                  onFieldChange(section.title, field.key, e.target.value)
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
                  onFieldChange(section.title, field.key, e.target.value)
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderSectionBody = (section) => {
    // === CUSTOM RENDERER ===
    if (section?.type && renderSection) {
      return renderSection(section);
    }

    // === SIMPLE FIELDS ===
    return renderFields(section);
  };

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
          {isSubmitting ? "Saving..." : submitLabel || "Save"}
        </button>
      }
    >
      {/* Project Selector */}
      {projects && (
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
      )}

      {/* All sections, stacked — no tabs / no pager */}
      <div className="space-y-5">
        {sections.map((section, index) => (
          <Card key={section.title}>
            <div className="text-lg font-semibold text-[#333333] mb-4">
              {index + 1}. {section.title}
            </div>

            {renderSectionBody(section)}
          </Card>
        ))}
      </div>

      <div className="mt-4 text-xs text-[#94A3A5] text-center">
        Draft autosaved locally • {filledCount} field
        {filledCount !== 1 ? "s" : ""} completed
      </div>

      {children}
    </Shell>
  );
}
