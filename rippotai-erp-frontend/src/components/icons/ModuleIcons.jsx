import React from "react";
// INOS deep-green module icons (mosaic style)
// Primary: #1F453B  Secondary: #B5C4B6 / #D8E0DA  Highlight: #FFFFFF or #EAEEF0
const P = "#1F453B",
  S = "#B5C4B6",
  SS = "#D8E0DA",
  W = "#FFFFFF";

const wrap = (kids) => (
  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" fill="none">
    {kids}
  </svg>
);
export const IconCRM = () =>
  wrap(
    <>
      {/* CRM / customer relationship network */}

      {/* Central customer */}
      <circle cx="40" cy="30" r="10" fill={P} />

      <path d="M24 60 C24 48 30 42 40 42 C50 42 56 48 56 60 Z" fill={P} />

      {/* Left contact */}
      <circle cx="17" cy="34" r="7" fill={S} />

      <path
        d="M7 60 C7 51 11 46 17 46 C21 46 25 49 27 54"
        stroke={S}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Right contact */}
      <circle cx="63" cy="34" r="7" fill={S} />

      <path
        d="M73 60 C73 51 69 46 63 46 C59 46 55 49 53 54"
        stroke={S}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Relationship connections */}
      <path
        d="M25 36 L31 33"
        stroke={P}
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M55 33 L61 36"
        stroke={P}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* CRM activity / relationship indicator */}
      <circle cx="60" cy="59" r="10" fill={P} />

      <path
        d="M55 59 L58 62 L64 55"
        stroke={W}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>,
  );
export const IconLedger = () =>
  wrap(
    <>
      {/* Ledger / financial records */}

      {/* Main ledger book */}
      <rect x="12" y="10" width="50" height="60" rx="7" fill={S} />

      {/* Dark front cover */}
      <rect x="20" y="10" width="48" height="60" rx="7" fill={P} />

      {/* Ledger spine */}
      <rect x="20" y="10" width="7" height="60" rx="3" fill={SS} />

      {/* Ledger title / header */}
      <rect x="32" y="20" width="26" height="5" rx="2.5" fill={W} />

      {/* Transaction rows */}
      <rect x="32" y="32" width="12" height="4" rx="2" fill={SS} />
      <rect x="48" y="32" width="10" height="4" rx="2" fill={W} />

      <rect x="32" y="42" width="12" height="4" rx="2" fill={SS} />
      <rect x="48" y="42" width="10" height="4" rx="2" fill={W} />

      <rect x="32" y="52" width="12" height="4" rx="2" fill={SS} />
      <rect x="48" y="52" width="10" height="4" rx="2" fill={W} />

      {/* Balance / transaction indicator */}
      <circle cx="58" cy="60" r="10" fill={P} />

      <path d="M53 60 H63" stroke={W} strokeWidth="2.5" strokeLinecap="round" />

      <path d="M58 55 V65" stroke={W} strokeWidth="2.5" strokeLinecap="round" />
    </>,
  );
export const IconBoq = () =>
  wrap(
    <>
      {/* Three horizontal bars, lengths taper down */}
      <rect x="10" y="18" width="60" height="8" rx="4" fill={P} />
      <rect x="10" y="34" width="50" height="8" rx="4" fill={P} />
      <rect x="10" y="50" width="42" height="8" rx="4" fill={P} />
      {/* Check circle overlapping bottom-right */}
      <circle cx="60" cy="58" r="12" fill={P} />
      <path
        d="M54 58 L58.5 62.5 L66 54"
        stroke={W}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>,
  );
export const IconDesignStudio = () =>
  wrap(
    <>
      {/* Drawing sheet */}
      <rect x="12" y="10" width="48" height="60" rx="7" fill={S} />

      {/* Drawing sheet header */}
      <rect x="12" y="10" width="48" height="12" rx="7" fill={P} />

      {/* Architectural / technical drawing */}
      <path
        d="M22 34 L38 26 L52 34 L38 42 Z"
        stroke={P}
        strokeWidth="3"
        strokeLinejoin="round"
        fill={W}
      />

      <path d="M38 26 V42" stroke={P} strokeWidth="2.5" strokeLinecap="round" />

      <path d="M22 34 H52" stroke={P} strokeWidth="2.5" strokeLinecap="round" />

      {/* Drawing dimensions */}
      <path d="M20 50 H52" stroke={P} strokeWidth="2.5" strokeLinecap="round" />

      <path d="M20 56 H42" stroke={P} strokeWidth="2.5" strokeLinecap="round" />

      {/* Create / edit indicator */}
      <circle cx="58" cy="58" r="11" fill={P} />

      <path d="M53 62 L55 57 L62 50 L66 54 L59 61 Z" fill={W} />

      <path
        d="M61 51 L65 55"
        stroke={P}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>,
  );
