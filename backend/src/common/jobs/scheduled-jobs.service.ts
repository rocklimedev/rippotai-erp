import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes, Transaction } from 'sequelize';

/** Connection-scoped named locks coordinate replicas without MySQL 8 syntax. */
@Injectable()
export class ScheduledJobsService implements OnModuleDestroy {
  private readonly logger = new Logger(ScheduledJobsService.name);
  private readonly timers: NodeJS.Timeout[] = [];
  private readonly active = new Set<Promise<void>>();
  private stopping = false;
  constructor(private readonly db: Sequelize) {}

  private withOwnership<T>(
    name: string,
    handler: (transaction: Transaction) => Promise<T>,
    busy: () => T,
  ): Promise<T> {
    return this.db.transaction(async (transaction) => {
      const options = {
        replacements: [name],
        type: QueryTypes.SELECT as const,
        transaction,
        retry: { max: 0 },
      };
      // Hash the database and job names to stay within MySQL's 64-character limit.
      const [lock] = await this.db.query<{ acquired: number | null }>(
        "SELECT GET_LOCK(SHA2(CONCAT(DATABASE(), ':scheduled:', ?), 256), 0) AS acquired",
        options,
      );
      if (Number(lock?.acquired) !== 1) {
        if (lock?.acquired === 0) return busy();
        throw new Error(`Could not acquire scheduled job lock: ${name}`);
      }
      // This deployment closes idle connections after 10s. Keep the lock's
      // connection active while handlers use other connections or await HTTP.
      let pending: Promise<unknown> | undefined;
      let lost: unknown;
      const heartbeat = setInterval(() => {
        if (pending || lost) return;
        pending = this.db
          .query('SELECT 1', { transaction, retry: { max: 0 } })
          .catch((error) => {
            lost = error;
          })
          .finally(() => {
            pending = undefined;
          });
      }, 3000);
      heartbeat.unref();
      try {
        const result = await handler(transaction);
        if (pending) await pending;
        if (lost) throw lost;
        return result;
      } finally {
        clearInterval(heartbeat);
        if (pending) await pending;
        // Named locks survive transaction rollback, so always release explicitly
        // on this same connection before Sequelize returns it to the pool.
        await this.db.query(
          "SELECT RELEASE_LOCK(SHA2(CONCAT(DATABASE(), ':scheduled:', ?), 256)) AS released",
          options,
        );
      }
    });
  }

  async exclusive<T>(name: string, handler: () => Promise<T>): Promise<T> {
    return this.withOwnership(
      name,
      async () => handler(),
      () => {
        throw new ConflictException(
          'Reminder sync is already running. Try again shortly.',
        );
      },
    );
  }

  async register(
    name: string,
    intervalMs: number,
    handler: (executionKey: string) => Promise<unknown>,
  ) {
    if (!Number.isFinite(intervalMs) || intervalMs < 1000)
      throw new Error(`Invalid interval for ${name}`);
    await this.db.query(
      'INSERT IGNORE INTO scheduled_jobs (name, next_run_at, occurrence_id) VALUES (?, TIMESTAMPADD(MICROSECOND, ?, NOW(3)), UUID())',
      { replacements: [name, intervalMs * 1000] },
    );
    let running = false;
    const tick = () => {
      if (running || this.stopping) return;
      running = true;
      const work = this.execute(name, intervalMs, handler)
        .catch((error) =>
          this.logger.error(
            `Scheduled job ${name}: ${error.message}`,
            error.stack,
          ),
        )
        .finally(() => {
          running = false;
          this.active.delete(work);
        });
      this.active.add(work);
    };
    const timer = setInterval(tick, Math.min(intervalMs, 5000));
    timer.unref();
    this.timers.push(timer);
    tick();
  }

  async execute(
    name: string,
    intervalMs: number,
    handler: (executionKey: string) => Promise<unknown>,
  ) {
    await this.withOwnership(
      name,
      async (transaction) => {
        const rows = await this.db.query(
          'SELECT name, occurrence_id AS execution_key FROM scheduled_jobs WHERE name = ? AND next_run_at <= NOW(3) FOR UPDATE',
          { replacements: [name], type: QueryTypes.SELECT, transaction },
        );
        if (!rows.length) return;
        try {
          await handler(`${name}:${(rows[0] as any).execution_key}`);
          await this.db.query(
            `UPDATE scheduled_jobs SET next_run_at = TIMESTAMPADD(MICROSECOND, ?, NOW(3)),
           last_success_at = NOW(3), last_error = NULL, failures = 0, occurrence_id = UUID() WHERE name = ?`,
            { replacements: [intervalMs * 1000, name], transaction },
          );
        } catch (error) {
          await this.db.query(
            `UPDATE scheduled_jobs SET next_run_at = TIMESTAMPADD(SECOND, 60, NOW(3)),
           last_failed_at = NOW(3), failures = failures + 1, last_error = ? WHERE name = ?`,
            {
              replacements: [
                String(error?.message || error).slice(0, 4000),
                name,
              ],
              transaction,
            },
          );
          this.logger.error(
            `Scheduled job ${name} failed; retry in 60s`,
            error?.stack,
          );
        }
      },
      () => undefined,
    );
  }

  async onModuleDestroy() {
    this.stopping = true;
    for (const timer of this.timers) clearInterval(timer);
    await Promise.allSettled([...this.active]);
  }
}
