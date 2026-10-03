// Shared bits for the Automation app (Quiet Studio components only).
import React from "react";
import { Pill } from "@/components/inos";

export const AUTO_ROOT = { label: "Automation", to: "/automation" };
export const autoCrumbs = (...rest) => [AUTO_ROOT, ...rest];

const RULE_TONE = { ACTIVE: "ok", DRAFT: "warn", DISABLED: "mute" };
const RUN_TONE = { SUCCESS: "ok", FAILED: "bad", SKIPPED: "mute" };
const ESC_TONE = { OPEN: "bad", ACKNOWLEDGED: "warn", RESOLVED: "ok" };
const PRIORITY_TONE = { CRITICAL: "bad", HIGH: "peach", MEDIUM: "warn", LOW: "mute" };

const cap = (s) => String(s || "").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export const RuleStatus = ({ status }) => (
  <Pill tone={RULE_TONE[status] || "mute"} size="sm">
    {cap(status)}
  </Pill>
);
export const RunStatus = ({ status }) => (
  <Pill tone={RUN_TONE[status] || "mute"} size="sm">
    {cap(status)}
  </Pill>
);
export const EscStatus = ({ status }) => (
  <Pill tone={ESC_TONE[status] || "mute"} size="sm">
    {cap(status)}
  </Pill>
);
export const PriorityPill = ({ priority }) => (
  <Pill tone={PRIORITY_TONE[priority] || "mute"} size="sm" dot={false}>
    {cap(priority)}
  </Pill>
);

export const ACTION_LABEL = { NOTIFY: "Notify", TASK: "Create task for", ESCALATE: "Escalate to" };
export const RECIPIENT_LABEL = {
  project_manager: "Project manager",
  site_engineer: "Site engineer",
  designer: "Design team",
  procurement: "Procurement",
  accounts: "Accounts",
  admins: "Admins",
  assignee: "Task assignee",
};
export const actionText = (a) => `${ACTION_LABEL[a.type] || a.type} ${RECIPIENT_LABEL[a.recipient] || a.recipient}`.trim();

export function fmtWhen(v, { time = true } = {}) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return time ? `${date}, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : date;
}

export function ago(v) {
  if (!v) return "Never";
  const s = (Date.now() - new Date(v).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

export const hoursText = (h) => (h >= 48 ? `${Math.round(h / 24)} days` : `${h} h`);

/** Summary line after "Run now". */
export function runSummary(r) {
  if (!r) return "";
  if (r.results) return `${r.executed} new ${r.executed === 1 ? "run" : "runs"} across ${r.rules} rules${r.failed ? ` · ${r.failed} failed` : ""}`;
  const parts = [`${r.matched} matched`];
  if (r.executed) parts.push(`${r.executed} executed`);
  if (r.cooldown) parts.push(`${r.cooldown} already handled recently`);
  return parts.join(" · ");
}
