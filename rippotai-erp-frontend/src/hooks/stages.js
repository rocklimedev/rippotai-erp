// src/hooks/stages.js
//
// Single source of truth for the Zoho Bigin "Pipelines" stage
// picklist used by the Leads board. This mirrors the stages
// configured on the Bigin pipeline itself (Settings > Pipelines):
// Qualification -> Needs Analysis -> Proposal/Price Quote ->
// Negotiation/Review -> Closed Won -> Closed Lost.
//
// If the pipeline is edited in Bigin (stage renamed/added/reordered),
// update this list — the board columns, accent colors, and labels
// all derive from it.

// `accent` is the solid color used on the board (column header dot +
// top border), matching Bigin's own board where every open stage
// shares one accent and only Closed Won/Lost stand out (green/red).
//
// `bg`/`fg` are a softer pastel pair used for badges/pills elsewhere
// (e.g. the Pipeline column on ContactsView) — these vary per stage
// so a Qualification badge doesn't look identical to a Negotiation
// one in a plain list view. Purely a display choice; change freely.
export const STAGES = [
  {
    id: "Qualification",
    label: "Qualification",
    accent: "#3f6d8a",
    fg: "#3f6d8a",
    bg: "#eaf1f5",
  },
  {
    id: "Needs Analysis",
    label: "Needs Analysis",
    accent: "#3f6d8a",
    fg: "#6b7f68",
    bg: "#eef3ec",
  },
  {
    id: "Proposal/Price Quote",
    label: "Proposal/Price Quote",
    accent: "#3f6d8a",
    fg: "#8a6b3f",
    bg: "#f5efe3",
  },
  {
    id: "Negotiation/Review",
    label: "Negotiation/Review",
    accent: "#3f6d8a",
    fg: "#6c5b7c",
    bg: "#f1ecf5",
  },
  {
    id: "Closed Won",
    label: "Closed Won",
    accent: "#3f6d5f",
    fg: "#3f6d5f",
    bg: "#eaf3ee",
  },
  {
    id: "Closed Lost",
    label: "Closed Lost",
    accent: "#a54536",
    fg: "#a54536",
    bg: "#fbeae6",
  },
];

export const stageOf = (id) =>
  STAGES.find((s) => s.id === id) || {
    id,
    label: id || "Unknown",
    accent: "var(--ink-green)",
    fg: "var(--muted)",
    bg: "var(--mist)",
  };

export const getStageAccent = (id) => stageOf(id).accent;

// ----------------------------------------------------------------
// Card color dots (LeadCard "Card color" menu <-> Card_Color field)
// ----------------------------------------------------------------
export const LEAD_COLORS = {
  Green: { rail: "#1f453b" },
  Red: { rail: "#a54536" },
  Yellow: { rail: "#c98f2b" },
  Blue: { rail: "#3f6d8a" },
};

// ----------------------------------------------------------------
// Tag pill colors — rename/extend to match your Tag picklist values
// in Bigin's Pipelines module.
// ----------------------------------------------------------------
export const TAG_COLORS = {
  Hot: { fg: "#a54536", bg: "#fbeae6" },
  Warm: { fg: "#a3701a", bg: "#f7f0e1" },
  Cold: { fg: "#3f6d8a", bg: "#eaf1f5" },
  VIP: { fg: "#6c5b7c", bg: "#f1ecf5" },
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
