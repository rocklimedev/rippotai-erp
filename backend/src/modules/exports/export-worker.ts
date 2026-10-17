import { Queue, Worker, UnrecoverableError } from 'bullmq';
import { existsSync } from 'fs';
import { CdnService } from '../cdn/cdn.service';
import { exportConfig, EXPORT_QUEUE, redisOptions } from './export.config';
import { ExportData, ExportResult } from './export.types';
import { runExportProcess } from './export-process';

export async function startExportWorker(
  testOptions: {
    processor?: typeof runExportProcess;
    skipEnv?: boolean;
    signals?: boolean;
  } = {},
) {
  if (!testOptions.skipEnv && existsSync('.env')) process.loadEnvFile('.env');
  const config = exportConfig();
  const options = {
    connection: redisOptions(true),
    prefix: process.env.EXPORT_QUEUE_PREFIX || 'erp',
  };
  const queue = new Queue<ExportData, ExportResult>(EXPORT_QUEUE, options);
  await queue.setGlobalConcurrency(config.globalConcurrency);
  const stopping = new AbortController();
  const worker = new Worker<ExportData, ExportResult>(
    EXPORT_QUEUE,
    async (job) => {
      await job.log(
        `${new Date().toISOString()} Attempt ${job.attemptsMade + 1} started`,
      );
      try {
        await job.updateProgress(5);
        const result = await (testOptions.processor || runExportProcess)(
          job.data,
          stopping.signal,
        );
        await job.updateProgress(100);
        await job.log(`${new Date().toISOString()} Attempt completed`);
        return result;
      } catch (error) {
        if (error instanceof UnrecoverableError)
          await job.updateProgress({ stage: 'failed', retryable: false });
        const message =
          error instanceof Error ? error.message : 'Export worker failed';
        await job.log(`${new Date().toISOString()} Attempt failed: ${message}`);
        throw error;
      }
    },
    {
      ...options,
      concurrency: config.concurrency,
      maxStalledCount: 1,
      maxStartedAttempts: config.attempts + 1,
      lockDuration: 30000,
    },
  );
  worker.on('error', (error) =>
    console.error('Export worker Redis error:', error.name),
  );
  worker.on('stalled', (id) => {
    void queue
      .getJob(id)
      .then((job) =>
        job?.log(
          `${new Date().toISOString()} Worker lease expired; stalled job recovery requested`,
        ),
      )
      .catch(() => undefined);
  });
  worker.on('failed', (job, error) => {
    void job
      ?.log(`${new Date().toISOString()} Failure recorded: ${error.message}`)
      .catch(() => undefined);
  });
  const storage = new CdnService();
  let cleaning = false;
  const cleanup = async () => {
    if (cleaning) return;
    cleaning = true;
    try {
      const jobs = await queue.getJobs(['completed', 'failed'], 0, 99, true);
      for (const job of jobs) {
        if (
          !job.finishedOn ||
          Date.now() - job.finishedOn < config.retentionSeconds * 1000
        )
          continue;
        if (job.returnvalue?.type === 'file') {
          try {
            await storage.deleteFile(job.returnvalue.key);
          } catch (error) {
            const code = (error as { code?: string | number }).code;
            if (code !== 'ENOENT' && code !== 2) throw error;
          }
        }
        await job.remove();
      }
    } finally {
      cleaning = false;
    }
  };
  const timer = setInterval(
    () =>
      cleanup().catch((error) =>
        console.error('Export retention cleanup failed:', error.name),
      ),
    60000,
  );
  const close = async () => {
    clearInterval(timer);
    // Stop admission first. In-flight processes finish within their configured
    // timeout, then their BullMQ state is committed before the worker exits.
    await worker.close();
    stopping.abort();
    await queue.close();
  };
  if (testOptions.signals !== false) {
    process.once('SIGTERM', () => void close().then(() => process.exit(0)));
    process.once('SIGINT', () => void close().then(() => process.exit(0)));
  }
  await worker.waitUntilReady();
  console.log(
    `Export worker ready: local concurrency ${config.concurrency}, global ${config.globalConcurrency}, timeout ${config.timeout} ms`,
  );
  return { worker, queue, close, cleanup };
}

if (require.main === module)
  startExportWorker().catch((error) => {
    console.error('Export worker could not start:', error.name);
    process.exit(1);
  });
