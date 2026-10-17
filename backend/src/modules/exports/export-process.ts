import { fork, spawn } from 'child_process';
import type { ForkOptions } from 'child_process';
import { join } from 'path';
import { ExportData, ExportResult } from './export.types';
import { exportConfig } from './export.config';
import { UnrecoverableError } from 'bullmq';

export function runExportProcess(
  data: ExportData,
  signal?: AbortSignal,
  processorPath = join(__dirname, '../../../..', 'scripts/export-child.cjs'),
): Promise<ExportResult> {
  const config = exportConfig();
  return new Promise((resolve, reject) => {
    const options: ForkOptions & { windowsHide: boolean } = {
      env: { ...process.env, EXPORT_JOB_CHILD: '1' },
      execArgv: [`--max-old-space-size=${config.memoryMb}`],
      stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
      detached: process.platform !== 'win32',
      windowsHide: true,
    };
    const child = fork(processorPath, [], options);
    let finished = false;
    let result: ExportResult | undefined;
    let failure: Error | undefined;
    const stop = () => {
      if (process.platform === 'win32' && child.pid) {
        const killer = spawn(
          'taskkill',
          ['/PID', String(child.pid), '/T', '/F'],
          { windowsHide: true, stdio: 'ignore' },
        );
        killer.on('error', () => child.kill('SIGKILL'));
      } else if (child.pid) {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          child.kill('SIGKILL');
        }
      }
    };
    const finish = (error?: Error, value?: ExportResult) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      error ? reject(error) : resolve(value!);
    };
    const terminate = (error: Error) => {
      failure ||= error;
      stop();
    };
    const abort = () =>
      terminate(new Error('Export interrupted during worker shutdown'));
    const timer = setTimeout(
      () => terminate(new Error(`Export timed out after ${config.timeout} ms`)),
      config.timeout,
    );
    signal?.addEventListener('abort', abort, { once: true });
    child.once('error', (error) =>
      child.pid ? terminate(error) : finish(error),
    );
    child.on(
      'message',
      (message: {
        result?: ExportResult;
        error?: string;
        retryable?: boolean;
      }) => {
        if (message.result) result = message.result;
        else
          failure =
            message.retryable === false
              ? new UnrecoverableError(message.error || 'Export rejected')
              : new Error(message.error || 'Invalid export worker response');
      },
    );
    // Do not release the concurrency slot until the actual process has exited.
    child.once('exit', (code) =>
      finish(
        failure ||
          (!result
            ? new Error(
                `Export process exited before returning a result (${code})`,
              )
            : undefined),
        result,
      ),
    );
    child.send(data, (error) => {
      if (error) terminate(error);
    });
    if (signal?.aborted) abort();
  });
}
