import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';

import {
  AUTOMATION_QUEUE_NAME,
  AutomationJobData,
  AutomationJobName,
} from './job.types';
import { ExecutionEngine } from '../core/execution.engine';
import { AutomationVersionEntity } from '../persistence/entities/automation-version.entity';
import { NotFoundError } from '../errors/automation.errors';

/**
 * A worker crash must not destroy automation state (spec §35): all state
 * needed to resume lives in MySQL (AutomationRunEntity.variablesSnapshot +
 * AutomationRunStepEntity rows), not in this process's memory. Re-running
 * processRun for the same runId is safe/idempotent because it always
 * re-reads persisted state first.
 */
@Processor(AUTOMATION_QUEUE_NAME)
export class AutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(
    private readonly executionEngine: ExecutionEngine,
    @InjectRepository(AutomationVersionEntity)
    private readonly versions: Repository<AutomationVersionEntity>,
  ) {
    super();
  }

  async process(job: Job<AutomationJobData>): Promise<void> {
    this.logger.debug(
      `Processing job ${job.name} (${job.id}) attempt=${job.attemptsMade + 1}`,
    );

    switch (job.name) {
      case AutomationJobName.EXECUTE_RUN:
      case AutomationJobName.RESUME_WORKFLOW: {
        const version = await this.mustFindVersion(
          job.data.automationId,
          job.data.automationVersion,
        );
        await this.executionEngine.processRun(job.data.runId, version);
        return;
      }
      default:
        this.logger.warn(`Unhandled job name: ${job.name}`);
    }
  }

  private async mustFindVersion(
    automationId: string,
    automationVersion: number,
  ): Promise<AutomationVersionEntity> {
    const version = await this.versions.findOne({
      where: { automationId, version: automationVersion },
    });
    if (!version) {
      throw new NotFoundError(
        `Automation version ${automationId}@${automationVersion} not found`,
      );
    }
    return version;
  }
}
