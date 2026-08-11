import { Injectable, Logger } from '@nestjs/common';
import { AutomationAction, AutomationActionResult } from '../action.types';
import { AutomationExecutionContext } from '../../core/automation-context';
import { ValidationError } from '../../errors/automation.errors';

interface LogActionInput {
  message: string;
  level?: 'debug' | 'log' | 'warn' | 'error';
}

/** Writes a structured log line. Useful for the first vertical slice / debugging. */
@Injectable()
export class LogAction implements AutomationAction {
  readonly type = 'LOG';
  private readonly logger = new Logger('AutomationAction:LOG');

  async validate(input: unknown): Promise<void> {
    const typed = input as Partial<LogActionInput>;
    if (!typed || typeof typed.message !== 'string') {
      throw new ValidationError('LOG action requires a string "message"');
    }
  }

  async execute(
    context: AutomationExecutionContext,
    input: unknown,
  ): Promise<AutomationActionResult> {
    const typed = input as LogActionInput;
    const level = typed.level ?? 'log';
    const line = `[run=${context.metadata.runId}] ${typed.message}`;

    switch (level) {
      case 'debug':
        this.logger.debug(line);
        break;
      case 'warn':
        this.logger.warn(line);
        break;
      case 'error':
        this.logger.error(line);
        break;
      default:
        this.logger.log(line);
    }

    return { success: true, status: 'LOGGED' };
  }
}

/** Does nothing. Useful as a placeholder / no-op branch target. */
@Injectable()
export class NoOpAction implements AutomationAction {
  readonly type = 'NO_OP';

  async validate(): Promise<void> {
    // no input required
  }

  async execute(): Promise<AutomationActionResult> {
    return { success: true, status: 'NO_OP' };
  }
}
