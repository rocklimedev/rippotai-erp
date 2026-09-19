import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { randomUUID as uuid } from 'crypto';
import { Op } from 'sequelize';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from '@/common/redis/redis.module';
import { GateDefinition } from './models/gate-definition.model';
import { GateCondition } from './models/gate-condition.model';
import { ProjectGate } from './models/project-gate.model';
import { GateTransitionLog } from './models/gate-transition-log.model';
import { Project } from '@/modules/projects/models/projects.model';
import { ActivityAction } from '../../common/enums';
import { GateStatus } from '@/common/enums/gates.enum';
import { GateTransitionAction } from '@/common/enums/gates.enum';
import {
  GateConditionResult,
  GateReadiness,
} from '../../common/interfaces/gate-condition-result.interface';
import { CurrentUserPayload } from '@/common/interfaces/current-user-payload.interface';
import {
  GateAlreadyClearedException,
  GateLockedException,
  GateNotFoundException,
  GateNotReadyException,
  ProjectNotFoundException,
} from '../../common/exceptions/gate.exceptions';

import { ConditionRegistry } from './conditions/condition-registry';
import { ActivityLogsService } from '@/modules/engagement/activity-logs.service';
import { AccessService } from '../rbac/access.service';

/**
 * Plain-object projection of a GateCondition, used for the Redis-cached gate
 * config. Evaluators only ever read data fields off `condition` (never call
 * Sequelize instance methods on it), so a plain object is safe to pass into
 * `ConditionEvaluator.evaluate()` wherever the type expects `GateCondition`.
 */
interface CachedGateCondition {
  id: string;
  gateDefinitionId: string;
  type: string;
  label: string;
  params: Record<string, any>;
  optional: boolean;
  sortOrder: number;
}

/** Plain-object projection of a GateDefinition + its conditions, cached in Redis. */
interface CachedGateDefinition {
  id: string;
  code: string;
  phaseCode: string;
  name: string;
  sequenceOrder: number;
  progressThresholdPct: number;
  triggerCondition: string;
  handoffBetween: string;
  allowsOverride: boolean;
  opensPhaseId: string | null;
  conditions: CachedGateCondition[];
}

@Injectable()
export class GateEngineService {
  private readonly logger = new Logger(GateEngineService.name);

  // ---- Redis cache tuning ---------------------------------------------
  // Config data (gate/condition definitions): admin-edited, near-static,
  // read on every single check. Long TTL, safe to serve stale for a while.
  private static readonly CONFIG_CACHE_KEY = 'gatecfg:definitions:active';
  private static readonly CONFIG_TTL_SECONDS = 15 * 60;

  // "Have this project's ProjectGate rows been bootstrapped" flag. Cheap to
  // recompute if wrong; TTL just bounds how long a stale flag can linger if
  // gate definitions change underneath a project.
  private static readonly INIT_TTL_SECONDS = 10 * 60;

  // Computed readiness: derived from data owned by other modules (documents,
  // tasks, payments, quotations, BOQs, team members). Cached per-project
  // using a version counter (see invalidateReadinessCache) so writes in
  // those modules can invalidate precisely; the TTL below is only a safety
  // net in case an invalidation call is ever missed somewhere upstream.
  private static readonly READINESS_TTL_SECONDS = 15;

  constructor(
    @InjectModel(GateDefinition)
    private readonly gateDefinitionModel: typeof GateDefinition,
    @InjectModel(GateCondition)
    private readonly gateConditionModel: typeof GateCondition,
    @InjectModel(ProjectGate)
    private readonly projectGateModel: typeof ProjectGate,
    @InjectModel(GateTransitionLog)
    private readonly transitionLogModel: typeof GateTransitionLog,
    @InjectModel(Project) private readonly projectModel: typeof Project,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly conditionRegistry: ConditionRegistry,
    private readonly activityLog: ActivityLogsService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly access: AccessService,
  ) {}

  // ---- Redis helpers -----------------------------------------------------
  // All cache reads/writes fail OPEN: if Redis is down or a value is
  // malformed, we fall back to hitting the DB rather than breaking gate
  // reads/writes. Caching must never make this module less available than
  // it was before.

