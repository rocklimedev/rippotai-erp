import React from "react";

/* INOS module icons — "frosted duotone".
   A solid ink-green back shape sits behind a pale sage glass shape; where they
   overlap, the green shows through blurred, like frosted glass. White or green
   glyph details sit on top. viewBox 80×80, artwork kept inside 8–72.        */

const P = "#1F453B"; // brand ink green
const GLASS = "#B8CCBF"; // sage glass
const W = "#FFFFFF";

function Glass({ id, back, front, glyph }) {
  const f = `inos-blur-${id}`;
  const c = `inos-clip-${id}`;
  const g = `inos-sheen-${id}`;
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
      <defs>
        <filter id={f} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <clipPath id={c}>{front}</clipPath>
        <linearGradient id={g} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={W} stopOpacity="0.85" />
          <stop offset="1" stopColor={W} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fill={P}>{back}</g>
      <g clipPath={`url(#${c})`}>
        <rect width="80" height="80" fill={GLASS} />
        <g fill={P} filter={`url(#${f})`} opacity="0.7">
          {back}
        </g>
        <rect width="80" height="80" fill={`url(#${g})`} opacity="0.3" />
      </g>
      <g fill="none" stroke={W} strokeOpacity="0.7" strokeWidth="1">
        {front}
      </g>
      {glyph}
    </svg>
  );
}

const make = (id, parts) => {
  const C = () => <Glass id={id} {...parts} />;
  C.displayName = `Icon_${id}`;
  return C;
};

/* ---------------------------------------------------------------- apps */

export const IconProjects = make("projects", {
  back: <path d="M24 14h14l5 5h19a5 5 0 0 1 5 5v22H24z" />,
  front: <path d="M13 29a6 6 0 0 1 6-6h13l5 5h23a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H19a6 6 0 0 1-6-6z" />,
  glyph: <path d="M24 53h18" stroke={W} strokeWidth="3.5" strokeLinecap="round" />,
});

export const IconDesignStudio = make("design", {
  back: <rect x="44" y="8" width="11" height="44" rx="3" transform="rotate(35 49.5 30)" />,
  front: <rect x="12" y="24" width="46" height="44" rx="7" />,
  glyph: (
    <g stroke={W} strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 36h28M21 45h28M21 54h16" />
    </g>
  ),
});

export const IconCRM = make("crm", {
  back: (
    <>
      <circle cx="56" cy="22" r="10" />
      <path d="M38 54c0-10 8-17 18-17s18 7 18 17v4H38z" />
    </>
  ),
  front: <path d="M10 30a8 8 0 0 1 8-8h24a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H27l-8 7v-7h-1a8 8 0 0 1-8-8z" />,
  glyph: (
    <g stroke={W} strokeWidth="3" strokeLinecap="round">
      <path d="M20 34h20M20 42h12" />
    </g>
  ),
});

export const IconLedger = make("ledger", {
  back: <rect x="20" y="10" width="38" height="26" rx="5" transform="rotate(-8 39 23)" />,
  front: <path d="M12 30a7 7 0 0 1 7-7h9a6 6 0 0 0 12 0h21a7 7 0 0 1 7 7v28a7 7 0 0 1-7 7H19a7 7 0 0 1-7-7z" />,
  glyph: (
    <g stroke={W} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M33 38h14M33 44h14M39 38c5 0 5 7 0 7h-5l9 10" />
    </g>
  ),
});

export const IconSiteOperations = make("siteops", {
  back: <path d="M16 52h48l7 17H9z" />,
  front: <path d="M40 8c11 0 19 8 19 19 0 13-15 27-19 31-4-4-19-18-19-31 0-11 8-19 19-19z" />,
  glyph: <circle cx="40" cy="27" r="6.5" fill={W} />,
});

