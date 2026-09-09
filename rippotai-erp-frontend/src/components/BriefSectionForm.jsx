import React, { useId } from "react";
import { ChevronDown, FileText, Loader2, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import "./brief-workspace.css";

export const asChoices = (value) => Array.isArray(value)
  ? value
  : String(value ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
export const isAnswered = (value) => Array.isArray(value)
  ? value.some(isAnswered)
  : value != null && (typeof value !== "string" || value.trim() !== "");

function MultiSelectDropdown({ id, label, options, value, onChange, disabled, describedBy }) {
  const selected = asChoices(value);
  const labels = selected.map((item) => options.find((option) => option.value === item)?.label || item);
  const summary = labels.length ? labels.join(", ") : "Select options";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          className={`bw-multiselect ${selected.length ? "" : "bw-placeholder"}`}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-describedby={describedBy}
          title={summary}
        >
          <span id={`${id}-value`} className="bw-selection-text">{summary}</span>
          {selected.length > 0 && <span className="bw-selection-count" aria-hidden="true">{selected.length}</span>}
          <ChevronDown size={16} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        aria-label={label}
        style={{
          width: "var(--radix-dropdown-menu-trigger-width)",
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "min(320px, var(--radix-dropdown-menu-content-available-height))",
          overflowY: "auto",
        }}
      >
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            disabled={disabled}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => onChange(checked
              ? [...new Set([...selected, option.value])]
              : selected.filter((item) => item !== option.value))}
            className="whitespace-normal break-words"
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        {!options.length && <DropdownMenuItem disabled>No options available</DropdownMenuItem>}
        {selected.length > 0 && <>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={disabled} onSelect={() => onChange([])}>Clear all selections</DropdownMenuItem>
        </>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Field({ field, value, onChange, prefix, disabled }) {
  const id = `${prefix}-${field.key}`;
  const scalar = typeof value === "boolean" ? (value ? "Yes" : "No") : value ?? "";
  const helper = field.description || "";
  const describedBy = helper ? `${id}-help` : undefined;
  return (
    <div className={`bw-field ${field.type === "textarea" ? "bw-wide" : ""}`}>
      <label id={`${id}-label`} htmlFor={id}>{field.label}{field.required ? " *" : ""}</label>
      {field.type === "multiselect" ? (
        <MultiSelectDropdown id={id} label={field.label} options={field.options || []} value={value} onChange={onChange} disabled={disabled} describedBy={describedBy} />
      ) : field.type === "select" ? (
        <select id={id} value={scalar} disabled={disabled} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select an option</option>
          {(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <Textarea id={id} value={scalar} rows={Math.min(field.rows || 3, 4)} placeholder={field.placeholder || "Add details…"} disabled={disabled} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <Input id={id} type={field.type || "text"} step={field.type === "number" ? "any" : undefined} value={scalar} placeholder={field.placeholder} disabled={disabled} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value)} />
      )}
      {helper && <p id={`${id}-help`} className="bw-help">{helper}</p>}
    </div>
  );
}

/**
 * One continuous form. The existing export, schema and flat callback signature
 * are retained for integration. Schema sections do not create UI sections.
 */
export function BriefSectionForm({ title = "Project Brief", subtitle, sections = [], values = {}, onFieldChange, projects = [], projectId, onProjectChange, onSubmit, isSubmitting = false, renderSection, children, submitLabel, projectsLoading = false, saveStatus }) {
  const prefix = useId();
  const fields = sections.flatMap((section) => (section.fields || []).map((field) => ({ field, sectionTitle: section.title })));
  const answered = fields.filter(({ field }) => isAnswered(values[field.key])).length;
  const currentProject = projects.find((project) => String(project.id) === String(projectId));
  const actionLabel = submitLabel || (title.includes("Recce") ? "Save Site Recce" : title.startsWith("Edit") ? "Update Brief" : "Generate Brief");
  const submit = (event) => {
    event.preventDefault();
    if (!isSubmitting && !projectsLoading) onSubmit?.();
  };
  return (
    <div className="brief-workspace">
      <header className="bw-header">
        <div className="bw-eyebrow"><FileText size={15} aria-hidden="true" /> CLIENT BRIEF</div>
        <h1>{title}</h1>
        <p>{subtitle || "Capture the project details, requirements and preferences in one place."}</p>
      </header>
      <form className="bw-form" onSubmit={submit} aria-label={title} aria-busy={isSubmitting}>
        <div className="bw-project">
          <label htmlFor={`${prefix}-project`}>Project</label>
          <select id={`${prefix}-project`} value={projectId ?? ""} disabled={isSubmitting || projectsLoading} onChange={(event) => onProjectChange(event.target.value)}>
            <option value="">{projectsLoading ? "Loading projects…" : "Select a project"}</option>
            {projectId && !currentProject && <option value={projectId}>Current project · {projectId}</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </div>
        <div className="bw-fields">
          {sections.map((section) => section.type && renderSection ? (
            <div className="bw-wide" key={section.title}>{renderSection(section)}</div>
          ) : (section.fields || []).map((field) => (
            <Field key={`${section.title}-${field.key}`} field={field} value={values[field.key]} prefix={prefix} disabled={isSubmitting} onChange={(value) => onFieldChange(section.title, field.key, value)} />
          )))}
        </div>
        <footer className="bw-footer">
          <span className="bw-save-status" role="status">{saveStatus || `${answered} of ${fields.length} fields answered`}</span>
          <Button type="submit" className="bw-primary" disabled={isSubmitting || projectsLoading || !sections.length}>
            {isSubmitting ? <Loader2 size={16} className="bw-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            {isSubmitting ? "Saving…" : actionLabel}
          </Button>
        </footer>
      </form>
      {children}
    </div>
  );
}
