import { Injectable } from '@nestjs/common';
import { AutomationAction, AutomationActionResult } from '../action.types';
import { AutomationExecutionContext } from '@/modules/automation/core/automation-context';
import { ValidationError } from '../../errors/automation.errors';
import { ActionRegistry } from '../action.registry';

interface CallRegisteredActionInput {
  /** The registered action type to invoke, e.g. a host-app-registered "CREATE_PO". */
  actionType: string;
  input: unknown;
}

/**
 * Generic indirection action: lets an automation definition reference a
 * business action by name without the core engine ever importing it. This
 * is the primary mechanism by which host-app-registered actions are
 * invoked from a declarative automation definition (spec §25/§26).
 */
@Injectable()
export class CallRegisteredActionAction implements AutomationAction {
  readonly type = 'CALL_REGISTERED_ACTION';

  constructor(private readonly registry: ActionRegistry) {}

  async validate(input: unknown): Promise<void> {
    const typed = input as Partial<CallRegisteredActionInput>;
    if (!typed || typeof typed.actionType !== 'string') {
      throw new ValidationError(
        'CALL_REGISTERED_ACTION requires a string "actionType"',
      );
    }
    if (!this.registry.has(typed.actionType)) {
      throw new ValidationError(
        `No action registered for actionType "${typed.actionType}"`,
      );
    }
    const target = this.registry.resolve(typed.actionType);
    await target.validate(typed.input);
  }

  async execute(
    context: AutomationExecutionContext,
    input: unknown,
    idempotencyKey: string,
  ): Promise<AutomationActionResult> {
    const typed = input as CallRegisteredActionInput;
    const target = this.registry.resolve(typed.actionType);
    return target.execute(context, typed.input, idempotencyKey);
  }
}
