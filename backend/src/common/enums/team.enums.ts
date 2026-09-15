/**
 * Defines what entity a TeamMember roster belongs to.
 *
 * OWNER-SCOPED TYPES
 * ------------------
 * PROJECT
 * PLAN_OF_ACTION
 * QUOTATION
 * BOQ
 *
 * ADMIN TEAM
 * ----------
 * TEAM
 *
 * Do not remove existing values because they are already
 * used by Projects, Gates and Process Workflow.
 */
export enum TeamMemberOwnerType {
  PROJECT = 'PROJECT',

  PLAN_OF_ACTION = 'PLAN_OF_ACTION',

  QUOTATION = 'QUOTATION',

  BOQ = 'BOQ',

  /**
   * Company/Admin Team.
   *
   * For this type:
   *
   * owner_type = TEAM
   * owner_id   = team.id
   * team_id    = team.id
   */
  TEAM = 'TEAM',
}

/**
 * Defines the level of access a Team has to a TeamSection.
 *
 * NONE
 * ----
 * No access.
 *
 * VIEW_ONLY
 * ---------
 * User can view the section but cannot modify it.
 *
 * LIMITED
 * -------
 * Granular access controlled by:
 *   can_view
 *   can_create
 *   can_edit
 *   can_delete
 *   can_approve
 *
 * FULL
 * ----
 * Full access to the section.
 */
export enum TeamAccessLevel {
  NONE = 'NONE',

  VIEW_ONLY = 'VIEW_ONLY',

  LIMITED = 'LIMITED',

  FULL = 'FULL',
}
