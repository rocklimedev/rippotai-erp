import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { v4 as uuid } from 'uuid';
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
          gate.sequenceOrder === 1 ? GateStatus.PENDING : GateStatus.LOCKED;
        await this.projectGateModel.create({
          id: uuid(),
          projectId,
          gateDefinitionId: gate.id,
          status,
        } as any);
      }
    }
  }

  /** Full ordered list of every gate + its live status for a project. */
  async listProjectGates(projectId: string): Promise<any[]> {
    await this.ensureInitialized(projectId);

    const rows = await this.projectGateModel.findAll({
      where: { projectId },
      include: [{ model: GateDefinition }],
    });

    return rows
      .sort(
        (a, b) =>
          a.gateDefinition.sequenceOrder - b.gateDefinition.sequenceOrder,
      )
      .map((pg) => ({
        gateCode: pg.gateDefinition.code,
        gateName: pg.gateDefinition.name,
        sequenceOrder: pg.gateDefinition.sequenceOrder,
        progressThresholdPct: pg.gateDefinition.progressThresholdPct,
        triggerCondition: pg.gateDefinition.triggerCondition,
        handoffBetween: pg.gateDefinition.handoffBetween,
        status: pg.status,
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
      where: { code: gateCode },
      include: [{ model: GateCondition }],
    });
    if (!gate) throw new GateNotFoundException(gateCode);

    const previousGate = await this.gateDefinitionModel.findOne({
      where: { sequenceOrder: gate.sequenceOrder - 1 },
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
      const evaluator = this.conditionRegistry.resolve(condition.type);
      results.push(await evaluator.evaluate(projectId, condition));
    }

    const requiredResults = results.filter((r) => !r.optional);
    const optionalResults = results.filter((r) => r.optional);

    const requiredConditionsPassed = requiredResults.every((r) => r.passed);
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

    // Keep PENDING/READY in sync with the live evaluation so list views stay accurate
    // between explicit clears, without ever silently marking something CLEARED.
    if (
      projectGate &&
      projectGate.status !== GateStatus.CLEARED &&
      projectGate.status !== GateStatus.LOCKED
    ) {
      const nextStatus = readiness.isReady
        ? GateStatus.READY
        : GateStatus.PENDING;
      if (nextStatus !== projectGate.status) {
        await projectGate.update({
          status: nextStatus,
          lastReadinessSnapshot: readiness as any,
        });
      } else {
        await projectGate.update({ lastReadinessSnapshot: readiness as any });
      }
    }

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
    const readiness = await this.checkReadiness(projectId, gateCode);

    const gate = await this.gateDefinitionModel.findOne({
      where: { code: gateCode },
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

    return this.sequelize.transaction(async (tx) => {
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
        where: { sequenceOrder: gate.sequenceOrder + 1 },
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
              action: GateTransitionAction.UNLOCKED,
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
        if (phase) updates.currentPhase = (phase as any).code;
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
    await this.ensureInitialized(projectId);

    const gate = await this.gateDefinitionModel.findOne({
      where: { code: gateCode },
    });
    if (!gate) throw new GateNotFoundException(gateCode);

    const downstreamGates = await this.gateDefinitionModel.findAll({
      where: { sequenceOrder: { [Op.gte]: gate.sequenceOrder } },
      order: [['sequenceOrder', 'ASC']],
    });

    await this.sequelize.transaction(async (tx) => {
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
                : GateTransitionAction.UNLOCKED,
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
    const condition = await this.gateConditionModel.findByPk(conditionId);
    if (!condition) throw new Error(`Condition "${conditionId}" not found.`);

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