export const IconMaterials = make("procure", {
  back: <path d="M28 30v-6a12 12 0 0 1 24 0v6h-6v-6a6 6 0 0 0-12 0v6z" />,
  front: <rect x="14" y="26" width="52" height="42" rx="9" />,
  glyph: (
    <g stroke={W} strokeWidth="3" strokeLinecap="round">
      <path d="M31 36v3M49 36v3" />
      <path d="M31 46c3 5 15 5 18 0" />
    </g>
  ),
});

export const IconInventory = make("inventory", {
  back: <rect x="30" y="8" width="36" height="30" rx="5" />,
  front: <rect x="12" y="26" width="46" height="42" rx="7" />,
  glyph: (
    <g stroke={W} strokeWidth="3" strokeLinecap="round">
      <path d="M12 40h46" strokeOpacity="0.8" />
      <path d="M29 40v8h12v-8" />
    </g>
  ),
});

export const IconTasks = make("tasks", {
  back: <path d="M24 38l12 12 26-28" stroke={P} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  front: <circle cx="36" cy="50" r="12" />,
  glyph: null,
});

export const IconCalendar = make("calendar", {
  back: (
    <>
      <rect x="23" y="8" width="8" height="18" rx="4" />
      <rect x="49" y="8" width="8" height="18" rx="4" />
    </>
  ),
  front: <rect x="12" y="16" width="56" height="54" rx="10" />,
  glyph: (
    <text x="40" y="57" textAnchor="middle" fontFamily="Plus Jakarta Sans Variable, Plus Jakarta Sans, system-ui, sans-serif" fontSize="24" fontWeight="800" fill={W}>
      31
    </text>
  ),
});

export const IconCommandCenter = make("command", {
  back: <circle cx="50" cy="40" r="22" />,
  front: <circle cx="30" cy="40" r="22" />,
  glyph: (
    <g stroke={W} strokeWidth="2.5" strokeLinecap="round">
      <circle cx="30" cy="40" r="7" />
      <path d="M30 24v6M30 50v6M14 40h6M40 40h6" />
    </g>
  ),
});

export const IconAdminConsole = make("admin", {
  back: (
    <>
      <circle cx="56" cy="20" r="9" />
      <path d="M42 48c0-8 6-14 14-14s14 6 14 14v3H42z" />
    </>
  ),
  front: <path d="M34 14l22 8v16c0 16-11 26-22 30-11-4-22-14-22-30V22z" />,
  glyph: (
    <g fill={W}>
      <circle cx="34" cy="37" r="5" />
      <rect x="31.5" y="40" width="5" height="11" rx="2.5" />
    </g>
  ),
});

export const IconAutomation = make("automation", {
  back: <circle cx="52" cy="30" r="15" />,
  front: <rect x="8" y="30" width="54" height="28" rx="14" />,
  glyph: <circle cx="22" cy="44" r="9" fill={W} />,
});

export const IconDashboard = make("dashboard", {
  back: (
    <>
      <rect x="40" y="10" width="28" height="28" rx="7" />
      <rect x="12" y="42" width="28" height="28" rx="7" />
    </>
  ),
  front: (
    <>
      <rect x="18" y="16" width="28" height="28" rx="7" />
      <rect x="34" y="36" width="28" height="28" rx="7" />
    </>
  ),
  glyph: null,
});

export const IconSettings = make("settings", {
  back: (
    <>
      <circle cx="54" cy="26" r="9" />
      <circle cx="28" cy="54" r="9" />
    </>
  ),
  front: (
    <>
      <rect x="10" y="20" width="60" height="12" rx="6" />
      <rect x="10" y="48" width="60" height="12" rx="6" />
    </>
  ),
  glyph: null,
});

/* ---------------------------------------------------------------- extra keys still referenced */

export const IconBoq = make("boq", {
  back: <rect x="40" y="18" width="30" height="44" rx="10" />,
  front: <rect x="10" y="12" width="46" height="56" rx="10" />,
  glyph: (
    <g stroke={W} strokeWidth="3" strokeLinecap="round">
      <path d="M20 28h8M24 24v8M38 28h8M20 50h8M38 47h8M38 53h8M21 43l6 6M27 43l-6 6" />
    </g>
  ),
});

