import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { fileScope } from './file-access';
import { NasService } from './nas.service';
import { NasStagingService } from './nas-staging.service';

function minutes(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value <= 0 || value > 1440)
    throw new Error(
      `${name} must be between 0 and 1440 minutes (exclusive of zero)`,
    );
  return value;
}

@Injectable()
export class NasTransferService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NasTransferService.name);
  private timer?: NodeJS.Timeout;
  private active?: Promise<void>;
  private stopping = false;
  private lastRunAt: string | null = null;
  private lastResult: 'idle' | 'completed' | 'retry_pending' = 'idle';

  constructor(
    private readonly nas: NasService,
    private readonly staging: NasStagingService,
  ) {}

  onModuleInit() {
    if (
      !this.staging.enabled() ||
      process.env.NAS_TRANSFER_WORKER_ENABLED !== 'true'
    )
      return;
    const interval = minutes('NAS_TRANSFER_INTERVAL_MINUTES', 5);
    minutes('NAS_STAGING_MIN_AGE_MINUTES', 5);
    this.timer = setInterval(() => {
      void this.runOnce();
    }, interval * 60000);
    this.timer.unref();
    void this.runOnce();
  }

  async onModuleDestroy() {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    await this.active;
  }

  status() {
    return {
      enabled:
        process.env.NAS_TRANSFER_WORKER_ENABLED === 'true' &&
        this.staging.enabled(),
      running: Boolean(this.active),
      lastRunAt: this.lastRunAt,
      lastResult: this.lastResult,
    };
  }

  runOnce(): Promise<void> {
    if (this.active) return this.active;
    if (this.stopping || !this.nas.enabled() || !this.staging.enabled())
      return Promise.resolve();
    this.active = this.transfer()
      .catch(() => {
        this.lastResult = 'retry_pending';
        this.logger.warn(
          'NAS transfer deferred; staging or NAS is unavailable',
        );
      })
      .finally(() => {
        this.active = undefined;
      });
    return this.active;
  }

  private async transfer() {
    this.lastRunAt = new Date().toISOString();
    this.lastResult = 'completed';
    const cutoff =
      Date.now() - minutes('NAS_STAGING_MIN_AGE_MINUTES', 5) * 60000;
    await this.staging.withStore(async (store) => {
      const entries = (await store.list())
        .filter((entry) => {
          const key = entry.name.startsWith('.delete-')
            ? entry.name.slice(8)
            : entry.name;
          return (
            fileScope(key) &&
            key.includes('-nas-') &&
            entry.modifiedAt <= cutoff
          );
        })
        .sort(
          (a, b) =>
            Number(b.name.startsWith('.delete-')) -
              Number(a.name.startsWith('.delete-')) ||
            a.modifiedAt - b.modifiedAt,
        );
      const seen = new Set<string>();
      let processed = 0;
      for (const entry of entries) {
        if (this.stopping || processed >= 10) break;
        const key = entry.name.startsWith('.delete-')
          ? entry.name.slice(8)
          : entry.name;
        if (seen.has(key)) continue;
        seen.add(key);
        let release: () => Promise<void>;
        try {
          release = await store.lock(key);
        } catch (error) {
          if (error instanceof ConflictException) {
            this.lastResult = 'retry_pending';
            continue;
          }
          throw error;
        }
        try {
          // Re-read under the shared lock: another instance may have deleted/moved it.
          if (await store.read(`.delete-${key}`)) {
            await this.nas.delete(key);
            await store.remove(key);
            await store.remove(`.delete-${key}`);
          } else {
            const data = await store.read(key);
            if (!data) continue;
            // NAS put verifies SHA256 before atomically publishing the final key.
            await this.nas.put(key, data);
            await store.remove(key);
          }
          processed++;
        } finally {
          await release();
        }
      }
    });
  }
}
