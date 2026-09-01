export enum GateTransitionAction {
  UNLOCKED = 'gate_unlocked',
  CHECKED = 'gate_checked',
  CLEARED = 'gate_cleared',
  OVERRIDDEN = 'gate_overridden',
  REOPENED = 'gate_reopened',
  MANUAL_CONDITION_TICKED = 'gate_manual_condition_ticked',
}
/**
 * Lifecycle of a single gate instance on a single project.
 *
 * LOCKED    — a prior gate in the sequence hasn't cleared yet; this gate cannot
 *             even be attempted.
 * PENDING   — unlocked (its predecessor is cleared) but its own conditions
 *             have not all been satisfied yet.
 * READY     — every condition attached to the gate currently evaluates true.
 *             Nothing moves until a human (or an automated trigger with the
 *             right permission) actually clears it — READY is not CLEARED.
 * CLEARED   — the gate has been signed off. Whatever it unlocks downstream is
 *             now unlocked.
 * REOPENED  — a previously cleared gate was walked back (e.g. a revision was
 *             requested after the fact). Downstream gates that depended on it
 *             are cascaded back to LOCKED/PENDING.
 */
export enum GateStatus {
  LOCKED = 'LOCKED',
  PENDING = 'PENDING',
  READY = 'READY',
  CLEARED = 'CLEARED',
  REOPENED = 'REOPENED',
}

/**
 * Every gate is unlocked by one or more conditions, all of which must pass
 * (AND semantics) unless the condition row itself is flagged optional, in
 * which case at least one optional condition in the group must pass (OR
 * semantics within the "optional" bucket). See GateEngineService.
 */
export enum GateConditionType {
  /** A single document of a given document_types.code must be status='approved'. */
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',

  /** Every document_requirements row for a phase_code must be is_completed=1. */
  DOCUMENT_TYPE_ALL_APPROVED = 'DOCUMENT_TYPE_ALL_APPROVED',

  /** A payment_schedule_milestones row matching a milestone_code must be PAID. */
  PAYMENT_MILESTONE_PAID = 'PAYMENT_MILESTONE_PAID',

  /** The project's quotation(s) of a given status must exist / be approved. */
  QUOTATION_APPROVED = 'QUOTATION_APPROVED',

  /** The project's BOQ must be in an approved state. */
  BOQ_APPROVED = 'BOQ_APPROVED',

  /** N tasks matching a filter must be status='completed'. */
  TASKS_COMPLETED = 'TASKS_COMPLETED',

  /** At least N team_members rows of owner_type=PROJECT with a given role_label
   *  must exist (used for "12 contractor teams confirmed"). */
  MIN_TEAM_MEMBERS_CONFIRMED = 'MIN_TEAM_MEMBERS_CONFIRMED',

  /** The immediately preceding gate (by sequence_order) must already be CLEARED.
   *  The engine adds this automatically for every gate — it never has to be
   *  seeded by hand — but it is still expressible as a condition so the audit
   *  trail always shows *why* a gate was blocked. */
  PREVIOUS_GATE_CLEARED = 'PREVIOUS_GATE_CLEARED',

  /** No automatic signal exists in the schema for this yet — a human with the
   *  right permission has to tick it manually (e.g. "client verbally approved
   *  on-site"). Recorded the same as any other condition once ticked. */
  MANUAL_APPROVAL = 'MANUAL_APPROVAL',
}
