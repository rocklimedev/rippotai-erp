// Shared design tokens + lookup helpers for the Leads module.
// Colors are drawn from the app's brand palette (see index.css --ink-green,
// --sage, --mist, --gold etc.) rather than one-off hex values, so this module
// stays visually consistent with the rest of the product.

export const card = {
  background: "#FFFFFF",
  border: "1px solid #E4EBF1",
  borderRadius: "16px",
  boxShadow: "0 2px 8px rgba(22, 27, 29, 0.04)",
};
export const STAGES = [
  { id: "capture", label: "Lead Capture" },
  { id: "qual", label: "Qualification" },
  { id: "disc", label: "Discovery / Site Visit" },
  { id: "prop", label: "Proposal / Concept" },
  { id: "nego", label: "Negotiation" },
  { id: "contract", label: "Contract Signed" },
  { id: "handoff", label: "Handoff to Execution" },
];

export const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D7DEE4",
  borderRadius: "10px",
  fontSize: "13px",
  color: "#161B1D",
  background: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",
};

// Each stage gets a tint drawn from one consistent earthy family so the
// pipeline reads as a gradient of progress rather than a traffic light.
const STAGE_META = {
  capture: {
    label: "Lead Capture",
    fg: "#5b6b64",
    bg: "#eef1ef",
    rail: "#b5c4b6",
  },
  qual: {
    label: "Qualification",
    fg: "#3f6d5f",
    bg: "#e3ede9",
    rail: "#3f6d5f",
  },
  disc: {
    label: "Discovery / Site Visit",
    fg: "#a3701a",
    bg: "#f6edda",
    rail: "#c98f2b",
  },
  prop: {
    label: "Proposal / Concept",
    fg: "#7c5d92",
    bg: "#efe7f2",
    rail: "#7c5d92",
  },
  nego: { label: "Negotiation", fg: "#a54536", bg: "#f5e7e4", rail: "#a54536" },
  contract: {
    label: "Contract Signed",
    fg: "#1f453b",
    bg: "#e3f0ea",
    rail: "#1f453b",
  },
  handoff: {
    label: "Handoff to Execution",
    fg: "#ffffff",
    bg: "#1f453b",
    rail: "#1f453b",
  },
};

export function stageOf(stage) {
  return (
    STAGE_META[stage] || {
      label: stage || "—",
      fg: "#6b7b7c",
      bg: "#eaeef0",
      rail: "#b5c4b6",
    }
  );
}

export const TAG_COLORS = {
  Hot: { fg: "#a54536", bg: "#f5e7e4" },
  Warm: { fg: "#a3701a", bg: "#f6edda" },
  Cold: { fg: "#3f6d8a", bg: "#e6edf3" },
  VIP: { fg: "#7c5d92", bg: "#efe7f2" },
  Referral: { fg: "#3f6d5f", bg: "#e3ede9" },
};

export const LEAD_COLORS = {
  Green: { fg: "#1f453b", bg: "#e3f0ea", rail: "#1f453b" },
  Red: { fg: "#a54536", bg: "#f5e7e4", rail: "#a54536" },
  Yellow: { fg: "#a3701a", bg: "#f6edda", rail: "#c98f2b" },
  Blue: { fg: "#3f6d8a", bg: "#e6edf3", rail: "#3f6d8a" },
};

// Small style helper for the pill/chip look — pairs with the .bc-chip class
// in index.css, which already handles overflow/truncation/shape.
export function pill(fg, bg) {
  return { color: fg, background: bg };
}

export const labelStyle = {
  fontFamily: '"Poppins","Arial",sans-serif',
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--muted)",
};
