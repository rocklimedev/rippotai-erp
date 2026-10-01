import { VisitType } from '@/common/enums/architect-visit.enums';

const M = VisitType.MANDATORY;
const H = VisitType.HOLD_POINT;
const A = VisitType.AS_REQUIRED;
const C = VisitType.MANDATORY_CRITICAL;

/**
 * Source: ARCHITECT SITEVISIT SCHEDULE.xlsx → "Architect visit schedule"
 * Typos fixed (handoverr → handover, Loction → Location, trailing spaces stripped).
 * Visit Type values normalized to VisitType enum.
 *
 * Seeds `architect_visit_stages`.
 */
export const ARCHITECT_VISIT_STAGES: {
  visit_no: number;
  stage: string;
  checks_purpose: string;
  visit_type: VisitType;
  remarks?: string | null;
}[] = [
  {
    visit_no: 1,
    stage: 'Pre construction / Site handover',
    checks_purpose:
      'Existing site conditions, dimensions, levels, structural elements, site constraints, existing MEP points',
    visit_type: M,
  },
  {
    visit_no: 2,
    stage: 'After foundation layout / start of structural work',
    checks_purpose: 'Check layout as per drawings, levels, grids, dimensions',
    visit_type: H,
  },
  {
    visit_no: 3,
    stage: 'Column & beam laying',
    checks_purpose: 'Check column and beam location',
    visit_type: M,
  },
  {
    visit_no: 4,
    stage: 'Before slab casting',
    checks_purpose:
      'Check shuttering, slab level, shafts, openings, conduits if any, sleeves provision, structure',
    visit_type: H,
  },
  {
    visit_no: 5,
    stage: 'Before / During walling',
    checks_purpose: 'Check layout, room dimensions, D & W openings',
    visit_type: M,
  },
  {
    visit_no: 6,
    stage: 'Before wall chasing',
    checks_purpose:
      'Switch/socket locations, heights, TV/data points, plumbing points, AC points, special electrical requirements',
    visit_type: H,
  },
  {
    visit_no: 7,
    stage: 'Plumbing / electrical first fix check before plaster',
    checks_purpose: 'Location & height check, routing check',
    visit_type: H,
  },
  {
    visit_no: 8,
    stage: 'After MEP first fix – before plaster',
    checks_purpose:
      'Electrical & plumbing routing, pipe sizes, slopes, sleeves, concealed boxes, AC piping/drain, coordination with furniture/ceiling',
    visit_type: H,
  },
  {
    visit_no: 9,
    stage: 'After bathroom waterproofing',
    checks_purpose:
      'Leakage test, water retention, drain slope, wall treatment',
    visit_type: H,
  },
  {
    visit_no: 10,
    stage: 'After floor PCC',
    checks_purpose:
      'Floor levels, slopes, bathroom slope, finished floor levels, thresholds',
    visit_type: M,
  },
  {
    visit_no: 11,
    stage: 'During flooring / tiling',
    checks_purpose:
      'Tile layout, starting point, pattern, joints, border/cut pieces, drain alignment, slope',
    visit_type: A,
  },
  {
    visit_no: 12,
    stage: 'During / After false ceiling framework & wiring',
    checks_purpose:
      'Ceiling level, cove details, AC diffusers (if any), curtain pockets, access panels/trap doors, lights location, fan point, plywork for chandeliers/AC/curtains, profile channels',
    visit_type: H,
  },
  {
    visit_no: 13,
    stage: 'After false ceiling POP',
    checks_purpose:
      'Ceiling level, corners, cut-outs, cove details, light locations mark',
    visit_type: M,
  },
  {
    visit_no: 14,
    stage: 'Before fixed furniture / carpentry',
    checks_purpose:
      'Final wall/floor dimensions, electrical & plumbing points, furniture clearances, appliance dimensions, fixing requirements',
    visit_type: H,
  },
  {
    visit_no: 15,
    stage: 'During fixed furniture / wall panelling',
    checks_purpose:
      'Material, alignment, dimensions, edge details, hardware, electrical integration, junctions',
    visit_type: A,
  },
  {
    visit_no: 16,
    stage: 'Before painting / final finishes',
    checks_purpose:
      'Surface preparation, putty, primer, colour/sample approval, repaired surfaces, protection of completed works',
    visit_type: H,
  },
  {
    visit_no: 17,
    stage: 'During final finishes',
    checks_purpose:
      'Paint finish, wallpaper, polish/PU, glass, mirrors, hardware, visible junctions',
    visit_type: A,
  },
  {
    visit_no: 18,
    stage: 'After fixtures and final installation',
    checks_purpose:
      'Sanitary fixtures, switches, lights, fans, AC grilles, hardware, accessories, furniture alignment',
    visit_type: M,
  },
  {
    visit_no: 19,
    stage: 'Pre handover inspections',
    checks_purpose:
      'Complete snag inspection: finishes, dimensions, functionality, MEP, furniture, doors/windows, cleaning',
    visit_type: C,
  },
  {
    visit_no: 20,
    stage: 'Snag list closure check',
    checks_purpose:
      'Verify all snag points are rectified; check rework quality',
    visit_type: M,
  },
  {
    visit_no: 21,
    stage: 'Final handover',
    checks_purpose:
      'Final finishes, cleanliness, protection removal, drawings/documents, warranties/manuals, handover checklist',
    visit_type: M,
  },
];
