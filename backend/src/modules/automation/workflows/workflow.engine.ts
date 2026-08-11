import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  WorkflowDefinitionEntity,
  WorkflowInstanceEntity,
  WorkflowInstanceStatus,
  WorkflowStepDefinition,
  WorkflowWaitType,
  VALID_WORKFLOW_TRANSITIONS,
} from '../persistence/entities/workflow.entity';
import { ActionEngine } from '../actions/action-engine';
import { createContext } from '../core/automation-context';
import {
  AutomationAuditService,
  AutomationAuditEventType,
} from '../audit/automation-audit.service';
import { AutomationQueueService } from '../jobs/automation.queue';
import {
  NotFoundError,
  ValidationError,
  InvalidStateTransitionError,
} from '../errors/automation.errors';
import { v4 as uuidv4 } from 'uuid';

export interface StartWorkflowOptions {
  automationRunId?: string;
  correlationId?: string;
  initialVariables?: Record<string, unknown>;
}

/**
 * Executes WorkflowDefinitionEntity graphs: ACTION steps run through the
 * same ActionEngine used by simple automations; WAIT steps persist the
 * instance as WAITING and either enqueue a delayed resume (TIME waits) or
 * sit until an external caller invokes resumeFromEvent/resumeManually
 * (EVENT/APPROVAL/MANUAL_INPUT/EXTERNAL_ACTION waits) — spec §28-§32.
 */
