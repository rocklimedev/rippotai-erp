import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { exportConfig, EXPORT_QUEUE, redisOptions } from './export.config';
import {
  ExportActor,
  ExportArgument,
  ExportData,
  ExportResult,
} from './export.types';

@Injectable()
export class ExportJobsService implements OnModuleDestroy {
  private queue?: Queue<ExportData, ExportResult>;
  private config = exportConfig();
  getQueue() {
    if (!this.queue) {
      this.queue = new Queue<ExportData, ExportResult>(EXPORT_QUEUE, {
        connection: redisOptions(),
        prefix: process.env.EXPORT_QUEUE_PREFIX || 'erp',
      });
      this.queue.on('error', () => undefined); // HTTP calls return a controlled 503.
    }
    return this.queue;
  }
  async onModuleDestroy() {
    await this.queue?.close();
  }

  async enqueue(
    kind: string,
    args: ExportArgument[],
    actor: ExportActor,
    permission: string,
    retry?: ExportData & { jobId: string },
  ) {
    if (!actor?.id || !permission)
      throw new ForbiddenException('Authenticated export permission required');
    const data: ExportData = {
      kind,
      args,
      actor: { id: actor.id, name: actor.name, email: actor.email },
      permission,
      operationId: retry?.operationId || randomUUID(),
      retryOf: retry?.jobId,
      retryGeneration: retry ? retry.retryGeneration + 1 : 0,
    };
    if (Buffer.byteLength(JSON.stringify(data)) > this.config.maxPayloadBytes)
      throw new BadRequestException(
        'Export request exceeds the configured payload limit',
      );
    const queue = this.getQueue();
    const lock = `${process.env.EXPORT_QUEUE_PREFIX || 'erp'}:exports:admission`;
    const owner = randomUUID();
    let acquired = false;
    try {
      const redis = await queue.getBackend().client;
      redis.defineCommand('exportAdmissionAcquire', {
        numberOfKeys: 1,
        lua: "return redis.call('set',KEYS[1],ARGV[1],'PX',30000,'NX')",
      });
      redis.defineCommand('exportAdmissionRelease', {
        numberOfKeys: 1,
        lua: "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) end return 0",
      });
      // Serialize admission across API replicas. Requests never wait for a renderer.
      for (let i = 0; i < 10 && !acquired; i++) {
        acquired =
          (await redis.runCommand('exportAdmissionAcquire', [lock, owner])) ===
          'OK';
        if (!acquired) await new Promise((resolve) => setTimeout(resolve, 25));
      }
      if (!acquired)
        throw new ServiceUnavailableException(
          'Export queue is busy; try again shortly',
        );
      const counts = await queue.getJobCounts(
        'wait',
        'active',
        'delayed',
        'prioritized',
        'waiting-children',
      );
      const paused = await redis.llen(queue.toKey('paused'));
      if (
        Object.values(counts).reduce((sum, n) => sum + n, paused) >=
        this.config.capacity
      )
        throw new ServiceUnavailableException(
          'Export queue is full; try again shortly',
        );
      const job = await queue.add(kind, data, {
        jobId: randomUUID(),
        attempts: this.config.attempts,
        backoff: { type: 'exponential', delay: 2000 },
        // Retention/cleanup is performed by the worker so file bytes are removed too.
        removeOnComplete: false,
        removeOnFail: false,
        keepLogs: 50,
      });
      return {
        jobId: job.id,
        state: 'queued',
        statusUrl: `/export-jobs/${job.id}`,
        resultUrl: `/export-jobs/${job.id}/result`,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      if (this.queue === queue) {
        this.queue = undefined;
        void queue.close().catch(() => undefined);
      }
      throw new ServiceUnavailableException('Export queue is unavailable');
    } finally {
      if (acquired)
        await (await queue.getBackend().client)
          .runCommand('exportAdmissionRelease', [lock, owner])
          .catch(() => undefined);
    }
  }

  async owned(
    id: string,
    actor: ExportActor & {
      permissions?: string[];
      roleName?: string;
      role?: string;
    },
  ): Promise<Job<ExportData, ExportResult>> {
    const role = actor.roleName ?? actor.role;
    if (!role || role.trim().toUpperCase() === 'USER')
      throw new ForbiddenException('Portal access is required');
    const job = await this.getQueue().getJob(id);
    if (
      !job ||
      job.data.actor.id !== actor.id ||
      (job.finishedOn &&
        Date.now() - job.finishedOn > this.config.retentionSeconds * 1000)
    )
      throw new NotFoundException('Export job not found or expired');
    if (!actor.permissions?.includes(job.data.permission))
      throw new ForbiddenException(
        'The original export permission is required',
      );
    return job;
  }
  async status(
    id: string,
    actor: ExportActor & {
      permissions?: string[];
      roleName?: string;
      role?: string;
    },
  ) {
    let job = await this.owned(id, actor);
    const state = await job.getState();
    // Completion may land between reading the hash and reading state. Reload
    // terminal metadata so attempts and the result agree with that state.
    if (state === 'completed' || state === 'failed')
      job = await this.owned(id, actor);
    const logs = await this.getQueue().getJobLogs(id);
    return {
      jobId: id,
      kind: job.name,
      state,
      attemptsMade: job.attemptsMade,
      attemptsStarted: job.attemptsStarted,
      maxAttempts: job.opts.attempts,
      failedReason: job.failedReason || null,
      history: logs.logs,
      progress: job.progress,
      createdAt: job.timestamp,
      startedAt: job.processedOn,
      finishedAt: job.finishedOn,
      retryOf: job.data.retryOf || null,
      retryGeneration: job.data.retryGeneration,
      retryAvailable:
        state === 'failed' &&
        job.data.retryGeneration < 3 &&
        !(
          typeof job.progress === 'object' &&
          job.progress !== null &&
          'retryable' in job.progress &&
          job.progress.retryable === false
        ),
      resultUrl: state === 'completed' ? `/export-jobs/${id}/result` : null,
    };
  }
  async retry(
    id: string,
    actor: ExportActor & {
      permissions?: string[];
      roleName?: string;
      role?: string;
    },
  ) {
    const job = await this.owned(id, actor);
    if (
      (await job.getState()) !== 'failed' ||
      job.data.retryGeneration >= 3 ||
      (typeof job.progress === 'object' &&
        job.progress !== null &&
        'retryable' in job.progress &&
        job.progress.retryable === false)
    )
      throw new ConflictException(
        'Only retryable failed exports can be retried, up to three times',
      );
    return this.enqueue(job.name, job.data.args, actor, job.data.permission, {
      ...job.data,
      jobId: id,
    });
  }
}