export const IconAdminConsole = () =>
  wrap(
    <>
      {/* Shield / administration base */}
      <path
        d="M40 8 L64 18 V36 C64 52 54 64 40 70 C26 64 16 52 16 36 V18 Z"
        fill={P}
      />

      {/* Inner shield */}
      <path
        d="M40 18 L54 24 V36 C54 46 48 54 40 58 C32 54 26 46 26 36 V24 Z"
        fill={S}
      />

      {/* Admin user */}
      <circle cx="40" cy="31" r="6" fill={P} />

      <path d="M30 48 C30 41 34 38 40 38 C46 38 50 41 50 48 Z" fill={P} />

      {/* Permission / control indicator */}
      <circle cx="57" cy="57" r="10" fill={P} />

      <path d="M52 57 H62" stroke={W} strokeWidth="2.5" strokeLinecap="round" />

      <path d="M57 52 V62" stroke={W} strokeWidth="2.5" strokeLinecap="round" />
    </>,
  );
export const IconProjects = () =>
  wrap(
    <>
      {/* Two overlapping deep-green rounded squares */}
      <rect x="8" y="8" width="42" height="42" rx="10" fill={P} />
      <rect
        x="30"
        y="30"
        width="42"
        height="42"
        rx="10"
        fill={P}
        fillOpacity="0.85"
      />
    </>,
  );
export const IconSiteOperations = () =>
  wrap(
    <>
      {/* Site / construction operations icon */}

      {/* Back structure / building */}
      <rect x="14" y="18" width="52" height="46" rx="6" fill={S} />

      {/* Building roof / site structure */}
      <path d="M10 28 L40 10 L70 28" fill={P} />

      {/* Building interior */}
      <rect x="23" y="34" width="12" height="18" rx="2" fill={P} />

      <rect x="45" y="34" width="12" height="8" rx="2" fill={P} />

      <rect x="45" y="46" width="12" height="6" rx="2" fill={P} />

      {/* Operations / completion indicator */}
      <circle cx="59" cy="58" r="11" fill={P} />

      <path
        d="M53 58 L57.5 62.5 L65 54"
        stroke={W}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>,
  );
export const IconDocuments = () =>
  wrap(
    <>
      <rect x="10" y="14" width="46" height="56" rx="8" fill={S} />
      <rect x="22" y="8" width="46" height="56" rx="8" fill={P} />
      <rect x="30" y="22" width="30" height="3.5" rx="2" fill={W} />
      <rect x="30" y="32" width="30" height="3.5" rx="2" fill={W} />
      <rect x="30" y="42" width="22" height="3.5" rx="2" fill={W} />
    </>,
  );

export const IconQuotations = () =>
  wrap(
    <>
      <path
        d="M18 8 H60 V64 L54 60 L48 64 L42 60 L36 64 L30 60 L24 64 L18 60 Z"
        fill={P}
      />
      <rect x="26" y="22" width="26" height="3.5" rx="2" fill={W} />
      <rect x="26" y="30" width="26" height="3.5" rx="2" fill={W} />
      <rect x="26" y="38" width="18" height="3.5" rx="2" fill={W} />
      <circle cx="54" cy="52" r="10" fill={SS} />
      <text
        x="54"
        y="57"
        textAnchor="middle"
        fill={P}
        fontFamily="Poppins"
        fontSize="12"
        fontWeight="600"
      >
        ₹
      </text>
    </>,
  );

export const IconVendors = () =>
  wrap(
    <>
      {/* Three people; front center larger and deep-green, back left/right smaller and sage */}
      {/* Back left */}
      <circle cx="20" cy="26" r="8" fill="#8AA398" />
      <rect x="6" y="42" width="28" height="20" rx="12" fill="#8AA398" />
      {/* Back right */}
      <circle cx="60" cy="26" r="8" fill="#8AA398" />
      <rect x="46" y="42" width="28" height="20" rx="12" fill="#8AA398" />
      {/* Front center (larger) */}
      <circle cx="40" cy="24" r="11" fill={P} />
      <path
        d="M40 40 C 26 40 20 52 20 62 C 20 66 24 68 40 68 C 56 68 60 66 60 62 C 60 52 54 40 40 40 Z"
        fill={P}
      />
    </>,
  );

export const IconClients = () =>
  wrap(
    <>
      <circle cx="40" cy="28" r="12" fill={P} />
      <path d="M18 62 C18 50 28 42 40 42 C52 42 62 50 62 62 Z" fill={S} />
    </>,
  );