@Injectable()
export class WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngine.name);

  constructor(
    @InjectRepository(WorkflowDefinitionEntity)
    private readonly definitions: Repository<WorkflowDefinitionEntity>,
    @InjectRepository(WorkflowInstanceEntity)
    private readonly instances: Repository<WorkflowInstanceEntity>,
    private readonly actionEngine: ActionEngine,
    private readonly audit: AutomationAuditService,
    private readonly queue: AutomationQueueService,
  ) {}

  async start(
    definitionKey: string,
    definitionVersion: number,
    options: StartWorkflowOptions = {},
  ): Promise<WorkflowInstanceEntity> {
    const definition = await this.definitions.findOne({
      where: { key: definitionKey, version: definitionVersion },
    });
    if (!definition) {
      throw new NotFoundError(
        `Workflow definition ${definitionKey}@${definitionVersion} not found`,
      );
    }

    const instance = await this.instances.save(
      this.instances.create({
        workflowDefinitionId: definition.id,
        workflowDefinitionVersion: definition.version,
        automationRunId: options.automationRunId ?? null,
        status: WorkflowInstanceStatus.PENDING,
        currentStepId: definition.startStepId,
        variables: options.initialVariables ?? {},
        correlationId: options.correlationId ?? uuidv4(),
      }),
    );

    await this.audit.record(AutomationAuditEventType.WORKFLOW_STARTED, {
      data: {
        workflowInstanceId: instance.id,
        definitionKey,
        definitionVersion,
      },
    });

    await this.transition(instance, WorkflowInstanceStatus.RUNNING);
    await this.instances.save(instance);
    await this.advance(instance, definition);
    return instance;
  }

  /** Resumes a WAITING instance whose wait condition is an EVENT of the given type. */
  async resumeFromEvent(
    instanceId: string,
    eventType: string,
    eventPayload: Record<string, unknown>,
  ): Promise<void> {
    const instance = await this.mustFindInstance(instanceId);
    if (instance.status !== WorkflowInstanceStatus.WAITING) return;
    if (instance.waitCondition?.type !== WorkflowWaitType.EVENT) return;
    if (instance.waitCondition.resumeEventType !== eventType) return;

    instance.variables = {
      ...(instance.variables ?? {}),
      __lastEventPayload: eventPayload,
    };
    await this.resume(instance);
  }

  /** Resumes a WAITING instance whose wait condition is MANUAL_INPUT / APPROVAL / EXTERNAL_ACTION. */
  async resumeManually(
    instanceId: string,
    resultData: Record<string, unknown> = {},
  ): Promise<void> {
    const instance = await this.mustFindInstance(instanceId);
    if (instance.status !== WorkflowInstanceStatus.WAITING) {
      throw new ValidationError(
        `Workflow instance ${instanceId} is not WAITING`,
      );
    }
    instance.variables = {
      ...(instance.variables ?? {}),
      __resumeData: resultData,
    };
    await this.resume(instance);
  }

  /** Called by the scheduled resume job for TIME waits. */
  async resumeFromTimer(instanceId: string): Promise<void> {
    const instance = await this.mustFindInstance(instanceId);
    if (instance.status !== WorkflowInstanceStatus.WAITING) return;
    await this.resume(instance);
  }

  private async resume(instance: WorkflowInstanceEntity): Promise<void> {
    const definition = await this.mustFindDefinition(
      instance.workflowDefinitionId,
      instance.workflowDefinitionVersion,
    );
    await this.transition(instance, WorkflowInstanceStatus.RUNNING);
    instance.waitingSince = null;
    instance.waitCondition = null;
    await this.instances.save(instance);
    await this.advance(
      instance,
      definition,
      instance.currentStepId ?? undefined,
      true,
    );
  }

  private async advance(
    instance: WorkflowInstanceEntity,
    definition: WorkflowDefinitionEntity,
    fromStepId?: string,
    skipCurrentStep = false,
  ): Promise<void> {
    let stepId: string | undefined =
      fromStepId ?? instance.currentStepId ?? definition.startStepId;
    const context = createContext(
      {
        automationId: definition.key,
        automationVersion: definition.version,
        runId: instance.id,
        correlationId: instance.correlationId ?? undefined,
      },
      undefined,
      instance.variables ?? {},
    );

    while (stepId) {
      const step = definition.steps.find((s) => s.id === stepId);
      if (!step) {
        throw new ValidationError(
          `Workflow step "${stepId}" not found in definition ${definition.key}@${definition.version}`,
        );
      }

      if (step.kind === 'ACTION' && !skipCurrentStep) {
        if (!step.action)
          throw new ValidationError(
            `Step "${stepId}" is missing "action" config`,
          );
        const result = await this.actionEngine.executeStep(
          context,
          step.action,
        );
        instance.variables = { ...context.variables };

        if (!result.success) {
          instance.error = { stepId, result };
          await this.transition(instance, WorkflowInstanceStatus.FAILED);
          await this.instances.save(instance);
          await this.audit.record(AutomationAuditEventType.WORKFLOW_FAILED, {
            data: { workflowInstanceId: instance.id, stepId },
          });
          return;
        }
      }

      skipCurrentStep = false;

      if (step.kind === 'WAIT' && step.wait) {
        await this.enterWait(instance, step);
        return;
      }

      stepId = step.next;
    }

    instance.currentStepId = null;
    instance.completedAt = new Date();
    instance.variables = { ...context.variables };
    await this.transition(instance, WorkflowInstanceStatus.COMPLETED);
    await this.instances.save(instance);

    await this.audit.record(AutomationAuditEventType.WORKFLOW_COMPLETED, {
      data: { workflowInstanceId: instance.id },
    });
  }

  private async enterWait(
    instance: WorkflowInstanceEntity,
    step: WorkflowStepDefinition,
  ): Promise<void> {
    instance.currentStepId = step.id;
    instance.waitCondition = step.wait ?? null;
    instance.waitingSince = new Date();

    if (step.wait?.type === WorkflowWaitType.TIME && step.wait.delaySeconds) {
      instance.resumeAfter = new Date(
        Date.now() + step.wait.delaySeconds * 1000,
      );
    }

    await this.transition(instance, WorkflowInstanceStatus.WAITING);
    await this.instances.save(instance);

    if (step.wait?.type === WorkflowWaitType.TIME && step.wait.delaySeconds) {
      await this.queue.enqueueDelayedResume(
        {
          runId: instance.automationRunId ?? instance.id,
          automationId: instance.workflowDefinitionId,
          automationVersion: instance.workflowDefinitionVersion,
          workflowInstanceId: instance.id,
        },
        step.wait.delaySeconds * 1000,
      );
    }
  }

  private async transition(
    instance: WorkflowInstanceEntity,
    next: WorkflowInstanceStatus,
  ): Promise<void> {
    const allowed = VALID_WORKFLOW_TRANSITIONS[instance.status] ?? [];
    if (!allowed.includes(next)) {
      throw new InvalidStateTransitionError(
        `Cannot transition workflow instance ${instance.id} from ${instance.status} to ${next}`,
      );
    }
    instance.status = next;
  }

  private async mustFindInstance(id: string): Promise<WorkflowInstanceEntity> {
    const instance = await this.instances.findOne({ where: { id } });
    if (!instance) throw new NotFoundError(`Workflow instance ${id} not found`);
    return instance;
  }

  private async mustFindDefinition(
    id: string,
    version: number,
  ): Promise<WorkflowDefinitionEntity> {
    const definition = await this.definitions.findOne({
      where: { id, version },
    });
    if (!definition)
      throw new NotFoundError(`Workflow definition ${id}@${version} not found`);
    return definition;
  }
}
