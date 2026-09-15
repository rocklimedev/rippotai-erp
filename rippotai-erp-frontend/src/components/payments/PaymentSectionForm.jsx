import React from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Shell } from "../../hooks/shared"; // keep your layout Shell

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

  // Renders the plain field grid for a given section
  const renderFields = (section) => (
    <div className="grid gap-4">
      {(section?.fields || []).map((field) => {
        const sectionData = values?.[section.title] || {};
        const fieldValue = sectionData?.[field.key] ?? "";

        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-[13px] font-semibold">{field.label}</Label>

            {field.type === "textarea" ? (
              <Textarea
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
              <Select
                value={fieldValue || ""}
                onValueChange={(value) =>
                  onFieldChange(section.title, field.key, value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {(field.options || []).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        <Button onClick={onSubmit} disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving..." : submitLabel || "Save"}
        </Button>
      }
    >
      {/* Project Selector */}
      {projects && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 max-w-lg">
              <Label className="text-[13px] font-semibold">Project</Label>
              <Select value={projectId || ""} onValueChange={onProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All sections, stacked — no tabs / no pager */}
      <div className="space-y-5 mt-5">
        {sections.map((section, index) => (
          <Card key={section.title}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {index + 1}. {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>{renderSectionBody(section)}</CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-center">
        Draft autosaved locally • {filledCount} field
        {filledCount !== 1 ? "s" : ""} completed
      </div>

      {children}
    </Shell>
  );
}

export default PaymentSectionForm;
