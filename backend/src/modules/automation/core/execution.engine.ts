import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { AutomationEntity } from '../persistence/entities/automation.entity';
import { AutomationVersionEntity } from '../persistence/entities/automation-version.entity';
import {
  AutomationRunEntity,
  AutomationRunStatus,
  VALID_RUN_TRANSITIONS,
} from '../persistence/entities/automation-run.entity';
import {
  AutomationRunStepEntity,
  AutomationStepStatus,
} from '../persistence/entities/automation-run-step.entity';

import { AutomationEvent } from '../events/event.types';
import {
  createContext,
  AutomationExecutionContext,
} from './automation-context';
import { RuleEngine } from '../rules/rule.engine';
import { ActionEngine } from '../actions/action-engine';
import { CycleGuardService } from '../concurrency/cycle-guard.service';
import {
  AutomationAuditService,
  AutomationAuditEventType,
} from '../audit/automation-audit.service';
import { AutomationQueueService } from '../jobs/automation.queue';
import {
  AutomationError,
  AutomationErrorCode,
  InvalidStateTransitionError,
  ValidationError,
} from '../errors/automation.errors';
import { DEFAULT_RETRY_POLICY } from '../jobs/job.types';

const RESUME_VARIABLE_KEY = '__resumeStepIndex';

export interface StartRunOptions {
  triggerType: string;
  triggerEventId?: string;
  causationRunId?: string;
}

@Injectable()
export class ExecutionEngine {
  private readonly logger = new Logger(ExecutionEngine.name);

  constructor(
    @InjectRepository(AutomationRunEntity)
    private readonly runs: Repository<AutomationRunEntity>,
    @InjectRepository(AutomationRunStepEntity)
    private readonly steps: Repository<AutomationRunStepEntity>,
    private readonly ruleEngine: RuleEngine,
    private readonly actionEngine: ActionEngine,
    private readonly cycleGuard: CycleGuardService,
    private readonly audit: AutomationAuditService,
    private readonly queue: AutomationQueueService,
  ) {}

  /**
   * Creates a persisted run and kicks off execution asynchronously via the
   * job queue. Never executes steps synchronously on the calling request
   * thread (spec §78 — avoid synchronous long-running operations).
   */
  async startRun(
    automation: AutomationEntity,
    version: AutomationVersionEntity,
    event: AutomationEvent | undefined,
    options: StartRunOptions,
  ): Promise<AutomationRunEntity> {
    const depth = await this.cycleGuard.assertWithinLimits(
      options.causationRunId,
      event?.correlationId,
    );
    if (options.causationRunId) {
      await this.cycleGuard.detectDirectCycle(
        automation.id,
        options.causationRunId,
      );
    }

    const run = this.runs.create({
      automationId: automation.id,
      automationVersion: version.version,
      tenantId: automation.tenantId ?? event?.tenantId ?? null,
      triggerType: options.triggerType,
      triggerEventId: options.triggerEventId ?? event?.id ?? null,
      status: AutomationRunStatus.PENDING,
      correlationId: event?.correlationId ?? uuidv4(),
      causationId: event?.causationId ?? options.causationRunId ?? null,
      chainDepth: depth,
      variablesSnapshot: {},
    });
    const saved = await this.runs.save(run);

    await this.queue.enqueueRunExecution(
      {
        runId: saved.id,
        automationId: automation.id,
        automationVersion: version.version,
        correlationId: saved.correlationId ?? undefined,
      },
      version.retryPolicy ?? DEFAULT_RETRY_POLICY,
    );

    return saved;
  }

