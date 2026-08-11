import { Injectable, Logger } from '@nestjs/common';
import { ActionRegistry } from './action.registry';
import {
  AutomationActionResult,
  AutomationActionStepConfig,
} from './action.types';
import { AutomationExecutionContext } from '../core/automation-context';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { AutomationTimeoutError } from '../errors/automation.errors';

export interface ActionExecutionOptions {
  timeoutMs?: number;
}

const DEFAULT_ACTION_TIMEOUT_MS = 30_000;

@Injectable()
export class ActionEngine {
  private readonly logger = new Logger(ActionEngine.name);

  constructor(
    private readonly registry: ActionRegistry,
    private readonly idempotency: IdempotencyService,
  ) {}

  async validateStep(step: AutomationActionStepConfig): Promise<void> {
    const action = this.registry.resolve(step.type);
    await action.validate(step.config);
  }

  async executeStep(
    context: AutomationExecutionContext,
    step: AutomationActionStepConfig,
    options: ActionExecutionOptions = {},
  ): Promise<AutomationActionResult> {
    const action = this.registry.resolve(step.type);
    const idempotencyKey = this.idempotency.buildActionIdempotencyKey(
      context.metadata.runId,
      step.id,
    );
    const timeoutMs = options.timeoutMs ?? DEFAULT_ACTION_TIMEOUT_MS;

    this.logger.debug(
      `Executing step ${step.id} (${step.type}) run=${context.metadata.runId}`,
    );

    return this.withTimeout(
      action.execute(context, step.config, idempotencyKey),
      timeoutMs,
      step.id,
    );
  }

  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    stepId: string,
  ): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<T>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new AutomationTimeoutError(
              `Step "${stepId}" timed out after ${timeoutMs}ms`,
              { stepId, timeoutMs },
            ),
          ),
        timeoutMs,
      );
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }
}
