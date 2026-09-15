import React, { useMemo } from "react";
import { Save, Plus, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Enhanced BriefSectionForm (shadcn/ui)
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
            <Label className="text-[13px] font-semibold">{field.label}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-[#1F453B] hover:text-[#1F453B]"
              onClick={() =>
                addTableRow(
                  field.key,
                  columns.reduce((acc, col) => {
                    acc[col.key] = "";
                    return acc;
                  }, {}),
                )
              }
            >
              <Plus size={14} className="mr-1" />
              {field.addLabel || "Add row"}
            </Button>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rows yet. Click "Add" to begin.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col.key}>{col.label}</TableHead>
                    ))}
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
                        <TableCell key={col.key}>
                          <Input
                            type={col.type === "date" ? "date" : "text"}
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
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeTableRow(field.key, idx)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      );
    }

    // ---- RESTRICTION TABLE (dropdown creates the row) ----
    if (field.type === "restriction-table") {
      const rows = getTableRows(field.key);
      const options = field.restrictionOptions || [];
      const usedTypes = new Set(rows.map((r) => r.type));
      const availableOptions = options.filter((o) => !usedTypes.has(o.value));

      return (
        <div key={field.key} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Label className="text-[13px] font-semibold">{field.label}</Label>

            <Select
              value=""
              onValueChange={(type) => {
                if (!type) return;
                addTableRow(field.key, { type, details: "" });
              }}
            >
              <SelectTrigger className="h-9 min-w-[260px]">
                <SelectValue placeholder="+ Add restriction type…" />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No restrictions added yet. Choose a type from the dropdown.
            </p>
          ) : (
            <div className="space-y-3">
              {rows.map((row, idx) => {
                const label =
                  options.find((o) => o.value === row.type)?.label || row.type;

                return (
                  <Card key={idx} className="bg-[#FAFBFC]">
                    <CardContent className="flex items-start gap-3 p-3">
                      <div className="flex-1 space-y-1">
                        <div className="text-[13px] font-semibold text-[#333333]">
                          {label}
                        </div>
                        <Textarea
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-1 text-red-500 hover:text-red-700"
                        onClick={() => removeTableRow(field.key, idx)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // ---- MULTISELECT (checkbox list) ----
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
          <Label className="text-[13px] font-semibold">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </Label>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {options.map((option) => {
              const optionValue =
                typeof option === "object" ? option.value : option;
              const optionLabel =
                typeof option === "object" ? option.label : option;
              const checked = selected.includes(optionValue);

              return (
                <label
                  key={optionValue}
                  className="flex cursor-pointer items-center gap-2 text-sm text-[#333333]"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(optionValue)}
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
        <Label className="mb-1 block text-[13px] font-semibold">
          {field.label}
          {field.required && <span className="ml-1 text-red-500">*</span>}
        </Label>

        {field.description && (
          <p className="mb-1 text-xs text-muted-foreground">
            {field.description}
          </p>
        )}

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
          <Select
            value={fieldValue || undefined}
            onValueChange={(value) =>
              handleFieldChange(section, field.key, value)
            }
          >
            <SelectTrigger className="h-10 w-full">
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
          <label className="flex h-10 items-center gap-2">
            <Checkbox
              checked={Boolean(fieldValue)}
              onCheckedChange={(checked) =>
                handleFieldChange(section, field.key, checked)
              }
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
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#333333]">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-[#6B7B7C]">{subtitle}</p>
          )}
        </div>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-[#1F453B] hover:bg-[#1F453B]/90"
        >
          <Save size={15} className="mr-2" />
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>

      {/* PROJECT SELECTOR */}
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-1 block text-[13px] font-semibold">
            Project
          </Label>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={projectId || undefined}
              onValueChange={(v) => onProjectChange?.(v)}
            >
              <SelectTrigger className="h-10 max-w-lg">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {(projects || []).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {onAddProject && (
              <Button
                type="button"
                variant="outline"
                className="border-[#1F453B] text-[#1F453B] hover:bg-[#F0F7F5]"
                onClick={onAddProject}
              >
                + New Project
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ALL SECTIONS STACKED */}
      <div className="space-y-5">
        {sections.map((section, index) => {
          const sectionKey = section.key || section.title;

          return (
            <Card key={sectionKey}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#333333]">
                  <span className="mr-1">{index + 1}.</span>
                  {section.title}
                </CardTitle>
                {section.description && (
                  <CardDescription>{section.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>{renderSectionBody(section)}</CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Draft autosaved locally • {filledCount} field
        {filledCount !== 1 ? "s" : ""} completed
      </div>

      {children}
    </div>
  );
}

export default BriefSectionForm;
