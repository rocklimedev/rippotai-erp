// Project type / site type and site condition answers shared by the Client Brief, Site Recce and
// Scope of Work documents. A filled document prints only the chosen option
// ("Residential — Villa", "Other: …"); the full ☐ grid of the template is kept for a blank
// template print (answer={false}) and lives in the input forms.
import { WAnswer, WCheck, WCheckColumns, has } from '../print-document';
import {
  CATS,
  SITE_TYPE_GRID,
  HOSPITALITY,
  CONDITION_GRID,
  projectTypeAnswer,
  siteConditionAnswer,
} from './site-options';

/** PROJECT TYPE & SITE TYPE; `site` from resolveSite(). */
export function ProjectTypeGrid({ site, widths = '58.9mm 58.9mm 1fr', itemGap, headGap, answer = true }) {
  if (answer) return <WAnswer value={projectTypeAnswer(site)} style={{ marginBottom: '8mm' }} />;
  const columns = CATS.map(([cat, heading]) => ({
    heading,
    items: SITE_TYPE_GRID[cat].map(([v, label, kind]) => ({
      label,
      checked:
        v === site.siteType ||
        (kind === 'parent' && HOSPITALITY.includes(site.siteType) && site.category !== 'RESIDENTIAL'),
      indent: kind === 'sub',
      gap: kind === 'parent' ? (headGap ?? 2.6) : undefined,
    })),
  }));
  columns[2].items.push({
    label: 'Other',
    other: true,
    value: site.siteTypeOther,
    checked: has(site.siteTypeOther),
    style: { marginTop: `${4 * 5.5}mm` },
  });
  return <WCheckColumns columns={columns} widths={widths} gap={itemGap} />;
}

/**
 * SITE CONDITION. headingBox: the Client Brief template prints "☐ Residential" headings; the Site
 * Recce / Scope of Work print plain headings (blank template only).
 */
export function SiteConditionGrid({ site, headingBox = true, widths = '57mm 57mm 1fr', itemGap = 4.7, answer = true }) {
  if (answer) return <WAnswer value={siteConditionAnswer(site)} style={{ marginBottom: '8mm' }} />;
  return (
    <div>
      <WCheckColumns
        gap={1.6}
        itemGap={itemGap}
        widths={widths}
        columns={CATS.map(([cat, heading]) => ({
          heading,
          headingBox,
          headingChecked: site.category === cat || (site.conditionCategory === cat && has(site.condition)),
          items: CONDITION_GRID[cat].map(([v, label]) => ({
            label,
            checked: cat === site.conditionCategory && v === site.condition,
          })),
        }))}
      />
      <WCheck
        label="Other"
        other
        value={site.conditionOther}
        checked={has(site.conditionOther)}
        style={{ marginTop: '5.3mm' }}
        gap={1.6}
      />
    </div>
  );
}
