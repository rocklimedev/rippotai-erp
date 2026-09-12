/**
 * Command Center enums.
 *
 * Document status/requirement concepts now live on the existing
 * Document / DocumentType / DocumentRequirement models and Activity
 * logging goes through the existing ActivityLog + ActivityAction — so
 * this file only holds what's still genuinely new: the task checklist
 * system and the dashboard rollup states derived from everything else.
 */

export enum TaskType {
  EXEC = 'EXEC',
  QC = 'QC',
}

export enum TaskExecutionStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

/** Per-phase rollup state — mirrors computeState() from the frontend. */
export enum PhaseRollupState {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  STALLED = 'STALLED',
  AWAITING_GATE = 'AWAITING_GATE',
  QC_FAILED = 'QC_FAILED',
  COMPLETE = 'COMPLETE',
}

/** Overall project health — mirrors projectHealth() from the frontend. */
export enum ProjectHealth {
  DANGER = 'danger',
  GATE = 'gate',
  PROGRESS = 'progress',
  COMPLETE = 'complete',
}
