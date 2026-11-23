// Procurement Sheet — material-type sheets (tabs).
// Every procurement keeps an ordered list of sheets [{ name, type }]; each item
// row stores the sheet it belongs to (sheetName). Older procurements without
// sheets are grouped by the type of each row's material.

/** Default material types a new Procurement Sheet starts with. */
export const DEFAULT_SHEETS = [
  { type: "civil", name: "Civil" },
  { type: "flooring", name: "Flooring & Stone" },
  { type: "tiles", name: "Tiles" },
  { type: "carpentry", name: "Carpentry & Furniture" },
  { type: "ceiling", name: "False Ceiling" },
  { type: "paint", name: "Paint & Polish" },
  { type: "electrical", name: "Electrical & Lighting" },
  { type: "plumbing", name: "Plumbing & Sanitary" },
  { type: "hardware", name: "Hardware & Adhesives" },
  { type: "glass", name: "Glass & Aluminium" },
  { type: "hvac", name: "HVAC" },
  { type: "other", name: "Others" },
];

const RULES = [
  ["flooring", /stone|marble|granite|floor|wood\s*floor|vinyl|quartz/i],
  ["tiles", /tile/i],
  ["carpentry", /carpent|furniture|ply|laminate|veneer|wood|board|mdf|kitchen|wardrobe/i],
  ["ceiling", /ceiling|gypsum|pop\b/i],
  ["paint", /paint|polish|putty|primer|texture|wallpaper/i],
  ["electrical", /electric|wire|cable|switch|light|lamp|fixture/i],
  ["plumbing", /plumb|sanitary|cp\s*fit|fitting|pipe|tap|faucet|wc|basin/i],
  ["hardware", /hardware|hinge|handle|channel|adhesive|sealant|grout|epoxy/i],
  ["glass", /glass|alumin|mirror|upvc|window/i],
  ["hvac", /hvac|air\s*con|\bac\b|duct/i],
  ["civil", /civil|cement|sand|brick|block|steel|concrete|aggregate|waterproof|plaster/i],
];

/** Default sheet type for a Material Master row (by category, then name). */
export function materialType(material) {
  if (!material) return null;
  const text = `${material.category || ""} ${material.sub_category || material.subCategory || ""}`;
  const name = material.name || "";
  for (const [type, re] of RULES) if (re.test(text)) return type;
  for (const [type, re] of RULES) if (re.test(name)) return type;
  return "other";
}

const parse = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim()) {
    try {
      const x = JSON.parse(v);
      return Array.isArray(x) ? x : [];
    } catch {
      return [];
    }
  }
  return [];
};

const clean = (list) => {
  const seen = new Set();
  return list
    .map((s) => ({ name: String(s?.name || "").trim(), type: s?.type || null }))
    .filter((s) => s.name && !seen.has(s.name.toLowerCase()) && seen.add(s.name.toLowerCase()));
};

const nameForType = (sheets, type) => sheets.find((s) => s.type === type)?.name;

/** Sheet name an item belongs to (its saved sheet, else its material's type). */
export function itemSheet(item, sheets, materialsById = {}) {
  if (item.sheetName && sheets.some((s) => s.name === item.sheetName)) return item.sheetName;
  const material = item.materialMaster || materialsById[item.materialId];
  const type = materialType(material);
  return (
    (type && nameForType(sheets, type)) ||
    item.sheetName ||
    nameForType(sheets, "other") ||
    sheets[0]?.name ||
    "Others"
  );
}

/**
 * Sheets of a saved procurement: its stored list, plus any sheet an item
 * refers to that is missing from it. Old procurements get one sheet per
 * material type actually used.
 */
export function sheetsOf(procurement, materialsById = {}) {
  const stored = clean(parse(procurement?.sheets));
  const items = procurement?.items || [];
  if (stored.length) {
    const extra = items.map((i) => i.sheetName).filter((n) => n && !stored.some((s) => s.name === n));
    return clean([...stored, ...extra.map((name) => ({ name, type: null }))]);
  }
  const used = new Set(items.map((i) => itemSheet(i, DEFAULT_SHEETS, materialsById)));
  const out = DEFAULT_SHEETS.filter((s) => used.has(s.name));
  return out.length ? out : [DEFAULT_SHEETS[DEFAULT_SHEETS.length - 1]];
}

export const freshSheets = () => DEFAULT_SHEETS.map((s) => ({ ...s }));

/** Materials of the Material Master that belong to a sheet's type. */
export function defaultMaterialsFor(sheet, materials) {
  if (!sheet?.type) return [];
  return materials.filter((m) => materialType(m) === sheet.type);
}
