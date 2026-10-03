import { WorkHead, CheckpointPhase } from '@/common/enums/quality-checklist.enums';

/**
 * Legacy edited checkpoint catalog. The quality checklist API now reads the
 * source-exact quality_checklist_templates table seeded by
 * migrations/20261003_quality_checklist_template.sql.
 *
 * Source: QUALITY CHECK LIST.xlsx — detailed sheets per work head.
 *
 * Fixes applied vs original workbook:
 * - Electrical "Before Execution" had plumbing text (copy-paste error) → replaced
 * - Electrical duplicate after-execution item removed
 * - Flooring "After Execution" had During items duplicated → replaced with real post-checks
 * - Trailing spaces / inconsistent casing normalized
 * - Phase keys match CheckpointPhase enum
 *
 * Used to instantiate project quality_checklists + quality_checklist_items
 * via QualityChecklistService.createFromWorkHead().
 */
export type WorkHeadCheckpoint = {
  serial_number: number;
  checkpoint_name: string;
  phase: CheckpointPhase;
};

export const WORK_HEAD_CHECKPOINTS: Record<WorkHead, WorkHeadCheckpoint[]> = {
  // Structural heads — no detailed sheet in source workbook yet
  [WorkHead.EXCAVATION]: [],
  [WorkHead.PCC_WORK]: [],
  [WorkHead.FORMWORK_SHUTTERING]: [],
  [WorkHead.CONCRETING]: [],
  [WorkHead.BRICKWORK]: [],

  [WorkHead.WATERPROOFING]: [
    { serial_number: 1, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Approved waterproofing system, product, and application method available.' },
    { serial_number: 2, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Surface is sound, clean, dry as required, and free from loose material.' },
    { serial_number: 3, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check corners, wall-floor junctions, pipe sleeves, and drain locations.' },
    { serial_number: 4, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm required waterproofing height and upturns as per approved details.' },
    { serial_number: 5, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check primer and coating application, coverage, and specified number of coats.' },
    { serial_number: 6, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Ensure corners and pipe penetrations receive specified reinforcement and sealing.' },
    { serial_number: 7, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check continuity around floor traps, sleeves, and thresholds.' },
    { serial_number: 8, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Protect the membrane from damage; ensure correct curing and drying.' },
    { serial_number: 9, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check completed membrane for visible damage, cracks, pinholes, and missed areas.' },
    { serial_number: 10, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Verify water-retention test is completed for the specified duration and no leakage is observed below or adjacent.' },
    { serial_number: 11, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check drain position, slope, and waterproofing termination.' },
    { serial_number: 12, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Confirm repairs and retesting are completed before covering.' },
  ],

  [WorkHead.PLASTER_WORK]: [
    { serial_number: 1, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check wall layout, openings, levels, and service chasing are complete.' },
    { serial_number: 2, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm concealed plumbing/electrical inspections and approvals are recorded.' },
    { serial_number: 3, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check substrate is clean and prepared; masonry joints and surface defects are addressed.' },
    { serial_number: 4, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm plaster mix, thickness, and corner/bead details as specified.' },
    { serial_number: 5, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check surface preparation and wetting/bonding as required by the system.' },
    { serial_number: 6, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check plaster thickness, line, level, plumb, and room corners.' },
    { serial_number: 7, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Ensure mesh/reinforcement is provided at dissimilar-material junctions where specified.' },
    { serial_number: 8, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check that electrical boxes and plumbing outlets remain at correct depth and position; cure as specified.' },
    { serial_number: 9, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check wall plumb, flatness, corners, and surface finish under suitable lighting.' },
    { serial_number: 10, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check for cracks, hollowness, debonding, undulations, and damaged edges.' },
    { serial_number: 11, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Verify openings and finished dimensions for doors, windows, wardrobes, and kitchen.' },
    { serial_number: 12, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Confirm defects are repaired and surface is ready for the next finish.' },
  ],

  [WorkHead.PLUMBING]: [
    { serial_number: 1, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Approved plumbing layout and fixture schedule available.' },
    { serial_number: 2, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check pipe material, diameter, fittings, valves and approved brands/specification as per work order.' },
    { serial_number: 3, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Mark fixture points, heights and connections against sanitary and furniture drawings.' },
    { serial_number: 4, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm sleeve, shaft routes and access for maintenance.' },
    { serial_number: 5, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check pipe routing, supports, joints, and protection sleeves.' },
    { serial_number: 6, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Verify hot/cold lines, drainage direction, and required slope.' },
    { serial_number: 7, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check concealed joints and pressure/leak tests before closing walls or floors.' },
    { serial_number: 8, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Ensure traps, cleanouts, valves, and access points remain reachable.' },
    { serial_number: 9, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check fixture positions and heights against approved drawings.' },
    { serial_number: 10, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check water supply, hot/cold connections, flow, leaks, and drainage function.' },
    { serial_number: 11, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check floor traps, basin/kitchen connections, flushing, and water sealing.' },
    { serial_number: 12, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Verify visible pipework, silicone/sealing, and access panels are neat and accessible.' },
  ],

  // FIXED: Before Execution was plumbing text in the source sheet
  [WorkHead.ELECTRICAL_LIGHTING]: [
    { serial_number: 1, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Approved electrical layout, fixture schedule, and load schedule available.' },
    { serial_number: 2, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check conduit material, cable sizes, MCB ratings, and approved brands as per specification.' },
    { serial_number: 3, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Mark switch/socket points and heights against furniture and reflected ceiling drawings.' },
    { serial_number: 4, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm DB location, earthing provision, and coordination with ceiling and furniture.' },
    { serial_number: 5, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check conduit routing, bends, junction boxes, and concealed box levels.' },
    { serial_number: 6, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Ensure wiring is correctly identified, connections are secure, and cables are not damaged.' },
    { serial_number: 7, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check earthing continuity and required electrical tests before energizing.' },
    { serial_number: 8, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Verify light points, driver locations, and wiring coordination with ceiling and furniture.' },
    { serial_number: 9, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'MCB labelling is complete and matches the circuit schedule.' },
    { serial_number: 10, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check switches, sockets, lights, dimmers, fans, and controls for alignment and working condition.' },
    { serial_number: 11, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check fixture alignment, light colour temperature, and dimming where applicable.' },
    { serial_number: 12, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check plates, fittings, and cut-outs are undamaged and neatly installed.' },
  ],

  [WorkHead.HVAC]: [
    { serial_number: 1, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Approved HVAC layout, equipment schedule, and load/design information available.' },
    { serial_number: 2, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm indoor/outdoor unit locations, service clearances, and maintenance access.' },
    { serial_number: 3, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check refrigerant pipe, insulation, drain pipe, and electrical requirements.' },
    { serial_number: 4, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Coordinate ducts, diffusers, ceiling heights, curtain pockets, and furniture.' },
    { serial_number: 5, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check refrigerant pipe routing, jointing, insulation continuity, and support.' },
    { serial_number: 6, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check condensate drain slope, connections, and water-flow test.' },
    { serial_number: 7, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Verify duct sizes, joints, supports, insulation, and sealing as specified.' },
    { serial_number: 8, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check sleeves, access panels, diffuser positions, and coordination before ceiling closure.' },
    { serial_number: 9, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check equipment installation, vibration isolation, and service access.' },
    { serial_number: 10, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Verify condensate drainage and inspect for leaks.' },
    { serial_number: 11, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Test cooling/heating operation as applicable, controls, and airflow/balancing records.' },
    { serial_number: 12, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check grille alignment, noise/vibration, and clean finished appearance.' },
  ],

  [WorkHead.FALSE_CEILING]: [
    { serial_number: 1, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Approved ceiling plan, sections, levels, cove details, and lighting layout available.' },
    { serial_number: 2, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm all above-ceiling MEP work is inspected and tested before closure.' },
    { serial_number: 3, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check required ceiling height, hanger/fixing substrate, and framing system.' },
    { serial_number: 4, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm access panels, curtain pockets, AC diffusers, and fixture support provisions.' },
    { serial_number: 5, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check frame spacing, level, suspension, perimeter support, and fixing as specified.' },
    { serial_number: 6, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Verify openings and supports for lights, fans, AC grilles, and heavy fixtures.' },
    { serial_number: 7, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check cove/profile alignment, curtain pocket dimensions, and access-panel locations.' },
    { serial_number: 8, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Ensure above-ceiling services remain accessible and are not damaged.' },
    { serial_number: 9, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check ceiling level, joints, corners, screw marks, cracks, and surface finish.' },
    { serial_number: 10, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Verify cove continuity, access panels, and clean cut-outs.' },
    { serial_number: 11, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check light/fan/diffuser positions against approved reflected ceiling plan.' },
    { serial_number: 12, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Confirm all defects are rectified before final paint and fixture installation.' },
  ],

  // FIXED: After Execution had During items duplicated in the source sheet
  [WorkHead.FLOORING_WORK]: [
    { serial_number: 1, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm waterproofing approval and required tests are complete in wet areas.' },
    { serial_number: 2, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check floor PCC/screed levels, substrate strength, and surface readiness.' },
    { serial_number: 3, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Verify finished floor levels, slopes, thresholds, and door clearances.' },
    { serial_number: 4, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Approve tile/stone material, shade, batch, pattern, and setting-out.' },
    { serial_number: 5, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm proposed skirting detail.' },
    { serial_number: 6, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check starting point, layout, joint width, pattern, and cut-piece placement.' },
    { serial_number: 7, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check adhesive/mortar suitability, coverage, and installation method.' },
    { serial_number: 8, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Verify level, lippage, slope to drain, and alignment at thresholds.' },
    { serial_number: 9, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Protect laid flooring and maintain joints/curing as required.' },
    { serial_number: 10, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check overall level, lippage, joint consistency, and alignment across the area.' },
    { serial_number: 11, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Verify slope to drain in wet areas and threshold transitions.' },
    { serial_number: 12, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Confirm grout shade, finish, and cleanliness; no voids or colour variation.' },
    { serial_number: 13, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Protect laid flooring with sheets until handover.' },
    { serial_number: 14, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Confirm skirting alignment, height, and junction with flooring.' },
  ],

  [WorkHead.PAINT_WORK]: [
    { serial_number: 1, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm plaster/putty substrate is dry and accepted; moisture requirements met.' },
    { serial_number: 2, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check cracks, undulations, dampness, and previous defects are repaired.' },
    { serial_number: 3, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Approve paint system, colour, sheen, sample, and finish schedule.' },
    { serial_number: 4, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Ensure flooring, hardware, glass, and completed work are protected.' },
    { serial_number: 5, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check surface sanding, putty, primer, and drying between coats.' },
    { serial_number: 6, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Verify approved colour and consistent application/coverage.' },
    { serial_number: 7, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check edges, corners, cut-ins, and junctions with ceiling, doors, and furniture.' },
    { serial_number: 8, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Protect adjacent finishes and rectify visible defects between coats.' },
    { serial_number: 9, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check colour consistency, shade, sheen, coverage, and visible roller/brush marks.' },
    { serial_number: 10, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Inspect under normal and suitable grazing light for patches, pinholes, cracks, and unevenness.' },
    { serial_number: 11, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check edges around switches, frames, skirting, and fixtures.' },
    { serial_number: 12, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Confirm touch-ups are complete and surfaces are clean and undamaged.' },
  ],

  [WorkHead.KITCHEN]: [
    { serial_number: 1, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Approved kitchen drawings, elevations, sections, and appliance schedule available.' },
    { serial_number: 2, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check final site dimensions, wall/floor levels, and service points.' },
    { serial_number: 3, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm appliance sizes, ventilation, electrical loads, water, waste, and gas provision if applicable.' },
    { serial_number: 4, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Verify countertop material, finish, edge profile, hardware, and sample approvals.' },
    { serial_number: 5, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check cabinet carcass material, thickness, finish, and installation alignment.' },
    { serial_number: 6, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Verify levels, plumb, fixing, shutter gaps, drawer operation, and hardware.' },
    { serial_number: 7, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check sink cut-out, countertop support, joints, and sealing.' },
    { serial_number: 8, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Confirm appliance clearances, service access, and coordination of plumbing/electrical points.' },
    { serial_number: 9, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check shutters, drawers, hinges, channels, handles, and soft-close operation.' },
    { serial_number: 10, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check countertop joints, edges, sink sealing, and water drainage.' },
    { serial_number: 11, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Ensure splashbacks are properly fitted and grouted neatly.' },
    { serial_number: 12, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Test appliances and service connections as applicable; check for leaks.' },
    { serial_number: 13, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Inspect finish, alignment, gaps, scratches, and completeness of accessories.' },
    { serial_number: 14, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check the cabinet interiors are clean, undamaged, and free of construction dust.' },
  ],

  [WorkHead.WARDROBE]: [
    { serial_number: 1, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Approved wardrobe layout, elevations, internal divisions, and hardware schedule available.' },
    { serial_number: 2, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check final wall-to-wall and floor-to-ceiling dimensions after relevant finishes.' },
    { serial_number: 3, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm electrical points, AC/curtain clearances, skirting, and door swing conflicts.' },
    { serial_number: 4, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Approve board, finish, edge band, mirror/glass, and hardware samples.' },
    { serial_number: 5, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check carcass material, fixing, plumb, level, and alignment.' },
    { serial_number: 6, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Verify shelf, drawer, hanging-rail, and loft dimensions against drawings.' },
    { serial_number: 7, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check shutter gaps, edge banding, hinges, channels, and hardware installation.' },
    { serial_number: 8, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Ensure wardrobe does not obstruct switches, sockets, access panels, or ventilation.' },
    { serial_number: 9, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check shutters open/close freely and do not rub against floor or adjacent elements.' },
    { serial_number: 10, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check drawer operation, alignment, gaps, handles, and soft-close where specified.' },
    { serial_number: 11, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Inspect finish for scratches, chips, glue marks, and damaged edges.' },
    { serial_number: 12, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Verify mirrors, accessories, internal fittings, and final cleaning.' },
    { serial_number: 13, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check sliding track smoothness where applicable.' },
  ],

  [WorkHead.DOORS]: [
    { serial_number: 1, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check approved door schedule, dimensions, swing direction, and elevations.' },
    { serial_number: 2, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Verify opening dimensions, wall thickness, and finished floor level.' },
    { serial_number: 3, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm door frame and shutter material, thickness, and specifications.' },
    { serial_number: 4, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check approved veneer sample, species, shade, grain pattern, and finish (PU/polish).' },
    { serial_number: 5, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm veneer application method, edge detailing, and approved finish sample.' },
    { serial_number: 6, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check hardware schedule: hinges, locks, handles, stoppers, and other accessories.' },
    { serial_number: 7, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check frame position, plumb, level, squareness, alignment, and anchoring.' },
    { serial_number: 8, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Ensure frame and shutter are protected from moisture and construction damage.' },
    { serial_number: 9, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check shutter dimensions, thickness, and surface preparation before veneer application.' },
    { serial_number: 10, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Verify veneer grain direction, matching, alignment, and consistency across panels.' },
    { serial_number: 11, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check veneer joints, edge banding, corners, and veneer wrapping at shutter edges.' },
    { serial_number: 12, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Ensure veneer is firmly bonded with no bubbles, lifting, open joints, or loose edges.' },
    { serial_number: 13, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check PU/polish application, sanding, and finish coats as per approved sample.' },
    { serial_number: 14, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Verify hinge positions, hardware installation, and door clearances.' },
    { serial_number: 15, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check door alignment, uniform gaps, and smooth opening/closing.' },
    { serial_number: 16, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Verify veneer shade, grain direction, and grain matching against the approved sample.' },
    { serial_number: 17, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Inspect veneer for bubbles, peeling, cracks, scratches, dents, and visible joint lines.' },
    { serial_number: 18, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check PU/polish finish for uniform sheen, colour, smoothness, and surface defects.' },
    { serial_number: 19, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Inspect veneer edges, corners, joints, and frame-to-shutter finish.' },
    { serial_number: 20, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check hinges, locks, handles, stoppers, and all hardware functionality.' },
    { serial_number: 21, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Verify door clearance from flooring, skirting, and adjacent elements.' },
    { serial_number: 22, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Confirm all doors are clean, undamaged, and protected until handover.' },
  ],

  [WorkHead.WINDOWS_GLAZING]: [
    { serial_number: 1, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check approved window schedule, sizes, elevations, and opening direction.' },
    { serial_number: 2, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Verify sill level, lintel level, opening dimensions, and wall thickness.' },
    { serial_number: 3, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm frame material, profile, glass type/thickness, and finish.' },
    { serial_number: 4, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Check safety-glass requirements and hardware specifications.' },
    { serial_number: 5, phase: CheckpointPhase.BEFORE_EXECUTION, checkpoint_name: 'Confirm waterproofing, sill slope, drainage, and perimeter sealing details.' },
    { serial_number: 6, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check frame position, plumb, level, squareness, and anchoring.' },
    { serial_number: 7, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Verify frame protection and correct fixing method.' },
    { serial_number: 8, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check glass installation, gaskets, setting blocks, and glazing beads.' },
    { serial_number: 9, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Ensure sealant is applied continuously at required junctions.' },
    { serial_number: 10, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Check opening/closing mechanism, rollers, hinges, and locks.' },
    { serial_number: 11, phase: CheckpointPhase.DURING_EXECUTION, checkpoint_name: 'Verify drainage holes and water discharge paths are not blocked.' },
    { serial_number: 12, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check frame alignment, finish, and uniform perimeter gaps.' },
    { serial_number: 13, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Inspect glass for cracks, chips, scratches, and visible defects.' },
    { serial_number: 14, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check smooth operation, locking, and handles.' },
    { serial_number: 15, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Verify sealant finish and visible frame-to-wall junctions.' },
    { serial_number: 16, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Check for water ingress where applicable and confirm drainage.' },
    { serial_number: 17, phase: CheckpointPhase.AFTER_EXECUTION, checkpoint_name: 'Ensure glass and frames are clean, undamaged, and properly protected until handover.' },
  ],
};