export const IconTasks = () =>
  wrap(
    <>
      {/* Single rounded square tile with white check */}
      <rect x="8" y="8" width="64" height="64" rx="18" fill={P} />
      <path
        d="M24 42 L36 54 L58 30"
        stroke={W}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>,
  );

export const IconNotes = () =>
  wrap(
    <>
      <rect x="14" y="12" width="46" height="56" rx="6" fill={S} />
      <rect x="14" y="12" width="46" height="10" rx="6" fill={P} />
      <rect x="22" y="32" width="30" height="3.5" rx="2" fill={P} />
      <rect x="22" y="40" width="30" height="3.5" rx="2" fill={P} />
      <rect x="22" y="48" width="20" height="3.5" rx="2" fill={P} />
    </>,
  );
export const IconMaterials = () =>
  wrap(
    <>
      {/* Material / stacked boxes */}
      <rect x="10" y="42" width="26" height="24" rx="5" fill={S} />
      <rect x="44" y="42" width="26" height="24" rx="5" fill={P} />

      {/* Top box */}
      <path d="M40 10 L62 21 L40 32 L18 21 Z" fill={P} />

      {/* Box center seam */}
      <path d="M40 32 V58" stroke={W} strokeWidth="3.5" strokeLinecap="round" />

      {/* Material lines */}
      <path d="M24 49 H31" stroke={P} strokeWidth="3" strokeLinecap="round" />

      <path d="M49 49 H63" stroke={W} strokeWidth="3" strokeLinecap="round" />

      <path d="M49 56 H59" stroke={W} strokeWidth="3" strokeLinecap="round" />
    </>,
  );
export const IconLeads = () =>
  wrap(
    <>
      <rect x="14" y="12" width="46" height="56" rx="6" fill={S} />
      <rect x="14" y="12" width="46" height="10" rx="6" fill={P} />
      <rect x="22" y="32" width="30" height="3.5" rx="2" fill={P} />
      <rect x="22" y="40" width="30" height="3.5" rx="2" fill={P} />
      <rect x="22" y="48" width="20" height="3.5" rx="2" fill={P} />
    </>,
  );
export const IconInventory = () =>
  wrap(
    <>
      <path d="M40 8 L66 20 V50 L40 64 L14 50 V20 Z" fill={S} />
      <path d="M14 20 L40 32 L66 20" stroke={P} strokeWidth="4" fill="none" />
      <path d="M40 32 V64" stroke={P} strokeWidth="4" fill="none" />
      <path d="M40 8 L66 20 V32 L40 44 L14 32 V20 Z" fill={P} />
    </>,
  );

export const IconCalendar = () =>
  wrap(
    <>
      {/* Two hook pills at top */}
      <rect x="22" y="6" width="6" height="14" rx="3" fill={P} />
      <rect x="52" y="6" width="6" height="14" rx="3" fill={P} />
      {/* Calendar body: sage header, deep-green body */}
      <rect x="10" y="16" width="60" height="54" rx="8" fill={P} />
      <rect x="10" y="16" width="60" height="14" rx="8" fill="#7A8F86" />
      <rect x="10" y="22" width="60" height="8" fill="#7A8F86" />
      {/* 3-then-2 grid of white rounded date cells */}
      <rect x="18" y="38" width="12" height="10" rx="2.5" fill={W} />
      <rect x="34" y="38" width="12" height="10" rx="2.5" fill={W} />
      <rect x="50" y="38" width="12" height="10" rx="2.5" fill={W} />
      <rect x="26" y="54" width="12" height="10" rx="2.5" fill={W} />
      <rect x="42" y="54" width="12" height="10" rx="2.5" fill={W} />
    </>,
  );

export const IconSettings = () =>
  wrap(
    <>
      {/* Gear tile: deep-green rounded square base, sage cog, white hub */}
      <rect x="8" y="8" width="64" height="64" rx="18" fill={P} />
      <g transform="translate(40,40)">
        {/* 8 teeth around the cog */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <rect
            key={deg}
            x="-4.5"
            y="-25"
            width="9"
            height="12"
            rx="2.5"
            fill={SS}
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r="15" fill={SS} />
        <circle r="6.5" fill={P} />
      </g>
    </>,
  );
export const IconDashboard = () =>
  wrap(
    <>
      {/* Background tile */}
      <rect x="8" y="8" width="64" height="64" rx="16" fill={P} />

      {/* Four dashboard panels */}
      <rect x="18" y="18" width="18" height="18" rx="4" fill={W} />
      <rect x="44" y="18" width="18" height="18" rx="4" fill={SS} />
      <rect x="18" y="44" width="18" height="18" rx="4" fill={SS} />
      <rect x="44" y="44" width="18" height="18" rx="4" fill={W} />
    </>,
  );
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

  documents: IconDocuments,
  designStudio: IconDesignStudio,
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