export const IconQuotations = make("quotes", {
  back: <rect x="36" y="14" width="30" height="36" rx="6" transform="rotate(22 51 32)" />,
  front: <path d="M16 30l14-14h14a6 6 0 0 1 6 6v40a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z" />,
  glyph: (
    <g stroke={W} strokeWidth="3" strokeLinecap="round">
      <circle cx="29" cy="28" r="2.5" fill={W} />
      <path d="M26 56l14-16" />
      <circle cx="27" cy="43" r="2" fill={W} />
      <circle cx="39" cy="54" r="2" fill={W} />
    </g>
  ),
});

export const IconVendors = make("vendors", {
  back: (
    <>
      <circle cx="54" cy="24" r="10" />
      <path d="M38 58c0-10 7-18 16-18s16 8 16 18z" />
    </>
  ),
  front: (
    <>
      <circle cx="30" cy="28" r="12" />
      <path d="M10 66c0-12 9-22 20-22s20 10 20 22z" />
    </>
  ),
  glyph: null,
});

export const IconClients = make("clients", {
  back: <circle cx="54" cy="22" r="12" />,
  front: <rect x="10" y="26" width="52" height="40" rx="8" />,
  glyph: (
    <g stroke={W} strokeWidth="3" strokeLinecap="round">
      <circle cx="26" cy="42" r="5" />
      <path d="M36 40h16M36 48h10M20 56c2-4 10-4 12 0" />
    </g>
  ),
});

export const IconLeads = make("leads", {
  back: (
    <>
      <circle cx="58" cy="18" r="9" />
      <path d="M46 44c0-8 5-14 12-14s12 6 12 14z" />
    </>
  ),
  front: <path d="M10 26a7 7 0 0 1 7-7h28a7 7 0 0 1 7 7v18a7 7 0 0 1-7 7H32l-6 7-6-7h-3a7 7 0 0 1-7-7z" />,
  glyph: <path d="M24 30c-4-4-10 1-5 6l5 5 5-5c5-5-1-10-5-6z" fill={W} />,
});

export const IconDocuments = make("documents", {
  back: <rect x="26" y="10" width="36" height="44" rx="6" transform="rotate(8 44 32)" />,
  front: <path d="M10 32a6 6 0 0 1 6-6h14l5 5h29a6 6 0 0 1 6 6v25a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6z" />,
  glyph: <path d="M22 54h20" stroke={W} strokeWidth="3.5" strokeLinecap="round" />,
});

export const IconNotes = make("notes", {
  back: <rect x="34" y="10" width="34" height="40" rx="6" />,
  front: <rect x="12" y="22" width="40" height="48" rx="7" />,
  glyph: (
    <g stroke={W} strokeWidth="3" strokeLinecap="round">
      <path d="M21 36h22M21 45h22M21 54h14" />
    </g>
  ),
});

/* ---------------------------------------------------------------- registry */

export const MODULE_ICONS = {
  dashboard: IconDashboard,

  boq: IconBoq,
  projects: IconProjects,
  quotations: IconQuotations,
  vendors: IconVendors,
  leads: IconLeads,
  clients: IconClients,
  crm: IconCRM,

  ledger: IconLedger,
  commandCenter: IconCommandCenter,
  automation: IconAutomation,
  documents: IconDocuments,

  // Both spellings are used across the app (APP_META vs DASHBOARD_CONFIG)
  designStudio: IconDesignStudio,
  design_studio: IconDesignStudio,

  procurement: IconMaterials,
  materials: IconMaterials,
  siteOperations: IconSiteOperations,
  tasks: IconTasks,
  notes: IconNotes,
  inventory: IconInventory,
  calendar: IconCalendar,
  settings: IconSettings,
  adminConsole: IconAdminConsole,
};

export const APP_ICONS = MODULE_ICONS;

export default MODULE_ICONS;
