import React from "react";
// INOS deep-green module icons (mosaic style)
// Primary: #1F453B  Secondary: #B5C4B6 / #D8E0DA  Highlight: #FFFFFF or #EAEEF0
const P="#1F453B", S="#B5C4B6", SS="#D8E0DA", W="#FFFFFF";

const wrap = (kids) => (
  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" fill="none">{kids}</svg>
);

export const IconBoq = () => wrap(<>
  {/* Three horizontal bars, lengths taper down */}
  <rect x="10" y="18" width="60" height="8" rx="4" fill={P}/>
  <rect x="10" y="34" width="50" height="8" rx="4" fill={P}/>
  <rect x="10" y="50" width="42" height="8" rx="4" fill={P}/>
  {/* Check circle overlapping bottom-right */}
  <circle cx="60" cy="58" r="12" fill={P}/>
  <path d="M54 58 L58.5 62.5 L66 54" stroke={W} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
</>);

export const IconProjects = () => wrap(<>
  {/* Two overlapping deep-green rounded squares */}
  <rect x="8"  y="8"  width="42" height="42" rx="10" fill={P}/>
  <rect x="30" y="30" width="42" height="42" rx="10" fill={P} fillOpacity="0.85"/>
</>);

export const IconDocuments = () => wrap(<>
  <rect x="10" y="14" width="46" height="56" rx="8" fill={S}/>
  <rect x="22" y="8" width="46" height="56" rx="8" fill={P}/>
  <rect x="30" y="22" width="30" height="3.5" rx="2" fill={W}/>
  <rect x="30" y="32" width="30" height="3.5" rx="2" fill={W}/>
  <rect x="30" y="42" width="22" height="3.5" rx="2" fill={W}/>
</>);

export const IconQuotations = () => wrap(<>
  <path d="M18 8 H60 V64 L54 60 L48 64 L42 60 L36 64 L30 60 L24 64 L18 60 Z" fill={P}/>
  <rect x="26" y="22" width="26" height="3.5" rx="2" fill={W}/>
  <rect x="26" y="30" width="26" height="3.5" rx="2" fill={W}/>
  <rect x="26" y="38" width="18" height="3.5" rx="2" fill={W}/>
  <circle cx="54" cy="52" r="10" fill={SS}/>
  <text x="54" y="57" textAnchor="middle" fill={P} fontFamily="Poppins" fontSize="12" fontWeight="600">₹</text>
</>);

export const IconVendors = () => wrap(<>
  {/* Three people; front center larger and deep-green, back left/right smaller and sage */}
  {/* Back left */}
  <circle cx="20" cy="26" r="8" fill="#8AA398"/>
  <rect   x="6"  y="42" width="28" height="20" rx="12" fill="#8AA398"/>
  {/* Back right */}
  <circle cx="60" cy="26" r="8" fill="#8AA398"/>
  <rect   x="46" y="42" width="28" height="20" rx="12" fill="#8AA398"/>
  {/* Front center (larger) */}
  <circle cx="40" cy="24" r="11" fill={P}/>
  <path d="M40 40 C 26 40 20 52 20 62 C 20 66 24 68 40 68 C 56 68 60 66 60 62 C 60 52 54 40 40 40 Z" fill={P}/>
</>);

export const IconClients = () => wrap(<>
  <circle cx="40" cy="28" r="12" fill={P}/>
  <path d="M18 62 C18 50 28 42 40 42 C52 42 62 50 62 62 Z" fill={S}/>
</>);

export const IconTasks = () => wrap(<>
  {/* Single rounded square tile with white check */}
  <rect x="8" y="8" width="64" height="64" rx="18" fill={P}/>
  <path d="M24 42 L36 54 L58 30" stroke={W} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
</>);

export const IconNotes = () => wrap(<>
  <rect x="14" y="12" width="46" height="56" rx="6" fill={S}/>
  <rect x="14" y="12" width="46" height="10" rx="6" fill={P}/>
  <rect x="22" y="32" width="30" height="3.5" rx="2" fill={P}/>
  <rect x="22" y="40" width="30" height="3.5" rx="2" fill={P}/>
  <rect x="22" y="48" width="20" height="3.5" rx="2" fill={P}/>
</>);

export const IconInventory = () => wrap(<>
  <path d="M40 8 L66 20 V50 L40 64 L14 50 V20 Z" fill={S}/>
  <path d="M14 20 L40 32 L66 20" stroke={P} strokeWidth="4" fill="none"/>
  <path d="M40 32 V64" stroke={P} strokeWidth="4" fill="none"/>
  <path d="M40 8 L66 20 V32 L40 44 L14 32 V20 Z" fill={P}/>
</>);

export const IconCalendar = () => wrap(<>
  {/* Two hook pills at top */}
  <rect x="22" y="6"  width="6" height="14" rx="3" fill={P}/>
  <rect x="52" y="6"  width="6" height="14" rx="3" fill={P}/>
  {/* Calendar body: sage header, deep-green body */}
  <rect x="10" y="16" width="60" height="54" rx="8" fill={P}/>
  <rect x="10" y="16" width="60" height="14" rx="8" fill="#7A8F86"/>
  <rect x="10" y="22" width="60" height="8"        fill="#7A8F86"/>
  {/* 3-then-2 grid of white rounded date cells */}
  <rect x="18" y="38" width="12" height="10" rx="2.5" fill={W}/>
  <rect x="34" y="38" width="12" height="10" rx="2.5" fill={W}/>
  <rect x="50" y="38" width="12" height="10" rx="2.5" fill={W}/>
  <rect x="26" y="54" width="12" height="10" rx="2.5" fill={W}/>
  <rect x="42" y="54" width="12" height="10" rx="2.5" fill={W}/>
</>);

export const MODULE_ICONS = {
  boq: IconBoq, projects: IconProjects, quotations: IconQuotations, vendors: IconVendors, documents: IconDocuments,
  clients: IconClients, tasks: IconTasks, notes: IconNotes, inventory: IconInventory, calendar: IconCalendar,
};
export const APP_ICONS = MODULE_ICONS;
export default MODULE_ICONS;