  /**
   * Worker entrypoint. Loads persisted state, evaluates conditions on first
   * attempt, then executes action steps sequentially from wherever the run
   * left off (0 for a fresh run, or a resume index after a DELAY/WAIT).
   */
  async processRun(
    runId: string,
    version: AutomationVersionEntity,
    event?: AutomationEvent,
  ): Promise<void> {
    const run = await this.mustFindRun(runId);

    if (run.status === AutomationRunStatus.PENDING) {
      await this.transition(run, AutomationRunStatus.RUNNING);
      run.startedAt = new Date();
      await this.runs.save(run);

      const context = createContext(
        {
          automationId: run.automationId,
          automationVersion: run.automationVersion,
          runId: run.id,
          tenantId: run.tenantId ?? undefined,
          correlationId: run.correlationId ?? undefined,
          causationId: run.causationId ?? undefined,
        },
        event,
      );

      const rule = this.ruleEngine.evaluate(
        version,
        event ?? this.syntheticEvent(run),
        context.variables,
      );
      if (!rule.shouldRun) {
        await this.completeRun(run, {
          skipped: true,
          conditionResult: rule.conditionOutcome as unknown as Record<
            string,
            unknown
          >,
        });
        return;
      }

      await this.audit.record(AutomationAuditEventType.AUTOMATION_STARTED, {
        runId: run.id,
        automationId: run.automationId,
        automationVersion: run.automationVersion,
      });

      await this.runSteps(run, version, context, 0);
      return;
    }

    if (
      run.status === AutomationRunStatus.WAITING ||
      run.status === AutomationRunStatus.FAILED
    ) {
      await this.transition(run, AutomationRunStatus.RUNNING);
      const resumeIndex = Number(
        run.variablesSnapshot?.[RESUME_VARIABLE_KEY] ?? 0,
      );
      const context = createContext(
        {
          automationId: run.automationId,
          automationVersion: run.automationVersion,
          runId: run.id,
          tenantId: run.tenantId ?? undefined,
          correlationId: run.correlationId ?? undefined,
          causationId: run.causationId ?? undefined,
        },
        event,
        run.variablesSnapshot ?? {},
      );
      await this.runSteps(run, version, context, resumeIndex);
      return;
    }

    this.logger.warn(
      `processRun called for run ${runId} in terminal status ${run.status}; ignoring`,
    );
  }

  private async runSteps(
    run: AutomationRunEntity,
    version: AutomationVersionEntity,
    context: AutomationExecutionContext,
    startIndex: number,
  ): Promise<void> {
    const actionSteps = version.actions;

    for (let i = startIndex; i < actionSteps.length; i++) {
      const stepConfig = actionSteps[i];
      const stepEntity = await this.getOrCreateStepEntity(
        run.id,
        stepConfig.id,
      );
      stepEntity.attempt += 1;
      stepEntity.status = AutomationStepStatus.RUNNING;
      stepEntity.startedAt = new Date();
      stepEntity.inputSnapshot = this.redact(stepConfig.config);
      await this.steps.save(stepEntity);

      try {
        const result = await this.actionEngine.executeStep(context, stepConfig);

        stepEntity.status = AutomationStepStatus.COMPLETED;
        stepEntity.completedAt = new Date();
        stepEntity.outputSnapshot = this.redact(
          result as unknown as Record<string, unknown>,
        );
        await this.steps.save(stepEntity);

        await this.audit.record(AutomationAuditEventType.ACTION_EXECUTED, {
          runId: run.id,
          automationId: run.automationId,
          automationVersion: run.automationVersion,
          data: { stepId: stepConfig.id, actionType: stepConfig.type },
        });

        if (stepConfig.type === 'DELAY') {
          const seconds = Number(
            (stepConfig.config as Record<string, unknown>).seconds ?? 0,
          );
          await this.pauseForDelay(run, context, i + 1, seconds);
          return;
        }
      } catch (err) {
        await this.handleStepFailure(run, stepEntity, i, context, err);
        return;
      }
    }

    await this.completeRun(run, { variables: context.variables });
  }

  private async pauseForDelay(
    run: AutomationRunEntity,
    context: AutomationExecutionContext,
    resumeIndex: number,
    delaySeconds: number,
  ): Promise<void> {
    run.variablesSnapshot = {
      ...context.variables,
      [RESUME_VARIABLE_KEY]: resumeIndex,
    };
    await this.transition(run, AutomationRunStatus.WAITING);
    await this.runs.save(run);

    await this.queue.enqueueDelayedResume(
      {
        runId: run.id,
        automationId: run.automationId,
        automationVersion: run.automationVersion,
      },
      Math.max(0, delaySeconds) * 1000,
    );
  }

  private async handleStepFailure(
    run: AutomationRunEntity,
    stepEntity: AutomationRunStepEntity,
    stepIndex: number,
    context: AutomationExecutionContext,
    err: unknown,
  ): Promise<void> {
    const automationError = this.toAutomationError(err);

    stepEntity.status = AutomationStepStatus.FAILED;
    stepEntity.completedAt = new Date();
    stepEntity.error = automationError.toJSON();
    await this.steps.save(stepEntity);

    await this.audit.record(AutomationAuditEventType.ACTION_FAILED, {
      runId: run.id,
      automationId: run.automationId,
      automationVersion: run.automationVersion,
      data: { stepId: stepEntity.stepId, error: automationError.toJSON() },
    });

    run.variablesSnapshot = {
      ...context.variables,
      [RESUME_VARIABLE_KEY]: stepIndex,
    };
    run.error = automationError.toJSON();
    await this.transition(run, AutomationRunStatus.FAILED);
    await this.runs.save(run);

    await this.audit.record(AutomationAuditEventType.AUTOMATION_FAILED, {
      runId: run.id,
      automationId: run.automationId,
      automationVersion: run.automationVersion,
      data: { error: automationError.toJSON() },
    });

    if (automationError.isRetryable) {
      // Rethrow so the BullMQ job attempt is marked failed and the queue's
      // own backoff/retry policy schedules the next attempt.
      throw automationError;
    }
    // Permanent failures stop here; run stays FAILED until manually retried via API.
  }

