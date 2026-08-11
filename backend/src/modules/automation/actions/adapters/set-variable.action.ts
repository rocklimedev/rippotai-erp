import { Injectable } from '@nestjs/common';
import { AutomationAction, AutomationActionResult } from '../action.types';
import { AutomationExecutionContext } from '../../core/automation-context';
import { ValidationError } from '../../errors/automation.errors';
import { resolvePath } from '../../conditions/path-resolver';

interface SetVariableInput {
  name: string;
  /** Literal value to set, mutually exclusive with `fromPath`. */
  value?: unknown;
  /** Dotted path (e.g. "payload.amount") to copy a value from instead of a literal. */
  fromPath?: string;
}

/**
 * Writes into the run's `variables` scratch space so later steps can
 * reference earlier results (spec §22/§24 CALL_REGISTERED_ACTION chaining).
 */
@Injectable()
export class SetVariableAction implements AutomationAction {
  readonly type = 'SET_VARIABLE';

  async validate(input: unknown): Promise<void> {
    const typed = input as Partial<SetVariableInput>;
    if (!typed || typeof typed.name !== 'string' || typed.name.length === 0) {
      throw new ValidationError('SET_VARIABLE action requires a string "name"');
    }
    if (typed.value === undefined && typed.fromPath === undefined) {
      throw new ValidationError(
        'SET_VARIABLE action requires either "value" or "fromPath"',
      );
    }
  }

  async execute(
    context: AutomationExecutionContext,
    input: unknown,
  ): Promise<AutomationActionResult> {
    const typed = input as SetVariableInput;

    const resolvedValue =
      typed.fromPath !== undefined
        ? resolvePath(
            {
              payload: context.event?.payload ?? {},
              variables: context.variables,
            },
            typed.fromPath,
          )
        : typed.value;

    context.variables[typed.name] = resolvedValue;

    return {
      success: true,
      status: 'SET',
      data: { [typed.name]: resolvedValue },
    };
  }
}
