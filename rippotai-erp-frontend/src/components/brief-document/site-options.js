// Project type / site type and site condition option sets in the order and wording of the
// user's templates (CLIENT BRIEF, SITE RECCE, SCOPE OF WORK), plus mapping of stored values.
import {
  SITE_TYPES_BY_PROJECT,
  projectCategoryFromName,
} from '../../hooks/brief-site-options';

export const CATS = [
  ['RESIDENTIAL', 'Residential'],
  ['COMMERCIAL', 'Commercial'],
  ['INSTITUTIONAL', 'Institutional'],
];

// Template order and wording of the project-type grid.
export const SITE_TYPE_GRID = {
  RESIDENTIAL: [
    ['BUILDER_FLOOR', 'Builder Floor'],
    ['BUNGALOW', 'Bungalow'],
    ['FLAT', 'Flat'],
    ['VILLA', 'Villa'],
    ['FARMHOUSE', 'Farmhouse'],
    ['PENTHOUSE', 'Penthouse'],
  ],
  COMMERCIAL: [
    ['OFFICE', 'Office'],
    ['RETAIL_SHOWROOM', 'Retail Showroom'],
    ['HOSPITALITY', 'Hospitality', 'parent'],
    ['HOTEL', 'Hotel', 'sub'],
    ['RESTAURANT', 'Restaurant', 'sub'],
    ['BANQUETS', 'Banquets', 'sub'],
    ['BAR_AND_LOUNGE', 'Bar And Lounge', 'sub'],
    ['CAFE', 'Café', 'sub'],
    ['RESORT', 'Resort', 'sub'],
    ['QSR_AND_CLOUD_KITCHEN', 'QSR And Cloud Kitchen', 'sub'],
  ],
  INSTITUTIONAL: [
    ['CAMPUS_ADDITION', 'Campus Addition'],
    ['EDUCATION', 'Education'],
    ['RELIGIOUS', 'Religious'],
    ['RESIDENTIAL_INSTITUTIONAL', 'Residential Institutional'],
    ['SPORTS', 'Sports'],
  ],
};
export const HOSPITALITY = ['HOTEL', 'RESTAURANT', 'BANQUETS', 'BAR_AND_LOUNGE', 'CAFE', 'RESORT', 'QSR_AND_CLOUD_KITCHEN'];

export const CONDITION_GRID = {
  RESIDENTIAL: [
    ['BARE_PLOT', 'Bare Plot'],
    ['COLD_SHELL', 'Cold Shell'],
    ['WARM_SHELL', 'Warm Shell'],
    ['EXISTING_OCCUPIED', 'Existing Occupied'],
    ['EXISTING_VACANT', 'Existing Vacant'],
  ],
  COMMERCIAL: [
    ['BARE_PLOT', 'Bare Plot'],
    ['COLD_SHELL', 'Cold Shell'],
    ['WARM_SHELL', 'Warm Shell'],
    ['EXISTING_OPERATIONAL', 'Existing Operational'],
    ['EXISTING_VACANT', 'Existing Vacant'],
    ['REBRANDING', 'Rebranding'],
  ],
  INSTITUTIONAL: [
    ['BARE_PLOT', 'Bare Plot'],
    ['EXISTING_BUILDING_VACANT', 'Existing Building — Vacant'],
    ['EXISTING_BUILDING_OPERATIONAL', 'Existing Building — Operational'],
    ['FIT_OUT_REQUIRED', 'Fit Out Required'],
  ],
};

// Older briefs stored a simpler site type / condition; map them onto the template options.
export const LEGACY_SITE_TYPE = { FLOOR: 'BUILDER_FLOOR', KOTHI: 'BUNGALOW', FLAT: 'FLAT' };
export const LEGACY_SITE_TYPE_LABEL = { RAW: 'Raw / Shell' };
export const LEGACY_CONDITION = {
  RESIDENTIAL: { OCCUPIED: 'EXISTING_OCCUPIED', UNOCCUPIED: 'EXISTING_VACANT' },
  COMMERCIAL: { OCCUPIED: 'EXISTING_OPERATIONAL', UNOCCUPIED: 'EXISTING_VACANT' },
  INSTITUTIONAL: { OCCUPIED: 'EXISTING_BUILDING_OPERATIONAL', UNOCCUPIED: 'EXISTING_BUILDING_VACANT' },
};


const has = (v) => v !== null && v !== undefined && String(v).trim() !== '';

/**
 * Resolve stored values onto the template grids.
 * { category, projectTypeName, siteType, siteTypeOther, siteCondition, siteConditionCategory, siteConditionOther }
 * → { category, siteType, siteTypeOther, conditionCategory, condition, conditionOther }
 */
export function resolveSite({
  category,
  projectTypeName,
  siteType,
  siteTypeOther,
  siteCondition,
  siteConditionCategory,
  siteConditionOther,
}) {
  const st = LEGACY_SITE_TYPE[siteType] || siteType;
  let cat = has(category) ? category : projectCategoryFromName(projectTypeName || '');
  if (!cat) {
    const hit = Object.entries(SITE_TYPES_BY_PROJECT).find(([, opts]) =>
      opts.some((o) => o.value === st && o.value !== 'OTHER'),
    );
    cat = hit ? hit[0] : '';
  }
  const condCat = siteConditionCategory || cat || 'RESIDENTIAL';
  return {
    category: cat,
    siteType: st,
    siteTypeOther:
      siteType === 'OTHER' ? siteTypeOther || '' : LEGACY_SITE_TYPE_LABEL[siteType] || '',
    conditionCategory: condCat,
    condition: LEGACY_CONDITION[condCat]?.[siteCondition] || siteCondition,
    conditionOther: siteCondition === 'OTHER' ? siteConditionOther || '' : '',
  };
}

const catLabel = (cat) => CATS.find(([c]) => c === cat)?.[1] || '';

/** "Residential — Villa", "Commercial — Hospitality — Hotel", "Institutional — Other: …". */
export function projectTypeAnswer(site) {
  const cat = site.category;
  const typeCat = SITE_TYPE_GRID[cat]?.some(([v]) => v === site.siteType)
    ? cat
    : Object.keys(SITE_TYPE_GRID).find((c) => SITE_TYPE_GRID[c].some(([v]) => v === site.siteType));
  const typeLabel = typeCat ? SITE_TYPE_GRID[typeCat].find(([v]) => v === site.siteType)?.[1] : '';
  const parts = [catLabel(cat || typeCat)];
  if (typeLabel) {
    if (HOSPITALITY.includes(site.siteType)) parts.push('Hospitality');
    parts.push(typeLabel);
  }
  if (has(site.siteTypeOther)) parts.push(`Other: ${site.siteTypeOther}`);
  return parts.filter(has).join(' — ');
}

/** "Residential — Bare Plot", "Other: …". */
export function siteConditionAnswer(site) {
  const cat = site.conditionCategory;
  const label = CONDITION_GRID[cat]?.find(([v]) => v === site.condition)?.[1] || '';
  if (has(site.conditionOther)) return [catLabel(site.category), `Other: ${site.conditionOther}`].filter(has).join(' — ');
  return label ? [catLabel(cat), label].filter(has).join(' — ') : '';
}
