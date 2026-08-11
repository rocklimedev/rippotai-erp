import { Injectable, Logger } from '@nestjs/common';
import { AutomationAction } from './action.types';
import { NotFoundError, ValidationError } from '../errors/automation.errors';

/**
 * Central registry mapping action `type` strings to implementations.
 *
 * The core engine ships only generic actions (LOG, SET_VARIABLE, DELAY,
 * NO_OP, EMIT_EVENT, CALL_REGISTERED_ACTION). A host application registers
 * its own business actions (e.g. "CREATE_PO") against this same registry at
 * bootstrap time — the engine never changes to support a new action type
 * (spec §25/§26).
 */
@Injectable()
export class ActionRegistry {
  private readonly logger = new Logger(ActionRegistry.name);
  private readonly actions = new Map<string, AutomationAction>();

  register(action: AutomationAction): void {
    if (this.actions.has(action.type)) {
      throw new ValidationError(
        `Action type "${action.type}" is already registered`,
      );
    }
    this.actions.set(action.type, action);
    this.logger.log(`Registered action type: ${action.type}`);
  }

  /** Registers or replaces — useful for tests / hot-reload scenarios. */
  registerOrReplace(action: AutomationAction): void {
    this.actions.set(action.type, action);
  }

  resolve(type: string): AutomationAction {
    const action = this.actions.get(type);
    if (!action) {
      throw new NotFoundError(`No action registered for type "${type}"`);
    }
    return action;
  }

  has(type: string): boolean {
    return this.actions.has(type);
  }

  list(): string[] {
    return Array.from(this.actions.keys());
  }
}
