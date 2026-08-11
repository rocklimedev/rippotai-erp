import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AutomationEvent } from '../events/event.types';
import { EventValidator } from '../events/event.validator';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { TriggerRegistry } from '../triggers/trigger.registry';
import { ExecutionEngine } from './execution.engine';
import { AutomationRunEntity } from '../persistence/entities/automation-run.entity';
import { AutomationEntity } from '../persistence/entities/automation.entity';
import {
  AutomationVersionEntity,
  AutomationVersionStatus,
} from '../persistence/entities/automation-version.entity';
import { TriggerType } from '../triggers/trigger.types';
import { NotFoundError, ValidationError } from '../errors/automation.errors';

const EVENT_CONSUMER_NAME = 'trigger-engine';

export interface IngestResult {
  eventId: string;
  matchedAutomations: number;
  startedRuns: string[];
  duplicate: boolean;
}

/**
 * Public facade for the Automation Engine. This is the single entrypoint a
 * host application (or an internal HTTP controller) calls to push events in,
 * trigger automations manually, or manage run lifecycle.
 */
@Injectable()
export class AutomationEngine {
  private readonly logger = new Logger(AutomationEngine.name);

  constructor(
    @InjectRepository(AutomationEntity)
    private readonly automations: Repository<AutomationEntity>,
    @InjectRepository(AutomationVersionEntity)
    private readonly versions: Repository<AutomationVersionEntity>,
    @InjectRepository(AutomationRunEntity)
    private readonly runs: Repository<AutomationRunEntity>,
    private readonly validator: EventValidator,
    private readonly idempotency: IdempotencyService,
    private readonly triggerRegistry: TriggerRegistry,
    private readonly executionEngine: ExecutionEngine,
  ) {}

  /**
   * Ingests a raw external event: validates it, enforces event-level
   * idempotency, matches it against enabled automations, and starts a run
   * for each match. This is the ONLY way business events enter the engine.
   */
  async ingestEvent(rawEvent: unknown): Promise<IngestResult> {
    const validation = this.validator.validate(rawEvent);
    if (!validation.valid) {
      throw new ValidationError('Invalid automation event', {
        errors: validation.errors,
      });
    }

    const event = rawEvent as AutomationEvent;

    const claim = await this.idempotency.claim(event, EVENT_CONSUMER_NAME);
    if (claim === 'ALREADY_PROCESSED') {
      this.logger.debug(
        `Event ${event.id} already processed by ${EVENT_CONSUMER_NAME}; skipping`,
      );
      return {
        eventId: event.id,
        matchedAutomations: 0,
        startedRuns: [],
        duplicate: true,
      };
    }
    if (claim === 'IN_PROGRESS') {
      this.logger.debug(
        `Event ${event.id} currently being processed by another worker; skipping`,
      );
      return {
        eventId: event.id,
        matchedAutomations: 0,
        startedRuns: [],
        duplicate: true,
      };
    }

    try {
      const matches = await this.triggerRegistry.findMatchingAutomations(event);
      const startedRuns: string[] = [];

      for (const match of matches) {
        const run = await this.executionEngine.startRun(
          match.automation,
          match.version,
          event,
          {
            triggerType: TriggerType.EVENT,
            triggerEventId: event.id,
          },
        );
        startedRuns.push(run.id);
      }

      await this.idempotency.markProcessed(event, EVENT_CONSUMER_NAME);

      return {
        eventId: event.id,
        matchedAutomations: matches.length,
        startedRuns,
        duplicate: false,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.idempotency.markFailed(event, EVENT_CONSUMER_NAME, message);
      throw err;
    }
  }

  /** Manually triggers a specific automation (its currently active version), bypassing trigger matching. */
  async triggerManually(
    automationId: string,
    actorId?: string,
  ): Promise<AutomationRunEntity> {
    const automation = await this.automations.findOne({
      where: { id: automationId },
    });
    if (!automation)
      throw new NotFoundError(`Automation ${automationId} not found`);
    if (!automation.enabled)
      throw new ValidationError(`Automation ${automationId} is disabled`);

    const version = await this.versions.findOne({
      where: {
        automationId: automation.id,
        version: automation.currentVersion,
        status: AutomationVersionStatus.ACTIVE,
      },
    });
    if (!version)
      throw new NotFoundError(
        `Active version not found for automation ${automationId}`,
      );

    return this.executionEngine.startRun(automation, version, undefined, {
      triggerType: TriggerType.MANUAL,
    });
  }

  async cancelRun(runId: string): Promise<void> {
    return this.executionEngine.cancelRun(runId);
  }

  async retryRun(runId: string): Promise<void> {
    const run = await this.runs.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundError(`Run ${runId} not found`);

    const version = await this.versions.findOne({
      where: { automationId: run.automationId, version: run.automationVersion },
    });
    if (!version)
      throw new NotFoundError(
        `Version ${run.automationVersion} of automation ${run.automationId} not found`,
      );

    return this.executionEngine.retryRun(runId, version);
  }
}
