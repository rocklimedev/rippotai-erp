// Indian numbering system currency formatter e.g., 3116080 -> ₹31,16,080
export function formatINR(n) {
  if (n === null || n === undefined || isNaN(n)) return "₹0";
  const num = Math.round(Number(n));
  const sign = num < 0 ? "-" : "";
  const s = String(Math.abs(num));
  if (s.length <= 3) return `${sign}₹${s}`;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const withCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${sign}₹${withCommas},${last3}`;
}

export function formatINRShort(n) {
  if (n === null || n === undefined || isNaN(n)) return "₹0";
  const num = Number(n);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return formatINR(num);
}

export function relativeTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}

export function daysUntil(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = then - Date.now();
  const d = Math.round(diff / (1000 * 60 * 60 * 24));
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  return `in ${d}d`;
}

export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Phase 4 additions
export const fmtINR = formatINR;

// Status chip meta: icon + label (color-blind safe, palette-restricted)
// Variants:
//  outline-ink : white bg, black border+text (default / neutral)
//  outline-red : white bg, red border + red text (attention / in-progress soft)
//  solid-ink   : black bg, white text (approved / selected / locked)
//  solid-red   : red bg, white text (delayed / rejected / critical)
//  dashed-ink  : dashed border, muted text (draft)
//  muted       : #EAEEF0 bg, muted text (archived / expired)
export const STATUS_META = {
  draft: { l: "Draft", icon: "pencil", variant: "dashed-ink" },
  requested: { l: "Requested", icon: "clock", variant: "outline-ink" },
  received: { l: "Received", icon: "inbox", variant: "outline-ink" },
  under_review: { l: "Under Review", icon: "clock", variant: "outline-red" },
  awaiting_approval: {
    l: "Awaiting Approval",
    icon: "clock",
    variant: "outline-red",
  },
  awaiting_input: {
    l: "Awaiting Input",
    icon: "clock",
    variant: "outline-ink",
  },
  returned: { l: "Returned", icon: "undo", variant: "outline-red" },
  approved: { l: "Approved", icon: "check", variant: "solid-ink" },
  rejected: { l: "Rejected", icon: "x", variant: "solid-red" },
  selected: { l: "Selected", icon: "check", variant: "solid-ink" },
  not_selected: { l: "Not Selected", icon: "minus", variant: "muted" },
  expired: { l: "Expired", icon: "clock", variant: "muted" },
  archived: { l: "Archived", icon: "archive", variant: "muted" },
  completed: { l: "Completed", icon: "check", variant: "outline-ink" },
  on_track: { l: "On Track", icon: "check", variant: "outline-ink" },
  at_risk: { l: "At Risk", icon: "alert", variant: "outline-red" },
  delayed: { l: "Delayed", icon: "alert", variant: "solid-red" },
  in_progress: { l: "In Progress", icon: "loader", variant: "outline-red" },
  locked: { l: "Locked", icon: "lock", variant: "solid-ink" },
  on_hold: { l: "On Hold", icon: "pause", variant: "muted" },
};

const VARIANT_CLS = {
  "outline-ink": "bg-[#FFFFFF] text-[#333333] border border-[#B5C4B6]",
  "outline-red":
    "bg-[#FFFFFF] text-[#6B7B7C] border border-dashed border-[#6B7B7C]",
  "solid-ink": "bg-[#1F453B] text-[#EAEEF0] border border-[#1F453B]",
  "solid-red": "bg-[#1F453B] text-[#EAEEF0] border border-[#1F453B]",
  "dashed-ink":
    "bg-[#FFFFFF] text-[#6B7B7C] border border-dashed border-[#B5C4B6]",
  muted: "bg-[#D8E0DA] text-[#6B7B7C] border border-[#B5C4B6]/60",
};

function ChipIcon({ name }) {
  const s = {
    width: 11,
    height: 11,
    strokeWidth: 2,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "check":
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "alert":
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M12 3l10 18H2z" />
          <path d="M12 10v4M12 17.5v.5" />
        </svg>
      );
    case "lock":
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 018 0v3" />
        </svg>
      );
    case "pencil":
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M4 20h4L20 8l-4-4L4 16v4z" />
        </svg>
      );
    case "archive":
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <rect x="3" y="3" width="18" height="4" />
          <path d="M5 7v13h14V7M10 12h4" />
        </svg>
      );
    case "loader":
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M12 3a9 9 0 019 9" />
        </svg>
      );
    case "inbox":
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M4 13l3-8h10l3 8v6H4z" />
          <path d="M4 13h5l1 3h4l1-3h5" />
        </svg>
      );
    case "undo":
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M9 14l-4-4 4-4" />
          <path d="M5 10h9a5 5 0 010 10h-3" />
        </svg>
      );
    case "minus":
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M5 12h14" />
        </svg>
      );
    case "pause":
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M8 5v14M16 5v14" />
        </svg>
      );
    default:
      return null;
  }
}

export function StatusChip({ status, variant }) {
  const s = STATUS_META[status] || STATUS_META.draft;
  const v = variant || s.variant;
  const cls = VARIANT_CLS[v] || VARIANT_CLS["outline-ink"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${cls}`}
    >
      <ChipIcon name={s.icon} />
      {s.l}
    </span>
  );
}
