import { AutomationErrorCode } from '../errors/automation.errors';

/**
 * Minimal payload placed on a BullMQ job — enough to safely resume
 * execution by re-loading state from MySQL. Never put large business
 * payloads into Redis (spec §34).
 */
export interface AutomationJobData {
  runId: string;
  automationId: string;
  automationVersion: number;
  stepId?: string;
  correlationId?: string;
  /** Present when this job is resuming a workflow instance rather than a plain run. */
  workflowInstanceId?: string;
  /** Present for DEADLINE_CHECK jobs: index into the wait step's timeout.escalation array this check corresponds to. */
  deadlineIndex?: number;
  /** Present for DEADLINE_CHECK jobs: the step id the instance was waiting on when the check was scheduled, so a late job can no-op if the instance has since moved on. */
  deadlineStepId?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoff: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
};

export function isRetryableCode(code: AutomationErrorCode): boolean {
  return (
    code === AutomationErrorCode.TRANSIENT ||
    code === AutomationErrorCode.EXTERNAL_SERVICE ||
    code === AutomationErrorCode.TIMEOUT
  );
}

export const AUTOMATION_QUEUE_NAME = 'automation-engine';

export enum AutomationJobName {
  EXECUTE_RUN = 'EXECUTE_RUN',
  EXECUTE_STEP = 'EXECUTE_STEP',
  RESUME_WORKFLOW = 'RESUME_WORKFLOW',
  DEADLINE_CHECK = 'DEADLINE_CHECK',
}
