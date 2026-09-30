/** Sheet: "Architect visit schedule" -> Visit Type */
export enum VisitType {
  MANDATORY = 'Mandatory',
  HOLD_POINT = 'Hold Point',
  AS_REQUIRED = 'As Required',
  MANDATORY_CRITICAL = 'Mandatory (Critical)',
}

/** Lifecycle of a scheduled visit on a project (not in the sheet, needed for digitising) */
export enum VisitStatus {
  NOT_SCHEDULED = 'Not Scheduled',
  SCHEDULED = 'Scheduled',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

/** Sheet: "Snag list" -> Status (values assumed, sheet has none) */
export enum SnagStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RECTIFIED = 'Rectified',
  CLOSED = 'Closed',
}

/** Sheet: "Quality check list" -> per-project result of each checklist item */
export enum QualityCheckStatus {
  PENDING = 'Pending',
  PASSED = 'Passed',
  FAILED = 'Failed',
  NOT_APPLICABLE = 'N/A',
}