  private async completeRun(
    run: AutomationRunEntity,
    extra: Record<string, unknown>,
  ): Promise<void> {
    run.completedAt = new Date();
    await this.transition(run, AutomationRunStatus.COMPLETED);
    await this.runs.save(run);

    await this.audit.record(AutomationAuditEventType.AUTOMATION_COMPLETED, {
      runId: run.id,
      automationId: run.automationId,
      automationVersion: run.automationVersion,
      data: extra,
    });
  }

  async cancelRun(runId: string): Promise<void> {
    const run = await this.mustFindRun(runId);
    await this.transition(run, AutomationRunStatus.CANCELLED);
    await this.runs.save(run);
    await this.audit.record(AutomationAuditEventType.AUTOMATION_CANCELLED, {
      runId: run.id,
      automationId: run.automationId,
      automationVersion: run.automationVersion,
    });
  }

  async retryRun(
    runId: string,
    version: AutomationVersionEntity,
  ): Promise<void> {
    const run = await this.mustFindRun(runId);
    if (run.status !== AutomationRunStatus.FAILED) {
      throw new ValidationError(
        `Only FAILED runs can be retried (current status: ${run.status})`,
      );
    }

    await this.audit.record(AutomationAuditEventType.AUTOMATION_RETRIED, {
      runId: run.id,
      automationId: run.automationId,
      automationVersion: run.automationVersion,
    });

    await this.queue.enqueueRunExecution(
      {
        runId: run.id,
        automationId: run.automationId,
        automationVersion: run.automationVersion,
      },
      version.retryPolicy ?? DEFAULT_RETRY_POLICY,
    );
  }

  private async transition(
    run: AutomationRunEntity,
    next: AutomationRunStatus,
  ): Promise<void> {
    const allowed = VALID_RUN_TRANSITIONS[run.status] ?? [];
    if (!allowed.includes(next)) {
      throw new InvalidStateTransitionError(
        `Cannot transition run ${run.id} from ${run.status} to ${next}`,
        {
          from: run.status,
          to: next,
        },
      );
    }
    run.status = next;
  }

  private async getOrCreateStepEntity(
    runId: string,
    stepId: string,
  ): Promise<AutomationRunStepEntity> {
    const existing = await this.steps.findOne({
      where: { automationRunId: runId, stepId },
    });
    if (existing) return existing;

    return this.steps.create({
      automationRunId: runId,
      stepId,
      actionType: '',
      attempt: 0,
    });
  }

  private async mustFindRun(runId: string): Promise<AutomationRunEntity> {
    const run = await this.runs.findOne({ where: { id: runId } });
    if (!run) {
      throw new ValidationError(`Automation run ${runId} not found`);
    }
    return run;
  }

  private toAutomationError(err: unknown): AutomationError {
    if (err instanceof AutomationError) return err;
    const message = err instanceof Error ? err.message : String(err);
    return new AutomationError(AutomationErrorCode.PERMANENT, message);
  }

  /** Redacts obviously sensitive keys before persisting step snapshots (spec §39). */
  private redact(data: Record<string, unknown>): Record<string, unknown> {
    const SENSITIVE_KEYS = new Set([
      'password',
      'secret',
      'token',
      'apiKey',
      'authorization',
      'credential',
    ]);
    const clone: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data ?? {})) {
      clone[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : value;
    }
    return clone;
  }

  private syntheticEvent(run: AutomationRunEntity): AutomationEvent {
    // For MANUAL/SCHEDULE-triggered runs there is no real inbound event; the
    // rule engine still needs a data root, so we synthesize an empty one.
    return {
      id: run.triggerEventId ?? uuidv4(),
      type: 'manual.trigger',
      version: 1,
      source: 'automation-engine',
      timestamp: new Date().toISOString(),
      tenantId: run.tenantId ?? undefined,
      correlationId: run.correlationId ?? undefined,
      payload: {},
    };
  }
}
