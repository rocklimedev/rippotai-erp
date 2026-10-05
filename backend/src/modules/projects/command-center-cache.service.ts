import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import type Redis from 'ioredis';
import { randomUUID, createHash } from 'crypto';
import { REDIS_CLIENT } from '@/common/redis/redis.module';
import { NATIVE_EVIDENCE } from '../gates/conditions/native-evidence.service';

const FRESH_MS = 15000;
const TTL_SECONDS = 120;
const REDIS_TIMEOUT_MS = 150;
const TABLES = new Set([
  'projects',
  'project_types',
  'project_phases',
  'project_gates',
  'gate_definitions',
  'gate_conditions',
  'documents',
  'document_types',
  'document_requirements',
  'drawings',
  'task_definitions',
  'task_executions',
  'activity_logs',
  'qc_sign_offs',
  'steps',
  'teams',
  'team_members',
  'project_planner_items',
  ...Object.values(NATIVE_EVIDENCE).map((source) => source.table),
]);

@Injectable()
export class CommandCenterCacheService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(CommandCenterCacheService.name);
  private readonly inFlight = new Map<string, Promise<any>>();
  private epoch = 0;
  private readonly hooked: any[] = [];
  private readonly transactions = new WeakSet<object>();
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  private get prefix() {
    return `command-center:v1:${this.sequelize.getDatabaseName()}`;
  }
  private get versionKey() {
    return `${this.prefix}:version`;
  }

  onApplicationBootstrap() {
    for (const model of this.sequelize.modelManager.models) {
      const table = model.getTableName();
      if (!TABLES.has(typeof table === 'string' ? table : table.tableName))
        continue;
      for (const hook of [
        'afterSave',
        'afterDestroy',
        'afterBulkCreate',
        'afterBulkUpdate',
        'afterBulkDestroy',
      ]) {
        (model as any).addHook(
          hook,
          'command-center-cache',
          async (...args: any[]) => {
            const options = args.at(-1);
            const transaction = options?.transaction;
            if (transaction) {
              if (!this.transactions.has(transaction)) {
                this.transactions.add(transaction);
                transaction.afterCommit(() => this.invalidate());
              }
            } else await this.invalidate();
          },
        );
      }
      this.hooked.push(model);
    }
  }
  onModuleDestroy() {
    for (const model of this.hooked)
      for (const hook of [
        'afterSave',
        'afterDestroy',
        'afterBulkCreate',
        'afterBulkUpdate',
        'afterBulkDestroy',
      ])
        model.removeHook(hook, 'command-center-cache');
  }

  private async redisOperation<T>(
    operation: () => Promise<T>,
  ): Promise<T | undefined> {
    if (this.redis.status !== 'ready') return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation(),
        new Promise<undefined>((resolve) => {
          timer = setTimeout(() => resolve(undefined), REDIS_TIMEOUT_MS);
        }),
      ]);
    } catch {
      return undefined;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async invalidate() {
    this.epoch++;
    await this.redisOperation(() =>
      this.redis.set(this.versionKey, randomUUID()),
    );
  }

  // Date revival preserves service-level types on both cache hits and cold loads.
  private encode(value: unknown) {
    return JSON.stringify(value, function (key, item) {
      return this[key] instanceof Date
        ? { __commandCenterDate: this[key].toISOString() }
        : item;
    });
  }
  private decode(raw: string) {
    return JSON.parse(raw, (_key, value) =>
      value?.__commandCenterDate ? new Date(value.__commandCenterDate) : value,
    );
  }

  async getOrLoad<T>(name: string, loader: () => Promise<T>): Promise<T> {
    const version = await this.redisOperation(() =>
      this.redis.get(this.versionKey),
    );
    const canCache = version !== undefined;
    const cacheKey = `${this.prefix}:${version ?? '0'}:${createHash('sha256').update(name).digest('hex')}`;
    const flightKey = `${cacheKey}:${this.epoch}`;
    const raw = canCache
      ? await this.redisOperation(() => this.redis.get(cacheKey))
      : undefined;
    if (raw) {
      try {
        const entry = this.decode(raw);
        const age = Date.now() - entry.builtAt;
        if (
          typeof entry.builtAt === 'number' &&
          'value' in entry &&
          age >= 0 &&
          age < TTL_SECONDS * 1000
        ) {
          if (age >= FRESH_MS)
            void this.build(
              flightKey,
              cacheKey,
              canCache,
              version,
              loader,
            ).catch((error) =>
              this.logger.warn(
                `Command Center refresh failed: ${error.message}`,
              ),
            );
          return entry.value;
        }
      } catch {
        /* Malformed cache falls back to the source data. */
      }
    }
    return this.build(flightKey, cacheKey, canCache, version, loader);
  }

  private build<T>(
    flightKey: string,
    cacheKey: string,
    canCache: boolean,
    version: string | null | undefined,
    loader: () => Promise<T>,
  ): Promise<T> {
    const pending = this.inFlight.get(flightKey);
    if (pending) return pending;
    const epoch = this.epoch;
    const build = (async () => {
      const value = await loader();
      if (canCache && this.epoch === epoch) {
        const currentVersion = await this.redisOperation(() =>
          this.redis.get(this.versionKey),
        );
        if (currentVersion === version && this.epoch === epoch)
          await this.redisOperation(() =>
            this.redis.set(
              cacheKey,
              this.encode({ builtAt: Date.now(), value }),
              'EX',
              TTL_SECONDS,
            ),
          );
      }
      return value;
    })();
    this.inFlight.set(flightKey, build);
    void build
      .finally(() => {
        if (this.inFlight.get(flightKey) === build)
          this.inFlight.delete(flightKey);
      })
      .catch(() => {});
    return build;
  }
}
