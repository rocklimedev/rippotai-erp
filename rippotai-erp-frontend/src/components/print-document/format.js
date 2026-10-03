// Formatting helpers shared by every printable document.

/** true when a value is worth printing (non-empty string/number/array). */
export const has = (v) =>
  Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== false && String(v).trim() !== "";

/** SOME_ENUM_VALUE → "Some enum value" */
export const humanize = (v) =>
  v == null
    ? ""
    : String(v)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase());

/** Look a stored value up in a label map, falling back to humanize(). */
export const labelOf = (map, v) => (v == null || v === "" ? "" : (map && map[v]) || humanize(v));

/** 12 March 2026 (en-IN). Pass { short: true } for 12 Mar 2026. */
export const fmtDate = (v, { short } = {}) => {
  if (!has(v)) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: short ? "short" : "long", year: "numeric" });
};

export const yesNo = (v) =>
  v === true || v === 1 || v === "1" || v === "Yes" || v === "YES" || v === "true"
    ? "Yes"
    : v === false || v === 0 || v === "0" || v === "No" || v === "NO" || v === "false"
      ? "No"
      : "";

/** Indian-grouped number: 1234567 → "12,34,567". */
export const num = (n, digits = 2) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return "";
  return x.toLocaleString("en-IN", { maximumFractionDigits: digits });
};

/**
 * Money. Returns { short, exact } — short uses lakh / crore, exact is ₹ with Indian grouping.
 * Returns null for empty / non-positive values unless { allowZero: true }.
 */
export const inr = (n, { allowZero, decimals = 0 } = {}) => {
  const x = Number(n);
  if (!Number.isFinite(x) || (allowZero ? x < 0 : x <= 0)) return null;
  const exact = "₹" + x.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  let short = exact;
  if (x >= 1e7) short = `₹${(x / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} crore`;
  else if (x >= 1e5) short = `₹${(x / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} lakh`;
  return { short, exact };
};

/** Exact rupee string ("₹12,34,567") or "" — for table cells. */
export const money = (n, decimals = 0) => {
  const x = Number(n);
  if (n === null || n === undefined || n === "" || !Number.isFinite(x)) return "";
  return "₹" + x.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

/** Array of strings or objects → array of non-empty strings (picks `field` from objects). */
export const listOf = (arr, field) =>
  Array.isArray(arr) ? arr.map((e) => (typeof e === "string" ? e : e?.[field])).filter(has) : [];

export const bySort = (arr, key = "sortOrder") => [...(arr || [])].sort((a, b) => (a?.[key] ?? 0) - (b?.[key] ?? 0));

/** "Some Project Name" → "some-project-name" */
export const slugify = (s) =>
  String(s || "document")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "document";

/** Standard file name: Site-Recce_<project-slug>_v<n>.pdf */
export const pdfFileName = (docType, projectName, version = 1) =>
  `${String(docType).trim().replace(/\s+/g, "-")}_${slugify(projectName)}_v${version || 1}.pdf`;

/** "SITE PREPARATION" / "site_preparation" → "Site Preparation" */
export const titleCase = (v) =>
  v == null
    ? ""
    : String(v)
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
        .replace(/(^|[\s(/-])([a-z])/g, (m, p, c) => p + c.toUpperCase());
