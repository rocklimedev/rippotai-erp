/**
 * Scopes a ProjectPhase catalog to the sheet/domain it belongs to.
 *
 * This is the field that was MISSING from the original schema. In the
 * Excel, "Consultancy" phases (PRE-DESIGN, DESIGN, MATERIAL SELECTION,
 * TENDER DRAWINGS, WORKING DRAWINGS...) and "PMC" phases (SITE
 * PREPARATION, CIVIL WORK, FIT OUTS, FINISHING, SNAG & HANDOVER...) are
 * two completely independent, non-overlapping vocabularies with their
 * own P1/P2/P3 numbering. A single unscoped `project_phases` table (as
 * originally written) would force both modules to share one numbering
 * sequence, which does not match the source data.
 *
 * DOCUMENTS is included here (not in PlannerModule below) so that
 * DocumentType.phaseCode / phaseName — currently free-text strings — can
 * be normalised onto this same table via a phase_id FK instead of
 * duplicating phase names as strings in a second place.
 */
export enum ProjectPhaseModule {
  CONSULTANCY = 'CONSULTANCY',
  PMC = 'PMC',
  DOCUMENTS = 'DOCUMENTS',
}

/** Modules that use the WORK / DETAILS task tree (project_planner_tasks). */
export enum PlannerModule {
  CONSULTANCY = 'CONSULTANCY',
  PMC = 'PMC',
}

export enum PlannerTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

/**
 * Distinguishes the "LABOUR CONTRACTOR" column-group from the "MATERIAL
 * VENDOR" column-group on the Vendor & Procurement sheet. Same table,
 * different field sets are relevant (labour uses start/end dates,
 * material uses purchase/received dates) — both are still stored on
 * every row so a category can, in principle, use either or both.
 */
export enum ProcurementCategoryType {
  LABOUR = 'LABOUR',
  MATERIAL = 'MATERIAL',
}

export enum PlannerExportModule {
  CONSULTANCY = 'CONSULTANCY',
  PMC = 'PMC',
  VENDOR_PROCUREMENT = 'VENDOR_PROCUREMENT',
  OVERVIEW = 'OVERVIEW',
}
