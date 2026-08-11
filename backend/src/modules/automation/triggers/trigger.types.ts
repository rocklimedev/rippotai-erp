export enum TriggerType {
  EVENT = 'EVENT',
  MANUAL = 'MANUAL',
  SCHEDULE = 'SCHEDULE',
  DEADLINE = 'DEADLINE',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
}

interface BaseTrigger {
  type: TriggerType;
}

export interface EventTrigger extends BaseTrigger {
  type: TriggerType.EVENT;
  eventType: string;
  /** Payload schema versions this trigger accepts. Defaults to [1] if omitted. */
  eventVersions?: number[];
}

export interface ManualTrigger extends BaseTrigger {
  type: TriggerType.MANUAL;
}

export interface ScheduleTrigger extends BaseTrigger {
  type: TriggerType.SCHEDULE;
  /** Standard 5/6-field cron expression, evaluated in `timezone`. */
  cron: string;
  timezone?: string;
}

export interface DeadlineTrigger extends BaseTrigger {
  type: TriggerType.DEADLINE;
  /** Path (within the triggering event/entity payload) to an ISO timestamp. */
  deadlinePath: string;
}

export interface DeadlineApproachingTrigger extends BaseTrigger {
  type: TriggerType.DEADLINE_APPROACHING;
  deadlinePath: string;
  /** How long before the deadline this should fire. */
  leadTimeSeconds: number;
}

export type AutomationTrigger =
  | EventTrigger
  | ManualTrigger
  | ScheduleTrigger
  | DeadlineTrigger
  | DeadlineApproachingTrigger;

export interface TriggerMatchResult {
  matched: boolean;
  reason?: string;
}
