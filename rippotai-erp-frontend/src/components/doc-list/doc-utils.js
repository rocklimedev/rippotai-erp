// Plain helpers shared by the document list, review UI and section ticks.
import { Archive, Check, RotateCcw, XCircle } from "lucide-react";

export const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export const fmtDateTime = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const REVIEW_ACTIONS = [
  { key: "approve", label: "Approve", icon: Check, tone: "ok", past: "Approved" },
  { key: "revise", label: "Revise", icon: RotateCcw, tone: "warn", past: "Revision requested", needsComment: true },
  { key: "reject", label: "Reject", icon: XCircle, tone: "bad", past: "Rejected", needsComment: true },
  { key: "archive", label: "Archive", icon: Archive, tone: "mute", past: "Archived" },
];

export const REVIEW_STATE = {
  approve: { label: "Approved", tone: "ok" },
  revise: { label: "Revision requested", tone: "warn" },
  reject: { label: "Rejected", tone: "bad" },
  archive: { label: "Archived", tone: "mute" },
  revised: { label: "Revised", tone: "lilac" },
};

export const fillLabel = (f) => (f === "done" ? "Complete" : f === "partial" ? "Partly filled" : "Not started");

const SKIP_TYPES = new Set(["hidden", "button", "submit", "reset", "file", "image", "search", "range", "color"]);

const visible = (el) => !!(el.offsetParent || el.getClientRects().length);

/**
 * Count the answerable controls in a section and how many are answered.
 * Every input / select / textarea / combobox counts (not just required ones);
 * a checkbox or radio group counts once (answered when any option is picked).
 * A lone checkbox (a yes/no toggle) is always "answered" and is not counted.
 * Mark a control or wrapper with `data-tick-ignore` to leave it out.
 */
export function measureSection(root) {
  if (!root) return { total: 0, filled: 0 };
  const groups = new Map();
  let total = 0;
  let filled = 0;
  const controls = root.querySelectorAll(
    "input, select, textarea, button[role='combobox'], [role='radio']:not(input), [role='checkbox']:not(input)",
  );
  for (const c of controls) {
    if (c.closest("[data-tick-ignore]")) continue;
    if (c.disabled || c.readOnly || c.getAttribute("aria-hidden") === "true") continue;
    const role = c.tagName !== "INPUT" ? c.getAttribute("role") : null;
    if (role === "radio" || role === "checkbox") {
      // ARIA option cards / chips (Choices, ChipSelect …): one answer per group
      if (!visible(c)) continue;
      const key = c.closest("[role='radiogroup'],[role='group'],fieldset,.inos-choices,.crmf-choices,.crmf-chips");
      if (!key) continue;
      const g = groups.get(key) || { n: 0, on: false, type: role };
      g.n += 1;
      g.on = g.on || c.getAttribute("aria-checked") === "true";
      groups.set(key, g);
      continue;
    }
    if (!visible(c) && !(c.type === "checkbox" || c.type === "radio")) continue;
    const tag = c.tagName;
    if (tag === "INPUT" && SKIP_TYPES.has(c.type)) continue;
    if (tag === "INPUT" && (c.type === "checkbox" || c.type === "radio")) {
      const scope = c.closest("[role='group'],[role='radiogroup'],fieldset,.inos-choices,.crmf-choices,.crmf-chips");
      const key = c.name || scope;
      if (!key) continue;
      const g = groups.get(key) || { n: 0, on: false, type: c.type };
      g.n += 1;
      g.on = g.on || c.checked;
      groups.set(key, g);
      continue;
    }
    if (tag === "BUTTON") {
      total += 1;
      if (!c.hasAttribute("data-placeholder") && c.textContent.trim()) filled += 1;
      continue;
    }
    total += 1;
    if (String(c.value ?? "").trim() !== "") filled += 1;
  }
  for (const g of groups.values()) {
    if (g.n === 1 && g.type === "checkbox") continue; // single toggle — always answered
    total += 1;
    if (g.on) filled += 1;
  }
  return { total, filled };
}

/**
 * THE completeness rule for every document form section, nav step and stepper:
 *   done    – every field in the section is filled        → green tick
 *   partial – some (not all) fields are filled            → light-yellow tick
 *   empty   – nothing filled                              → grey / step number
 * `ruleDone` is the form's own rule (e.g. "has at least one room"). It only
 * decides sections that have no fields of their own (a list with no rows, a
 * read-only summary); it never turns a partly filled section green.
 */
export function resolveFill({ total = 0, filled = 0 } = {}, ruleDone) {
  if (!total) return ruleDone ? "done" : "empty";
  if (!filled) return "empty";
  return filled < total ? "partial" : "done";
}

export function evaluateSection(root, ruleDone) {
  return resolveFill(measureSection(root), ruleDone);
}

/** Common field fallbacks across camelCase / snake_case APIs. */
export const rowProjectId = (r) => r?.projectId ?? r?.project_id ?? r?.project?.id ?? null;
export const rowProjectName = (r) => r?.project?.name ?? r?.projectName ?? r?.project_name ?? null;
export const rowUpdated = (r) => r?.updatedAt ?? r?.updated_at ?? r?.createdAt ?? r?.created_at ?? null;

/** Array rows out of the usual {data}/{items}/[] response shapes. */
export const asRows = (d) => (Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.items) ? d.items : Array.isArray(d?.data?.data) ? d.data.data : Array.isArray(d?.rows) ? d.rows : []);
