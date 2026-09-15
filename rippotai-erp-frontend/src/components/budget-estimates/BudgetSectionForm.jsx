import React, { useMemo } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Shell } from "../../hooks/shared"; // keep your layout Shell

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

  // Renders the plain field grid for a given section
  const renderFields = (section) => (
    <div className="grid gap-4 md:grid-cols-2">
      {(section?.fields || []).map((field) => {
        const sectionKey = section.key || section.title;
        const sectionData = values?.[sectionKey] || {};
        const fieldValue =
          sectionData?.[field.key] ?? values?.[field.key] ?? "";

        return (
          <div
            key={field.key}
            className={`space-y-2 ${field.fullWidth ? "md:col-span-2" : ""}`}
          >
            <Label className="text-[13px] font-semibold">
              {field.label}
              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>

            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}

            {/* TEXTAREA */}
            {field.type === "textarea" ? (
              <Textarea
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
              <Select
                value={fieldValue || ""}
                onValueChange={(value) =>
                  handleFieldChange(section, field.key, value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder || "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options || []).map((option) => {
                    const optionValue =
                      typeof option === "object" ? option.value : option;
                    const optionLabel =
                      typeof option === "object" ? option.label : option;

                    return (
                      <SelectItem key={optionValue} value={String(optionValue)}>
                        {optionLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : field.type === "checkbox" ? (
              /* CHECKBOX */
              <div className="flex items-center gap-2 h-10">
                <Checkbox
                  id={field.key}
                  checked={Boolean(fieldValue)}
                  onCheckedChange={(checked) =>
                    handleFieldChange(section, field.key, checked)
                  }
                />
                <Label
                  htmlFor={field.key}
                  className="text-sm font-normal cursor-pointer"
                >
                  {field.checkboxLabel || field.label}
                </Label>
              </div>
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
        <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      }
    >
      {/* =====================================================
          PROJECT SELECTOR
      ====================================================== */}
      {projects?.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 max-w-lg">
              <Label className="text-[13px] font-semibold">Project</Label>
              <Select
                value={projectId || ""}
                onValueChange={(value) => onProjectChange?.(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
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

      {/* =====================================================
          ALL SECTIONS, STACKED — NO TABS / NO PAGER
      ====================================================== */}
      <div className="space-y-5 mt-5">
        {sections.map((section, index) => {
          const sectionKey = section.key || section.title;

          return (
            <Card key={sectionKey}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  <span className="mr-1">{index + 1}.</span>
                  {section.title}
                </CardTitle>
                {section.description && (
                  <CardDescription className="mt-1">
                    {section.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>{renderSectionBody(section)}</CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-center">
        Draft autosaved locally • {filledCount} field
        {filledCount !== 1 ? "s" : ""} completed
      </div>

      {children}
    </Shell>
  );
}

export default BudgetSectionForm;
