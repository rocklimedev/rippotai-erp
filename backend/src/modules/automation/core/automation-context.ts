import { AutomationEvent } from '../events/event.types';

/** Identifies the exact automation + version + run that is currently executing. */
export interface AutomationRunMetadata {
  automationId: string;
  automationVersion: number;
  runId: string;
  tenantId?: string;
  correlationId?: string;
  causationId?: string;
}

/**
 * Everything a condition/action needs to evaluate against, for a single run.
 * `variables` is a mutable scratch space actions can write to via SET_VARIABLE
 * so later steps in the same run can reference earlier results.
 */
export interface AutomationExecutionContext {
  event?: AutomationEvent;
  variables: Record<string, unknown>;
  metadata: AutomationRunMetadata;
}

export function createContext(
  metadata: AutomationRunMetadata,
  event?: AutomationEvent,
  initialVariables: Record<string, unknown> = {},
): AutomationExecutionContext {
  return {
    event,
    variables: { ...initialVariables },
    metadata,
  };
}
