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

import { Shell } from "../../hooks/shared";

/**
 * Shared multi-section form shell used by Plan of Action (and similar docs).
 *
 * - Simple sections (e.g. Overview) render a field grid from `section.fields`.
 * - Typed sections (phases / team / terms) are delegated to `renderSection`
 *   so they can own their full UI (including headers, add/edit panels, etc.).
 */
export function PlanOfActionSectionForm({
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

  // Renders the plain field grid for a given section
  const renderFields = (section) => (
    <div className="grid gap-4">
      {(section?.fields || []).map((field) => {
        // Support nested structure used by BriefForm / POA Overview
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

  const isCustomSection = (section) => Boolean(section?.type && renderSection);

  const renderSectionBody = (section) => {
    // === CUSTOM RENDERER (Phases / Team / Terms etc.) ===
    // These sections own their full UI (headers, lists, add/edit panels).
    if (isCustomSection(section)) {
      return renderSection(section);
    }

    // === SIMPLE FIELDS (Overview / Project Brief style sections) ===
    return renderFields(section);
  };

  return (
    <Shell title={title} subtitle={subtitle}>
      {/* Project Selector */}
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

      {/* All sections, stacked — no tabs / no pager */}
      <div className="space-y-5 mt-5">
        {sections.map((section, index) => {
          const custom = isCustomSection(section);

          return (
            <Card key={section.title || section.type || index}>
              {/*
                For custom sections (phases / team / terms), the child
                renderer already provides its own title + description +
                action buttons. Skip the CardTitle to avoid duplicate
                headings like "4. Terms & Conditions" above the section's
                own "Terms & Conditions".
              */}
              {!custom && (
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">
                    {index + 1}. {section.title}
                  </CardTitle>
                </CardHeader>
              )}

              <CardContent className={custom ? "pt-6" : undefined}>
                {renderSectionBody(section)}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Save Plan of Action */}
      <div className="mt-6">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full h-11"
        >
          <Save className="mr-2 h-4 w-4" />

          {isSubmitting ? "Saving..." : submitLabel || "Save Plan of Action"}
        </Button>
      </div>

      {/* Autosave / completion status */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        Draft autosaved locally • {filledCount} field
        {filledCount !== 1 ? "s" : ""} completed
      </div>

      {children}
    </Shell>
  );
}

export default PlanOfActionSectionForm;
