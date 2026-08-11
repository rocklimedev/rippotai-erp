import { Injectable } from '@nestjs/common';
import { AutomationAction, AutomationActionResult } from '../action.types';
import { ValidationError } from '../../errors/automation.errors';

interface DelayInput {
  seconds: number;
}

/**
 * DELAY does not block a worker thread. It returns a result flagging the
 * requested delay; the ExecutionEngine/WorkflowEngine is responsible for
 * translating that into a scheduled resume job (BullMQ delayed job), so the
 * queue — not application memory — owns the wait (spec §28: never store
 * workflow state only in memory).
 */
@Injectable()
export class DelayAction implements AutomationAction {
  readonly type = 'DELAY';

  async validate(input: unknown): Promise<void> {
    const typed = input as Partial<DelayInput>;
    if (!typed || typeof typed.seconds !== 'number' || typed.seconds <= 0) {
      throw new ValidationError(
        'DELAY action requires a positive numeric "seconds"',
      );
    }
  }

  async execute(): Promise<AutomationActionResult> {
    return { success: true, status: 'DELAY_REQUESTED' };
  }
}
