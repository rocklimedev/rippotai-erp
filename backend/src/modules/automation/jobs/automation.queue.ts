import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  AUTOMATION_QUEUE_NAME,
  AutomationJobData,
  AutomationJobName,
  RetryPolicy,
} from './job.types';

@Injectable()
export class AutomationQueueService {
  constructor(
    @InjectQueue(AUTOMATION_QUEUE_NAME)
    private readonly queue: Queue<AutomationJobData>,
  ) {}

  async enqueueRunExecution(
    data: AutomationJobData,
    retryPolicy: RetryPolicy,
  ): Promise<void> {
    await this.queue.add(AutomationJobName.EXECUTE_RUN, data, {
      attempts: retryPolicy.maxAttempts,
      backoff: {
        type: retryPolicy.backoff.type,
        delay: retryPolicy.backoff.delay,
      },
      removeOnComplete: 1000,
      removeOnFail: false,
      // Deterministic job id prevents duplicate enqueue of the same run.
      jobId: `run:${data.runId}`,
    });
  }

  async enqueueStepExecution(
    data: AutomationJobData,
    retryPolicy: RetryPolicy,
  ): Promise<void> {
    await this.queue.add(AutomationJobName.EXECUTE_STEP, data, {
      attempts: retryPolicy.maxAttempts,
      backoff: {
        type: retryPolicy.backoff.type,
        delay: retryPolicy.backoff.delay,
      },
      removeOnComplete: 1000,
      removeOnFail: false,
      jobId: `run:${data.runId}:step:${data.stepId}`,
    });
  }

  async enqueueDelayedResume(
    data: AutomationJobData,
    delayMs: number,
  ): Promise<void> {
    await this.queue.add(AutomationJobName.RESUME_WORKFLOW, data, {
      delay: delayMs,
      removeOnComplete: 1000,
      removeOnFail: false,
      jobId: `resume:${data.workflowInstanceId ?? data.runId}:${Date.now()}`,
    });
  }

  async enqueueDeadlineCheck(
    data: AutomationJobData,
    atTimestampMs: number,
  ): Promise<void> {
    const delay = Math.max(0, atTimestampMs - Date.now());
    await this.queue.add(AutomationJobName.DEADLINE_CHECK, data, {
      delay,
      removeOnComplete: 1000,
      removeOnFail: false,
    });
  }
}
