import { Inject, Injectable, Optional } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AutomationAction, AutomationActionResult } from '../action.types';
import { AutomationExecutionContext } from '../../core/automation-context';
import { ValidationError } from '../../errors/automation.errors';
import { AutomationEvent } from '../../events/event.types';
import type { DomainEventPublisher } from '../../interfaces/extension-points';
import { DOMAIN_EVENT_PUBLISHER } from '../../interfaces/tokens';

interface EmitEventInput {
  eventType: string;
  version?: number;
  payload?: Record<string, unknown>;
}

/**
 * Publishes a new AutomationEvent, tagged with this run's id as causationId
 * so downstream automations (and the cycle guard) can trace the chain
 * (spec §18, §60, §61).
 */
@Injectable()
export class EmitEventAction implements AutomationAction {
  readonly type = 'EMIT_EVENT';

  constructor(
    @Optional()
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly publisher?: DomainEventPublisher,
  ) {}

  async validate(input: unknown): Promise<void> {
    const typed = input as Partial<EmitEventInput>;
    if (!typed || typeof typed.eventType !== 'string') {
      throw new ValidationError(
        'EMIT_EVENT action requires a string "eventType"',
      );
    }
  }

  async execute(
    context: AutomationExecutionContext,
    input: unknown,
  ): Promise<AutomationActionResult> {
    const typed = input as EmitEventInput;

    const event: AutomationEvent = {
      id: uuidv4(),
      type: typed.eventType,
      version: typed.version ?? 1,
      source: 'automation-engine',
      timestamp: new Date().toISOString(),
      tenantId: context.metadata.tenantId,
      correlationId: context.metadata.correlationId ?? context.metadata.runId,
      causationId: context.metadata.runId,
      payload: typed.payload ?? {},
    };

    if (this.publisher) {
      await this.publisher.publish(event);
    }

    return {
      success: true,
      status: 'EVENT_EMITTED',
      data: { eventId: event.id },
    };
  }
}
