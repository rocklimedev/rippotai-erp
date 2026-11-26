/**
 * Pipeline deal <-> canonical project / client facts.
 *
 * A deal carries the first facts about a job (location, size, budget …). The
 * documents (client brief, site recce, scope of work …) read their autofill
 * from the canonical project row and the client row, so the deal copies its
 * facts there. Pure helpers only; the DB work lives in LeadsService.
 */

export const isBlank = (v: unknown) =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

const UNIT_PATTERNS: [RegExp, string][] = [
  [/(gaj|gaz|sq\.?\s*y(ar)?ds?|square\s*yards?|yards?)/i, 'GAJ'],
  [/(sq\.?\s*m(tr|eters?|etres?)?\b|sqm|m2|m²|square\s*met)/i, 'SQ_M'],
  [/(sq\.?\s*f(ee)?t|sqft|sft|ft2|ft²|square\s*f(ee|oo)t)/i, 'SQ_FT'],
];

/** "2500 sq ft" / "200 gaj" / "1,850 sqm" / "3000" -> { area, unit }. */
export function parseSize(
  size?: string | null,
): { area: number; unit: string } | null {
  if (isBlank(size)) return null;
  const text = String(size);
  const num = text.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!num) return null;
  const area = parseFloat(num[1].replace(/,/g, ''));
  if (!Number.isFinite(area) || area <= 0) return null;
  const unit = UNIT_PATTERNS.find(([re]) => re.test(text))?.[1] || 'SQ_FT';
  return { area, unit };
}

const UNIT_LABEL: Record<string, string> = {
  SQ_FT: 'sq ft',
  SQ_M: 'sq m',
  GAJ: 'gaj',
};

/** Project site area -> the deal's free-text size ("2,500 sq ft"). */
export function formatSize(area: unknown, unit?: string | null) {
  const n = Number(area);
  if (isBlank(area) || !Number.isFinite(n) || n <= 0) return null;
  const label = UNIT_LABEL[String(unit || 'SQ_FT')] || String(unit || '');
  return `${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${label}`.trim();
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

export interface DealFacts {
  location?: string | null;
  googleMapsUrl?: string | null;
  projectTypeId?: string | null;
  size?: string | null;
  budget?: number | null;
  expectedClose?: string | null;
  timeline?: string | null;
  description?: string | null;
}

/** Deal attribute -> the project columns it feeds. */
export const DEAL_TO_PROJECT: Record<string, string[]> = {
  location: ['site_location'],
  googleMapsUrl: ['google_maps_url'],
  type: ['project_type_id'],
  size: ['site_area', 'site_area_unit'],
  amount: ['client_budget'],
  budget: ['client_budget'],
  expectedClose: ['desired_start_date'],
  timeline: ['desired_start_date'],
  description: ['description'],
};

/** Deal attribute -> client column. */
export const DEAL_TO_CLIENT: Record<string, string> = {
  name: 'contact_person',
  phone: 'phone',
  email: 'email',
};

/**
 * Project columns to write. A column is written when it is empty on the
 * project, or when it is in `overwrite` (the user just edited that deal field).
 */
export function projectFactPatch(
  project: Record<string, any>,
  facts: DealFacts,
  overwrite: Set<string> = new Set(),
) {
  const values: Record<string, unknown> = {
    site_location: facts.location,
    google_maps_url: facts.googleMapsUrl,
    project_type_id: facts.projectTypeId,
    client_budget: facts.budget,
    description: facts.description,
  };
  const size = parseSize(facts.size);
  if (size) {
    values.site_area = size.area;
    values.site_area_unit = size.unit;
  }
  const start = [facts.timeline, facts.expectedClose].find(
    (v) => !isBlank(v) && ISO_DATE.test(String(v)),
  );
  if (start) values.desired_start_date = String(start).slice(0, 10);

  const patch: Record<string, unknown> = {};
  for (const [col, value] of Object.entries(values)) {
    if (isBlank(value)) continue;
    if (!isBlank(project[col]) && !overwrite.has(col)) continue;
    if (String(project[col] ?? '') === String(value)) continue;
    patch[col] = value;
  }
  // Area and unit travel together.
  if ('site_area' in patch && !('site_area_unit' in patch) && size)
    patch.site_area_unit = size.unit;
  return patch;
}

/** Client columns to write: empty ones, or ones the user just edited. */
export function clientFactPatch(
  client: Record<string, any>,
  deal: Record<string, any>,
  overwrite: Set<string> = new Set(),
) {
  const patch: Record<string, unknown> = {};
  for (const [attr, col] of Object.entries(DEAL_TO_CLIENT)) {
    const value = deal[attr];
    if (isBlank(value)) continue;
    if (!isBlank(client[col]) && !overwrite.has(col)) continue;
    if (String(client[col] ?? '') === String(value)) continue;
    patch[col] = String(value).trim();
  }
  return patch;
}
