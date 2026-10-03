// src/hooks/stages.js
//
// Single source of truth for the INOS CRM pipeline stages (the Bigin-style
// board at /crm/pipeline). Ids match the backend `LeadStage` enum
// (capture → qual → disc → prop → nego → contract → handoff, plus the
// parked/closed columns nurture and lost).
//
// Colours are Quiet Studio pastel tokens only: `tone` maps to the
// --{tone}-bg / --{tone}-fg / --{tone}-dot variables in inos-theme.css.

const toneVars = (tone) => ({
  tone,
  accent: `var(--${tone}-dot)`,
  fg: `var(--${tone}-fg)`,
  bg: `var(--${tone}-bg)`,
});

export const STAGES = [
  { id: "capture", label: "Lead Capture", short: "Capture", ...toneVars("mute") },
  { id: "qual", label: "Qualification", short: "Qualify", ...toneVars("info") },
  { id: "disc", label: "Discovery / Site Visit", short: "Discovery", ...toneVars("lilac") },
  { id: "prop", label: "Proposal", short: "Proposal", ...toneVars("peach") },
  { id: "nego", label: "Negotiation", short: "Negotiate", ...toneVars("warn") },
  { id: "contract", label: "Contract Signed", short: "Contract", won: true, ...toneVars("ok") },
  { id: "handoff", label: "Handoff to Execution", short: "Handoff", won: true, ...toneVars("ok") },
  { id: "nurture", label: "Nurture", short: "Nurture", closed: true, ...toneVars("mute") },
  { id: "lost", label: "Closed Lost", short: "Lost", closed: true, ...toneVars("bad") },
];

// The linear pipeline shown in the stage stepper (no parked/closed columns)
export const PIPELINE_STEPS = STAGES.filter((s) => !s.closed);
export const OPEN_STAGE_IDS = ["capture", "qual", "disc", "prop", "nego"];

// Older records / Zoho Bigin stage names → INOS stage ids
const LEGACY = {
  Qualification: "qual",
  "Needs Analysis": "disc",
  "Proposal/Price Quote": "prop",
  "Negotiation/Review": "nego",
  "Closed Won": "contract",
  "Closed Lost": "lost",
};

export const stageOf = (id) =>
  STAGES.find((s) => s.id === id) ||
  STAGES.find((s) => s.id === LEGACY[id]) || {
    id,
    label: id || "Unknown",
    short: id || "Unknown",
    ...toneVars("mute"),
  };

export const getStageAccent = (id) => stageOf(id).accent;

// ----------------------------------------------------------------
// Card colour rail (Card colour menu <-> `color` field)
// ----------------------------------------------------------------
export const LEAD_COLORS = {
  Green: { rail: "var(--ok-dot)" },
  Red: { rail: "var(--bad-dot)" },
  Yellow: { rail: "var(--warn-dot)" },
  Blue: { rail: "var(--info-dot)" },
};

// ----------------------------------------------------------------
// Tag pill colours
// ----------------------------------------------------------------
export const TAG_COLORS = {
  Hot: { fg: "var(--bad-fg)", bg: "var(--bad-bg)", tone: "bad" },
  Warm: { fg: "var(--warn-fg)", bg: "var(--warn-bg)", tone: "warn" },
  Cold: { fg: "var(--info-fg)", bg: "var(--info-bg)", tone: "info" },
  VIP: { fg: "var(--lilac-fg)", bg: "var(--lilac-bg)", tone: "lilac" },
};

export const pill = (fg, bg) => ({
  color: fg || "var(--ink-green)",
  background: bg || "var(--mist)",
});

export const labelStyle = {
  fontSize: "10.5px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--muted)",
};

// ----------------------------------------------------------------
// Money in Indian units: ₹45 L, ₹1.2 Cr
// ----------------------------------------------------------------
export const formatINR = (value, { compact = true } = {}) => {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/[₹,\s]/g, ""));
  if (value == null || value === "" || !Number.isFinite(n)) return "—";
  if (!compact) return `₹${Math.round(n).toLocaleString("en-IN")}`;
  const trim = (x) => x.toFixed(2).replace(/\.?0+$/, "");
  if (n >= 1e7) return `₹${trim(n / 1e7)} Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)} L`;
  if (n === 0) return "₹0";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};
