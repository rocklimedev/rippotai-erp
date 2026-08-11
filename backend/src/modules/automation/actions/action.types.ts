import { AutomationExecutionContext } from '../core/automation-context';
import { EntityReference } from '../interfaces/extension-points';

/** One step in an automation's action list, as stored in an AutomationVersion. */
export interface AutomationActionStepConfig {
  /** Stable id of this step within the automation version (used for idempotency keys). */
  id: string;
  /** Registered action type, e.g. "LOG", "CALL_REGISTERED_ACTION". */
  type: string;
  /** Action-specific configuration, validated by the action implementation. */
  config: Record<string, unknown>;
}

export interface AutomationActionResult {
  success: boolean;
  status?: string;
  data?: Record<string, unknown>;
  externalReference?: EntityReference;
}

/**
 * Contract every action implementation must satisfy. Core actions (LOG,
 * SET_VARIABLE, DELAY, NO_OP, EMIT_EVENT, CALL_REGISTERED_ACTION) are
 * generic. Business-specific actions (CREATE_PO, etc.) are registered by the
 * host application at runtime — the engine never hard-codes them.
 */
export interface AutomationAction {
  type: string;

  /** Throws a ValidationError if `input` is malformed for this action type. */
  validate(input: unknown): Promise<void>;

  /** Executes the action. Must be safe to retry using the given idempotency key. */
  execute(
    context: AutomationExecutionContext,
    input: unknown,
    idempotencyKey: string,
  ): Promise<AutomationActionResult>;
}
