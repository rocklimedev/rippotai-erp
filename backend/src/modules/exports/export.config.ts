export const EXPORT_QUEUE = 'document-exports';
export function positiveEnv(
  name: string,
  fallback: number,
  max = 1000000,
): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1 || value > max)
    throw new Error(`${name} must be an integer from 1 to ${max}`);
  return value;
}
export function exportConfig() {
  return {
    concurrency: positiveEnv('EXPORT_WORKER_CONCURRENCY', 1, 16),
    globalConcurrency: positiveEnv('EXPORT_GLOBAL_CONCURRENCY', 2, 32),
    capacity: positiveEnv('EXPORT_QUEUE_CAPACITY', 100, 10000),
    attempts: positiveEnv('EXPORT_MAX_ATTEMPTS', 3, 10),
    timeout: positiveEnv('EXPORT_JOB_TIMEOUT_MS', 180000, 1800000),
    memoryMb: positiveEnv('EXPORT_CHILD_MEMORY_MB', 512, 4096),
    maxResultBytes: positiveEnv('EXPORT_MAX_RESULT_BYTES', 67108864, 536870912),
    maxPayloadBytes: positiveEnv('EXPORT_MAX_PAYLOAD_BYTES', 1048576, 3145728),
    retentionSeconds: positiveEnv('EXPORT_RETENTION_SECONDS', 86400, 604800),
  };
}
export function redisOptions(worker = false) {
  return {
    host:
      process.env.EXPORT_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: Number(
      process.env.EXPORT_REDIS_PORT || process.env.REDIS_PORT || 6379,
    ),
    password:
      process.env.EXPORT_REDIS_PASSWORD ||
      process.env.REDIS_PASSWORD ||
      undefined,
    db: Number(process.env.EXPORT_REDIS_DB || 0),
    ...(process.env.EXPORT_REDIS_TLS === 'true' ? { tls: {} } : {}),
    maxRetriesPerRequest: worker ? null : 1,
    connectTimeout: 5000,
    ...(worker ? {} : { commandTimeout: 5000 }),
    ...(worker
      ? {}
      : { retryStrategy: (times: number) => (times > 2 ? null : 100 * times) }),
  };
}
