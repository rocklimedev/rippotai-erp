import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { randomUUID as uuid } from 'crypto';
import { Op } from 'sequelize';

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

@Injectable()
export class GateEngineService {
  private readonly logger = new Logger(GateEngineService.name);

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
  ) {}

  /**
   * Creates a LOCKED ProjectGate row for every active gate definition that
   * doesn't have one yet, and makes sure gate #1 is at least PENDING. Called
   * lazily on every read/write so a project never needs an explicit
   * "initialize gates" step — the very first call bootstraps it.
   */
  async ensureInitialized(projectId: string): Promise<void> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new ProjectNotFoundException(projectId);

    const gates = await this.gateDefinitionModel.findAll({
      where: { isActive: true },
      order: [['sequenceOrder', 'ASC']],
    });

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
  }

  /** Full ordered list of every gate + its live status for a project. */
  async listProjectGates(projectId: string): Promise<any[]> {
    await this.ensureInitialized(projectId);

    const rows = await this.projectGateModel.findAll({
      where: { projectId },
      include: [
        { model: GateDefinition, where: { isActive: true }, required: true },
      ],
    });

    const readiness = new Map(
      await Promise.all(
        rows
          .filter((r) => r.status !== GateStatus.CLEARED)
          .map(
            async (r) =>
              [
                r.gateDefinitionId,
                await this.checkReadiness(projectId, r.gateDefinition.code),
              ] as const,
          ),
      ),
    );
    return rows
      .sort(
        (a, b) =>
          a.gateDefinition.sequenceOrder - b.gateDefinition.sequenceOrder,
      )
      .map((pg) => ({
        gateCode: pg.gateDefinition.code,
        phaseCode: pg.gateDefinition.phaseCode,
        allowsOverride: pg.gateDefinition.allowsOverride,
        gateName: pg.gateDefinition.name,
        sequenceOrder: pg.gateDefinition.sequenceOrder,
        progressThresholdPct: pg.gateDefinition.progressThresholdPct,
        triggerCondition: pg.gateDefinition.triggerCondition,
        handoffBetween: pg.gateDefinition.handoffBetween,
        status:
          pg.status === GateStatus.CLEARED
            ? pg.status
            : readiness.get(pg.gateDefinitionId)?.isReady
              ? GateStatus.READY
              : readiness.get(pg.gateDefinitionId)?.unlockedByPreviousGate
                ? GateStatus.PENDING
                : GateStatus.LOCKED,
        clearedAt: pg.clearedAt,
        clearedBy: pg.clearedBy,
        overridden: pg.overridden,
        remarks: pg.remarks,
      }));
  }

  /**
   * Evaluates every condition on a gate, plus the mandatory "previous gate
   * cleared" rule, WITHOUT changing any state. Safe to call as often as you
   * like (e.g. to render a checklist UI).
   */
  async checkReadiness(
    projectId: string,
    gateCode: string,
  ): Promise<GateReadiness> {
    await this.ensureInitialized(projectId);

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

    const conditions = (gate.conditions ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const results: GateConditionResult[] = [];
    for (const condition of conditions) {
      try {
        const evaluator = this.conditionRegistry.resolve(condition.type);
        results.push(await evaluator.evaluate(projectId, condition));
      } catch (error) {
        this.logger.error(`Cannot evaluate condition ${condition.id}`, error);
        results.push({
          conditionId: condition.id,
          type: condition.type,
          label: condition.label,
          optional: condition.optional,
          passed: false,
          detail:
            'Evidence could not be evaluated; check engine configuration.',
        });
      }
    }

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
    if (!user.permissions?.includes('gates:clear'))
      throw new ForbiddenException('Missing gates:clear permission');
    if (
      opts.override &&
      (!user.permissions?.includes('gates:override') || !opts.remarks?.trim())
    ) {
      throw new ForbiddenException(
        'Override requires gates:override permission and a reason',
      );
    }
    await this.ensureInitialized(projectId);
    return this.sequelize.transaction(async (tx) => {
      await this.projectModel.findByPk(projectId, {
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });
      const readiness = await this.checkReadiness(projectId, gateCode);

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
    if (!user.permissions?.includes('gates:reopen'))
      throw new ForbiddenException('Missing gates:reopen permission');
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
  }

  /** Records (or clears) a human tick against a MANUAL_APPROVAL condition. */
  async tickManualCondition(
    projectId: string,
    conditionId: string,
    user: CurrentUserPayload,
    ticked: boolean,
    remarks?: string,
  ): Promise<void> {
    if (!user.permissions?.includes('gates:clear'))
      throw new ForbiddenException('Missing gates:clear permission');
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
  }
}