  private async getRedisJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.warn(`Redis read failed for "${key}": ${error}`);
      return null;
    }
  }

  private async setRedisJson(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`Redis write failed for "${key}": ${error}`);
    }
  }

  private initKey(projectId: string): string {
    return `gate:init:${projectId}`;
  }

  private versionKey(projectId: string): string {
    return `gate:version:${projectId}`;
  }

  private listKey(projectId: string, version: number): string {
    return `gate:list:${projectId}:v${version}`;
  }

  private readinessKey(
    projectId: string,
    gateCode: string,
    version: number,
  ): string {
    return `gate:readiness:${projectId}:${gateCode}:v${version}`;
  }

  private async getProjectVersion(projectId: string): Promise<number> {
    try {
      const v = await this.redis.get(this.versionKey(projectId));
      return v ? Number(v) : 0;
    } catch (error) {
      this.logger.warn(
        `Redis read failed for gate version of ${projectId}: ${error}`,
      );
      return 0;
    }
  }

  /**
   * Bumps the cache "generation" for a project, invalidating every cached
   * readiness/list entry for it in one cheap op (no need to enumerate or
   * delete individual gate/condition keys).
   *
   * Called internally after clearGate/reopenGate/tickManualCondition.
   * IMPORTANT: any *other* module whose data feeds a gate condition
   * (documents, drawings, tasks, payments, quotations, BOQs, team members)
   * should call this too after a write that could flip a condition's
   * result — otherwise its effect on gate readiness won't be visible until
   * the READINESS_TTL_SECONDS safety-net TTL expires.
   */
  async invalidateReadinessCache(projectId: string): Promise<void> {
    try {
      await this.redis.incr(this.versionKey(projectId));
    } catch (error) {
      this.logger.warn(
        `Failed to bump gate cache version for project ${projectId}: ${error}`,
      );
    }
  }

  /** Cached (config-tier) fetch of every active gate + its conditions, sorted. */
  private async getActiveGateDefinitions(): Promise<CachedGateDefinition[]> {
    const cached = await this.getRedisJson<CachedGateDefinition[]>(
      GateEngineService.CONFIG_CACHE_KEY,
    );
    if (cached) return cached;

    const rows = await this.gateDefinitionModel.findAll({
      where: { isActive: true },
      include: [{ model: GateCondition }],
      order: [['sequenceOrder', 'ASC']],
    });

    const plain: CachedGateDefinition[] = rows.map((g) => ({
      id: g.id,
      code: g.code,
      phaseCode: g.phaseCode,
      name: g.name,
      sequenceOrder: g.sequenceOrder,
      progressThresholdPct: g.progressThresholdPct,
      triggerCondition: g.triggerCondition,
      handoffBetween: g.handoffBetween,
      allowsOverride: g.allowsOverride,
      opensPhaseId: g.opensPhaseId,
      conditions: (g.conditions ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => ({
          id: c.id,
          gateDefinitionId: c.gateDefinitionId,
          type: c.type,
          label: c.label,
          params: c.params,
          optional: c.optional,
          sortOrder: c.sortOrder,
        })),
    }));

    await this.setRedisJson(
      GateEngineService.CONFIG_CACHE_KEY,
      plain,
      GateEngineService.CONFIG_TTL_SECONDS,
    );
    return plain;
  }

  /**
   * Runs every condition's evaluator in parallel instead of one-at-a-time.
   * Conditions are independent of each other, so serial evaluation was pure
   * added latency — a gate with 5 conditions paid 5x the round-trip cost of
   * a gate with 1. Order of `results` matches the order of `conditions`.
   */
  private async evaluateConditions(
    projectId: string,
    conditions: GateCondition[] | CachedGateCondition[],
  ): Promise<GateConditionResult[]> {
    return Promise.all(
      conditions.map(async (condition) => {
        try {
          const evaluator = this.conditionRegistry.resolve(condition.type);
          return await evaluator.evaluate(
            projectId,
            condition as unknown as GateCondition,
          );
        } catch (error) {
          this.logger.error(`Cannot evaluate condition ${condition.id}`, error);
          return {
            conditionId: condition.id,
            type: condition.type,
            label: condition.label,
            optional: condition.optional,
            passed: false,
            detail:
              'Evidence could not be evaluated; check engine configuration.',
          };
        }
      }),
    );
  }

  /**
   * Creates a LOCKED ProjectGate row for every active gate definition that
   * doesn't have one yet, and makes sure gate #1 is at least PENDING. Called
   * lazily on every read/write so a project never needs an explicit
   * "initialize gates" step — the very first call bootstraps it.
   *
   * Guarded by a Redis flag so this is a single GET on every call after the
   * first for a project, instead of 2-3 queries every single time.
   */
  async ensureInitialized(projectId: string): Promise<void> {
    const initKey = this.initKey(projectId);
    const alreadyInitialized = await this.getRedisJson<boolean>(initKey);
    if (alreadyInitialized) return;

    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new ProjectNotFoundException(projectId);

    const gates = await this.getActiveGateDefinitions();

    const existing = await this.projectGateModel.findAll({
      where: { projectId },
    });
    const existingByGateId = new Map(
      existing.map((pg) => [pg.gateDefinitionId, pg]),
    );

    for (const gate of gates) {
      if (!existingByGateId.has(gate.id)) {
        const status =
          gate.id === gates[0]?.id ? GateStatus.PENDING : GateStatus.LOCKED;
        await this.projectGateModel.findOrCreate({
          where: { projectId, gateDefinitionId: gate.id },
          defaults: {
            id: uuid(),
            projectId,
            gateDefinitionId: gate.id,
            status,
          },
        });
      }
    }

    await this.setRedisJson(initKey, true, GateEngineService.INIT_TTL_SECONDS);
  }

  /**
   * Full ordered list of every gate + its live status for a project.
   *
   * Batches all gate-definition and project-gate reads into one query each
   * (instead of calling checkReadiness() per gate, which used to re-fetch
   * the gate + conditions + previous gate + project-gate row individually
   * for every single gate), and serves from Redis for the duration of the
   * project's current cache "generation" (see invalidateReadinessCache).
   */
  async listProjectGates(projectId: string): Promise<any[]> {
    await this.ensureInitialized(projectId);

    const version = await this.getProjectVersion(projectId);
    const listKey = this.listKey(projectId, version);
    const cached = await this.getRedisJson<any[]>(listKey);
    if (cached) return cached;

    const gateDefs = await this.getActiveGateDefinitions(); // already sorted by sequenceOrder
    const projectGates = await this.projectGateModel.findAll({
      where: { projectId },
    });
    const projectGateByGateId = new Map(
      projectGates.map((pg) => [pg.gateDefinitionId, pg]),
    );

    const readinessEntries = await Promise.all(
      gateDefs.map(async (gate, index) => {
        const projectGate = projectGateByGateId.get(gate.id);
        if (!projectGate || projectGate.status === GateStatus.CLEARED) {
          return null;
        }
        const previousGate = index > 0 ? gateDefs[index - 1] : null;
        const previousProjectGate = previousGate
          ? projectGateByGateId.get(previousGate.id)
          : null;
        const readiness = await this.computeReadinessFromLoaded(
          projectId,
          gate,
          previousGate,
          previousProjectGate?.status ?? null,
          projectGate,
        );
        return [gate.id, readiness] as const;
      }),
    );
    const readinessByGateId = new Map(
      readinessEntries.filter(
        (entry): entry is readonly [string, GateReadiness] => entry !== null,
      ),
    );

    const result = gateDefs.map((gate) => {
      const pg = projectGateByGateId.get(gate.id);
      const readiness = readinessByGateId.get(gate.id);
      return {
        gateCode: gate.code,
        phaseCode: gate.phaseCode,
        allowsOverride: gate.allowsOverride,
        gateName: gate.name,
        sequenceOrder: gate.sequenceOrder,
        progressThresholdPct: gate.progressThresholdPct,
        triggerCondition: gate.triggerCondition,
        handoffBetween: gate.handoffBetween,
        status:
          pg?.status === GateStatus.CLEARED
            ? pg.status
            : readiness?.isReady
              ? GateStatus.READY
              : readiness?.unlockedByPreviousGate
                ? GateStatus.PENDING
                : GateStatus.LOCKED,
        clearedAt: pg?.clearedAt ?? null,
        clearedBy: pg?.clearedBy ?? null,
        overridden: pg?.overridden ?? false,
        remarks: pg?.remarks ?? null,
      };
    });

    await this.setRedisJson(
      listKey,
      result,
      GateEngineService.READINESS_TTL_SECONDS,
    );
    return result;
  }

  /** Shared readiness computation for the batched listProjectGates() path. */
  private async computeReadinessFromLoaded(
    projectId: string,
    gate: CachedGateDefinition,
    previousGate: CachedGateDefinition | null,
    previousProjectGateStatus: GateStatus | null,
    projectGate: ProjectGate,
  ): Promise<GateReadiness> {
    const unlockedByPreviousGate =
      !previousGate || previousProjectGateStatus === GateStatus.CLEARED;

    const results = await this.evaluateConditions(projectId, gate.conditions);

    const requiredResults = results.filter((r) => !r.optional);
    const optionalResults = results.filter((r) => r.optional);

    const requiredConditionsPassed =
      gate.conditions.length > 0 && requiredResults.every((r) => r.passed);
    const optionalGroupPassed =
      optionalResults.length === 0 || optionalResults.some((r) => r.passed);

    return {
      gateCode: gate.code,
      gateName: gate.name,
      sequenceOrder: gate.sequenceOrder,
      status: projectGate?.status ?? GateStatus.LOCKED,
      unlockedByPreviousGate,
      previousGateCode: previousGate?.code ?? null,
      requiredConditionsPassed,
      optionalGroupPassed,
      isReady:
        unlockedByPreviousGate &&
        requiredConditionsPassed &&
        optionalGroupPassed,
      conditions: results,
    };
  }

  /**
   * Evaluates every condition on a gate, plus the mandatory "previous gate
   * cleared" rule, WITHOUT changing any state. Safe to call as often as you
   * like (e.g. to render a checklist UI). Served from the Redis readiness
   * cache when available; falls back to a fresh DB-backed computation.
   */
  async checkReadiness(
    projectId: string,
    gateCode: string,
  ): Promise<GateReadiness> {
    await this.ensureInitialized(projectId);

    const version = await this.getProjectVersion(projectId);
    const key = this.readinessKey(projectId, gateCode, version);
    const cached = await this.getRedisJson<GateReadiness>(key);
    if (cached) return cached;

    const readiness = await this.computeReadinessFresh(projectId, gateCode);
    await this.setRedisJson(
      key,
      readiness,
      GateEngineService.READINESS_TTL_SECONDS,
    );
    return readiness;
  }

  /**
   * DB-fresh single-gate readiness computation, with zero caching. This is
   * the version used inside clearGate()'s transaction — a gating decision
   * that mutates state must never be made off a cached read, no matter how
   * short the TTL. checkReadiness() (the public, cached, display-only path)
   * falls back to this on a cache miss.
   */
  private async computeReadinessFresh(
    projectId: string,
    gateCode: string,
  ): Promise<GateReadiness> {
    const gate = await this.gateDefinitionModel.findOne({
      where: { code: gateCode, isActive: true },
      include: [{ model: GateCondition }],
    });
    if (!gate) throw new GateNotFoundException(gateCode);

    const previousGate = await this.gateDefinitionModel.findOne({
      where: { isActive: true, sequenceOrder: { [Op.lt]: gate.sequenceOrder } },
      order: [['sequenceOrder', 'DESC']],
    });

    let unlockedByPreviousGate = true;
    if (previousGate) {
      const previousProjectGate = await this.projectGateModel.findOne({
        where: { projectId, gateDefinitionId: previousGate.id },
      });
      unlockedByPreviousGate =
        previousProjectGate?.status === GateStatus.CLEARED;
    }

    const conditions = (gate.conditions ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const results = await this.evaluateConditions(projectId, conditions);

    const requiredResults = results.filter((r) => !r.optional);
    const optionalResults = results.filter((r) => r.optional);

    const requiredConditionsPassed =
      conditions.length > 0 && requiredResults.every((r) => r.passed);
    // If there are no optional conditions at all, that bucket trivially passes.
    // Otherwise at least one optional condition must pass (e.g. Agreement OR Contract).
    const optionalGroupPassed =
      optionalResults.length === 0 || optionalResults.some((r) => r.passed);

    const projectGate = await this.projectGateModel.findOne({
      where: { projectId, gateDefinitionId: gate.id },
    });

    const readiness: GateReadiness = {
      gateCode: gate.code,
      gateName: gate.name,
      sequenceOrder: gate.sequenceOrder,
      status: projectGate?.status ?? GateStatus.LOCKED,
      unlockedByPreviousGate,
      previousGateCode: previousGate?.code ?? null,
      requiredConditionsPassed,
      optionalGroupPassed,
      isReady:
        unlockedByPreviousGate &&
        requiredConditionsPassed &&
        optionalGroupPassed,
      conditions: results,
    };

    return readiness;
  }

  /**
   * Attempts to clear a gate. Throws unless every required condition passes
   * (and, if any exist, at least one optional condition passes) and the
   * previous gate in sequence is already CLEARED — unless `override` is
   * passed AND the gate's own `allowsOverride` flag is set, in which case
   * the caller's permission was already checked by the controller guard.
   */
  async clearGate(
    projectId: string,
    gateCode: string,
    user: CurrentUserPayload,
    opts: { remarks?: string; override?: boolean } = {},
  ): Promise<GateReadiness> {
    await this.access.require(user, 'gates', 'clear', projectId);
    if (
      opts.override &&
      (!await this.access.check(user, 'gates', 'override', projectId) || !opts.remarks?.trim())
    ) {
      throw new ForbiddenException(
        'Override requires gates:override permission and a reason',
      );
    }
    await this.ensureInitialized(projectId);
    const result = await this.sequelize.transaction(async (tx) => {
      await this.projectModel.findByPk(projectId, {
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });
      // Always the fresh, uncached computation — this is the actual gating
      // decision and must reflect committed state at this instant.
      const readiness = await this.computeReadinessFresh(projectId, gateCode);

      const gate = await this.gateDefinitionModel.findOne({
        where: { code: gateCode, isActive: true },
      });
      if (!gate) throw new GateNotFoundException(gateCode);

      if (readiness.status === GateStatus.CLEARED) {
        throw new GateAlreadyClearedException(gateCode);
      }

      if (!readiness.unlockedByPreviousGate) {
        throw new GateLockedException(
          gateCode,
          readiness.previousGateCode ?? '(unknown)',
        );
      }

      const isOverride =
        !readiness.isReady && !!opts.override && gate.allowsOverride;
      if (!readiness.isReady && !isOverride) {
        const failed = readiness.conditions
          .filter((c) => !c.optional && !c.passed)
          .map((c) => c.label);
        throw new GateNotReadyException(gateCode, failed);
      }

      const projectGate = await this.projectGateModel.findOne({
        where: { projectId, gateDefinitionId: gate.id },
        transaction: tx,
      });
      const fromStatus = projectGate!.status;

      await projectGate!.update(
        {
          status: GateStatus.CLEARED,
          clearedAt: new Date(),
          clearedBy: user.id,
          remarks: opts.remarks ?? null,
          overridden: isOverride,
          lastReadinessSnapshot: readiness as any,
        },
        { transaction: tx },
      );

      // Unlock the next gate in sequence.
      const nextGate = await this.gateDefinitionModel.findOne({
        where: {
          isActive: true,
          sequenceOrder: { [Op.gt]: gate.sequenceOrder },
        },
        order: [['sequenceOrder', 'ASC']],
        transaction: tx,
      });
      if (nextGate) {
        const nextProjectGate = await this.projectGateModel.findOne({
          where: { projectId, gateDefinitionId: nextGate.id },
          transaction: tx,
        });
        if (nextProjectGate && nextProjectGate.status === GateStatus.LOCKED) {
          await nextProjectGate.update(
            { status: GateStatus.PENDING },
            { transaction: tx },
          );
          await this.transitionLogModel.create(
            {
              id: uuid(),
              projectId,
              gateDefinitionId: nextGate.id,
              action: GateTransitionAction.REOPENED,
              fromStatus: GateStatus.LOCKED,
              toStatus: GateStatus.PENDING,
              performedBy: user.id,
              remarks: `Unlocked by clearing "${gate.code}".`,
              createdAt: new Date(),
            } as any,
            { transaction: tx },
          );
        }
      }

      // Keep projects.current_phase / progress_pct in sync for the rest of the ERP.
      const project = await this.projectModel.findByPk(projectId, {
        transaction: tx,
      });
      const updates: Record<string, any> = {
        progress_pct: Math.max(
          project!.progress_pct ?? 0,
          gate.progressThresholdPct,
        ),
      };
      if (gate.opensPhaseId) {
        const phase = await gate.$get('opensPhase', { transaction: tx });
        if (phase && !(phase as any).isParallel)
          updates.current_phase = (phase as any).code;
      }
      await project!.update(updates, { transaction: tx });

      await this.transitionLogModel.create(
        {
          id: uuid(),
          projectId,
          gateDefinitionId: gate.id,
          action: isOverride
            ? GateTransitionAction.OVERRIDDEN
            : GateTransitionAction.CLEARED,
          fromStatus,
          toStatus: GateStatus.CLEARED,
          performedBy: user.id,
          remarks: opts.remarks ?? null,
          snapshot: readiness as any,
          createdAt: new Date(),
        } as any,
        { transaction: tx },
      );

      await this.activityLog.log({
        user_id: user.id,
        user_email: user.email,

        action: isOverride
          ? ActivityAction.GATE_OVERRIDDEN
          : ActivityAction.GATE_CLEARED,
        entity_type: 'project_gate',
        entity_id: projectGate!.id,
        entity_label: `${gate.name} — ${project!.name}`,
        changes: {
          fromStatus,
          toStatus: GateStatus.CLEARED,
          override: isOverride,
          remarks: opts.remarks,
        },
      });

      this.logger.log(
        `Gate "${gate.code}" cleared for project ${projectId} by ${user.email}${isOverride ? ' (override)' : ''}.`,
      );

      return { ...readiness, status: GateStatus.CLEARED };
    });

    await this.invalidateReadinessCache(projectId);
    return result;
  }

  /**
   * Walks a cleared gate back to PENDING and cascades every downstream gate
   * that was already cleared back to LOCKED/PENDING, since whatever they
   * unlocked was contingent on this one. Used when a revision is requested
   * after the fact (e.g. client asks for layout changes after sign-off).
   */
  async reopenGate(
    projectId: string,
    gateCode: string,
    user: CurrentUserPayload,
    remarks: string,
  ): Promise<void> {
    await this.access.require(user, 'gates', 'reopen', projectId);
    if (!remarks?.trim())
      throw new BadRequestException('A reopening reason is required');
    await this.ensureInitialized(projectId);

    const gate = await this.gateDefinitionModel.findOne({
      where: { code: gateCode, isActive: true },
    });
    if (!gate) throw new GateNotFoundException(gateCode);

    const downstreamGates = await this.gateDefinitionModel.findAll({
      where: {
        isActive: true,
        sequenceOrder: { [Op.gte]: gate.sequenceOrder },
      },
      order: [['sequenceOrder', 'ASC']],
    });

    await this.sequelize.transaction(async (tx) => {
      await this.projectModel.findByPk(projectId, {
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });
      const target = await this.projectGateModel.findOne({
        where: { projectId, gateDefinitionId: gate.id },
        transaction: tx,
      });
      if (target?.status !== GateStatus.CLEARED)
        throw new BadRequestException('Only a cleared gate can be reopened');
      for (const [idx, dGate] of downstreamGates.entries()) {
        const projectGate = await this.projectGateModel.findOne({
          where: { projectId, gateDefinitionId: dGate.id },
          transaction: tx,
        });
        if (!projectGate) continue;

        const fromStatus = projectGate.status;
        const toStatus = idx === 0 ? GateStatus.REOPENED : GateStatus.LOCKED;
        if (fromStatus === toStatus) continue;

        await projectGate.update(
          {
            status: toStatus,
            clearedAt: null,
            clearedBy: null,
            overridden: false,
          },
          { transaction: tx },
        );

        await this.transitionLogModel.create(
          {
            id: uuid(),
            projectId,
            gateDefinitionId: dGate.id,
            action:
              idx === 0
                ? GateTransitionAction.REOPENED
                : GateTransitionAction.REOPENED,
            fromStatus,
            toStatus,
            performedBy: user.id,
            remarks:
              idx === 0 ? remarks : `Cascaded from reopening "${gate.code}".`,
            createdAt: new Date(),
          } as any,
          { transaction: tx },
        );
      }

      // The reopened gate itself should be immediately actionable again, not LOCKED.
      const reopened = await this.projectGateModel.findOne({
        where: { projectId, gateDefinitionId: gate.id },
        transaction: tx,
      });
      if (reopened) {
        await reopened.update(
          { status: GateStatus.PENDING },
          { transaction: tx },
        );
      }

      const project = await this.projectModel.findByPk(projectId, {
        transaction: tx,
      });
      const remaining = await this.projectGateModel.findAll({
        where: { projectId, status: GateStatus.CLEARED },
        include: [GateDefinition],
        transaction: tx,
      });
      await project!.update(
        {
          current_phase: gate.phaseCode,
          progress_pct: Math.max(
            0,
            ...remaining.map((r) =>
              Number(r.gateDefinition.progressThresholdPct ?? 0),
            ),
          ),
        },
        { transaction: tx },
      );
      await this.activityLog.log({
        user_id: user.id,
        user_email: user.email,

        action: ActivityAction.GATE_REOPENED,
        entity_type: 'project_gate',
        entity_id: reopened?.id ?? gate.id,
        entity_label: gate.name,
        changes: {
          remarks,
          cascadedGates: downstreamGates.map((g) => g.code),
        },
      });
    });

    await this.invalidateReadinessCache(projectId);
  }

  /** Records (or clears) a human tick against a MANUAL_APPROVAL condition. */
  async tickManualCondition(
    projectId: string,
    conditionId: string,
    user: CurrentUserPayload,
    ticked: boolean,
    remarks?: string,
  ): Promise<void> {
    await this.access.require(user, 'gates', 'clear', projectId);
    await this.ensureInitialized(projectId);
    const condition = await this.gateConditionModel.findByPk(conditionId);
    if (!condition) throw new Error(`Condition "${conditionId}" not found.`);

    if (condition.type !== 'MANUAL_APPROVAL')
      throw new BadRequestException('Only manual conditions can be ticked');
    await this.transitionLogModel.create({
      id: uuid(),
      projectId,
      gateDefinitionId: condition.gateDefinitionId,
      action: GateTransitionAction.MANUAL_CONDITION_TICKED,
      fromStatus: null,
      toStatus: null,
      performedBy: user.id,
      remarks: remarks ?? null,
      snapshot: { conditionId, ticked },
      createdAt: new Date(),
    } as any);

    await this.activityLog.log({
      user_id: user.id,
      user_email: user.email,

      action: ActivityAction.GATE_MANUAL_CONDITION_TICKED,
      entity_type: 'gate_condition',
      entity_id: conditionId,
      entity_label: condition.label,
      changes: {
        ticked,
        remarks,
      },
    });

    // A manual tick can flip ManualApprovalEvaluator's result for this
    // project's gates — invalidate so the next read reflects it immediately.
    await this.invalidateReadinessCache(projectId);
  }
}
