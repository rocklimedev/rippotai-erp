/**
 * Source: ARCHITECT SITEVISIT SCHEDULE.xlsx → "Quality check list"
 * and QUALITY CHECK LIST.xlsx → "QC -Work heads"
 *
 * Original sheets had:
 * - missing S.No. 5
 * - duplicate numbers (12, 13, 14, 15 repeated)
 * - duplicate "Waterproofing"
 *
 * Cleaned to sequential sort_order 1–18.
 * Seeds `quality_check_heads`.
 */
export const QUALITY_CHECK_HEADS: {
  sort_order: number;
  name: string;
}[] = [
  { sort_order: 1, name: 'Excavation' },
  { sort_order: 2, name: 'PCC work' },
  { sort_order: 3, name: 'Formwork' },
  { sort_order: 4, name: 'Concreting' },
  { sort_order: 5, name: 'Brickwork' },
  { sort_order: 6, name: 'Waterproofing' },
  { sort_order: 7, name: 'Plaster work' },
  { sort_order: 8, name: 'Waterproofing (bathroom)' },
  { sort_order: 9, name: 'Plumbing' },
  { sort_order: 10, name: 'Electrical & Lighting' },
  { sort_order: 11, name: 'HVAC' },
  { sort_order: 12, name: 'False ceiling' },
  { sort_order: 13, name: 'Flooring work' },
  { sort_order: 14, name: 'Paint work' },
  { sort_order: 15, name: 'Kitchen inspection' },
  { sort_order: 16, name: 'Wardrobe inspection' },
  { sort_order: 17, name: 'Bathroom inspection' },
  { sort_order: 18, name: 'Doors, windows & glazing' },
];
