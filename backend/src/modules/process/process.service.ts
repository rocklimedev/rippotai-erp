// process.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { ProcessPhase } from './models/process-phase.model';
import { ProcessStep } from './models/process-step.model';
import { DeliverableType } from './models/deliverable-type.model';
import { ProjectPhaseProgress } from './models/project-phase-progress.model';
import { ProjectStepProgress } from './models/project-step-progress.model';
import { ProjectGateLog } from './models/project-gate-log.model';
import { ProcessStepTeam } from './models/process-step-team.model';
import { ProcessStepDeliverable } from './models/process-step-deliverable.model';

import { CreateProcessPhaseDto } from './dto/create-project-phase.dto';
import { UpdateProcessPhaseDto } from './dto/update-project-phase.dto';
import { CreateProcessStepDto } from './dto/create-process-step.dto';
import { UpdateProcessStepDto } from './dto/update-process-step.dto';
import { CreateDeliverableTypeDto } from './dto/create-deliverable-type.dto';
import { UpdateProjectStepProgressDto } from './dto/update-project-step-progress.dto';
import { CreateProjectGateLogDto } from './dto/create-project-gate-log.dto';
type StepProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'skipped';

interface BulkStepProgressUpdate {
  stepId: string;
  status?: StepProgressStatus;
  remarks?: string;
  assignee_id?: string | null;
  due_date?: string | null;
}
@Injectable()
export class ProcessService {
  constructor(
    @InjectModel(ProcessPhase)
    private readonly processPhaseModel: typeof ProcessPhase,
    @InjectModel(ProcessStep)
    private readonly processStepModel: typeof ProcessStep,
    @InjectModel(DeliverableType)
    private readonly deliverableTypeModel: typeof DeliverableType,
    @InjectModel(ProjectPhaseProgress)
    private readonly projectPhaseProgressModel: typeof ProjectPhaseProgress,
    @InjectModel(ProjectStepProgress)
    private readonly projectStepProgressModel: typeof ProjectStepProgress,
    @InjectModel(ProjectGateLog)
    private readonly projectGateLogModel: typeof ProjectGateLog,
    @InjectModel(ProcessStepTeam)
    private readonly processStepTeamModel: typeof ProcessStepTeam,
    @InjectModel(ProcessStepDeliverable)
    private readonly processStepDeliverableModel: typeof ProcessStepDeliverable,
    private readonly sequelize: Sequelize,
  ) {}

  // ============================================================
  // 1. PROCESS PHASES
  // ============================================================

  async createPhase(dto: CreateProcessPhaseDto): Promise<ProcessPhase> {
    return this.processPhaseModel.create(dto as any);
  }

  async findAllPhases(includeSteps = true): Promise<ProcessPhase[]> {
    return this.processPhaseModel.findAll({
      order: [
        ['sort_order', 'ASC'],
        ['phase_no', 'ASC'],
      ],
      include: includeSteps
        ? [
            {
              model: this.processStepModel,
              as: 'steps',
              order: [['sort_order', 'ASC']],
            },
            'leadTeam',
          ]
        : ['leadTeam'],
    });
  }

  async findPhaseById(id: string): Promise<ProcessPhase> {
    const phase = await this.processPhaseModel.findByPk(id, {
      include: [
        {
          model: this.processStepModel,
          as: 'steps',
          include: ['teams', 'deliverables'],
        },
        'leadTeam',
      ],
    });
    if (!phase) throw new NotFoundException(`Phase ${id} not found`);
    return phase;
  }

  async findPhaseByNo(phaseNo: string): Promise<ProcessPhase> {
    const phase = await this.processPhaseModel.findOne({
      where: { phase_no: phaseNo },
      include: [{ model: this.processStepModel, as: 'steps' }],
    });
    if (!phase) throw new NotFoundException(`Phase ${phaseNo} not found`);
    return phase;
  }

  async updatePhase(
    id: string,
    dto: UpdateProcessPhaseDto,
  ): Promise<ProcessPhase> {
    const phase = await this.findPhaseById(id);
    await phase.update(dto);
    return phase.reload();
  }

  async deletePhase(id: string): Promise<void> {
    const phase = await this.findPhaseById(id);
    await phase.destroy();
  }

  async reorderPhases(orderedIds: string[]): Promise<ProcessPhase[]> {
    const transaction = await this.sequelize.transaction();
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await this.processPhaseModel.update(
          { sort_order: i + 1 },
          { where: { id: orderedIds[i] }, transaction },
        );
      }
      await transaction.commit();
      return this.findAllPhases(false);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  // ============================================================
  // 2. PROCESS STEPS
  // ============================================================

  async createStep(dto: CreateProcessStepDto): Promise<ProcessStep> {
    return this.processStepModel.create(dto as any);
  }

  async findStepsByPhase(phaseId: string): Promise<ProcessStep[]> {
    return this.processStepModel.findAll({
      where: { phase_id: phaseId },
      order: [['sort_order', 'ASC']],
      include: ['teams', 'deliverables', 'phase'],
    });
  }

  async findStepById(id: string): Promise<ProcessStep> {
    const step = await this.processStepModel.findByPk(id, {
      include: ['phase', 'teams', 'deliverables'],
    });
    if (!step) throw new NotFoundException(`Step ${id} not found`);
    return step;
  }

  async updateStep(
    id: string,
    dto: UpdateProcessStepDto,
  ): Promise<ProcessStep> {
    const step = await this.findStepById(id);
    await step.update(dto);
    return step.reload();
  }

  async deleteStep(id: string): Promise<void> {
    const step = await this.findStepById(id);
    await step.destroy();
  }

  async reorderSteps(
    phaseId: string,
    orderedIds: string[],
  ): Promise<ProcessStep[]> {
    const transaction = await this.sequelize.transaction();
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await this.processStepModel.update(
          { sort_order: i + 1 },
          { where: { id: orderedIds[i], phase_id: phaseId }, transaction },
        );
      }
      await transaction.commit();
      return this.findStepsByPhase(phaseId);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  // Assign / remove teams from a step
  async setStepTeams(stepId: string, teamIds: string[]): Promise<ProcessStep> {
    const step = await this.findStepById(stepId);
    await this.processStepTeamModel.destroy({ where: { step_id: stepId } });

    if (teamIds.length) {
      await this.processStepTeamModel.bulkCreate(
        teamIds.map((team_id) => ({ step_id: stepId, team_id })),
      );
    }
    return this.findStepById(stepId);
  }

  // Assign / remove deliverable types from a step
  async setStepDeliverables(
    stepId: string,
    deliverableTypeIds: string[],
  ): Promise<ProcessStep> {
    await this.findStepById(stepId); // existence check
    await this.processStepDeliverableModel.destroy({
      where: { step_id: stepId },
    });

    if (deliverableTypeIds.length) {
      await this.processStepDeliverableModel.bulkCreate(
        deliverableTypeIds.map((deliverable_type_id) => ({
          step_id: stepId,
          deliverable_type_id,
        })),
      );
    }
    return this.findStepById(stepId);
  }

  // ============================================================
  // 3. DELIVERABLE TYPES
  // ============================================================

  async createDeliverableType(
    dto: CreateDeliverableTypeDto,
  ): Promise<DeliverableType> {
    return this.deliverableTypeModel.create(dto as any);
  }

  async findAllDeliverableTypes(): Promise<DeliverableType[]> {
    return this.deliverableTypeModel.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findDeliverableTypeById(id: string): Promise<DeliverableType> {
    const item = await this.deliverableTypeModel.findByPk(id);
    if (!item) throw new NotFoundException(`Deliverable type ${id} not found`);
    return item;
  }

  async updateDeliverableType(
    id: string,
    name: string,
  ): Promise<DeliverableType> {
    const item = await this.findDeliverableTypeById(id);
    await item.update({ name });
    return item;
  }

  async deleteDeliverableType(id: string): Promise<void> {
    const item = await this.findDeliverableTypeById(id);
    await item.destroy();
  }

  // ============================================================
  // 4. PROJECT PHASE PROGRESS
  // ============================================================

  async getPhaseProgress(
    projectId: string,
    phaseId: string,
  ): Promise<ProjectPhaseProgress> {
    const [progress] = await this.projectPhaseProgressModel.findOrCreate({
      where: { project_id: projectId, phase_id: phaseId },
      defaults: {
        project_id: projectId,
        phase_id: phaseId,
        status: 'not_started',
      },
    });
    return progress;
  }

  async getAllPhaseProgress(
    projectId: string,
  ): Promise<ProjectPhaseProgress[]> {
    return this.projectPhaseProgressModel.findAll({
      where: { project_id: projectId },
      include: ['phase'],
      order: [[{ model: ProcessPhase, as: 'phase' }, 'sort_order', 'ASC']],
    });
  }

  async updatePhaseProgress(
    projectId: string,
    phaseId: string,
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped',
  ): Promise<ProjectPhaseProgress> {
    const progress = await this.getPhaseProgress(projectId, phaseId);

    const updateData: Partial<ProjectPhaseProgress> = { status };

    if (status === 'in_progress' && !progress.started_at) {
      updateData.started_at = new Date();
    }
    if (status === 'completed') {
      updateData.completed_at = new Date();
    }
    if (status === 'not_started') {
      updateData.started_at = null;
      updateData.completed_at = null;
    }

    await progress.update(updateData);
    return progress.reload();
  }

  // ============================================================
  // 5. PROJECT STEP PROGRESS  (Trade-level + Work Package)
  // ============================================================

  async getStepProgress(
    projectId: string,
    stepId: string,
  ): Promise<ProjectStepProgress> {
    const [progress] = await this.projectStepProgressModel.findOrCreate({
      where: {
        project_id: projectId,
        step_id: stepId,
      },
      defaults: {
        project_id: projectId,
        step_id: stepId,
        status: 'not_started',
      },
    });

    return progress;
  }
  async getStepsProgressByPhase(
    projectId: string,
    phaseId: string,
  ): Promise<ProjectStepProgress[]> {
    const steps = await this.processStepModel.findAll({
      where: { phase_id: phaseId },
      attributes: ['id'],
    });
    const stepIds = steps.map((s) => s.id);

    return this.projectStepProgressModel.findAll({
      where: {
        project_id: projectId,
        step_id: { [Op.in]: stepIds },
      },
      include: [
        {
          model: this.processStepModel,
          as: 'step',
          include: ['teams'],
        },
      ],
    });
  }

  /**
   * Trade-level progress update
   * Example: Electrical 20 → 60 → 95 → 100%
   * We store the percentage via remarks or you can extend the model
   * with a `pct_complete` column later.
   */
  async updateStepProgress(
    projectId: string,
    stepId: string,
    data: UpdateProjectStepProgressDto,
  ): Promise<ProjectStepProgress> {
    const progress = await this.getStepProgress(projectId, stepId);

    // Continuous Quality Gate enforcement
    if (data.status === 'in_progress' || data.status === 'completed') {
      await this.enforceQualityGate(projectId, stepId);
    }

    const updateData: any = { ...data };

    if (data.status === 'in_progress' && !progress.started_at) {
      updateData.started_at = new Date();
    }
    if (data.status === 'completed') {
      updateData.completed_at = new Date();
    }

    await progress.update(updateData);
    return progress.reload({ include: ['step', 'assignee', 'signedOffBy'] });
  }

  /**
   * Bulk update many steps (useful for trade-level dashboards)
   */
  async bulkUpdateStepProgress(
    projectId: string,
    updates: BulkStepProgressUpdate[],
  ): Promise<ProjectStepProgress[]> {
    const results: ProjectStepProgress[] = [];
    const transaction = await this.sequelize.transaction();

    try {
      for (const item of updates) {
        const progress = await this.getStepProgress(projectId, item.stepId);

        await progress.update(
          {
            status: item.status,
            remarks: item.remarks,
            assignee_id: item.assignee_id,
            due_date: item.due_date,
          },
          { transaction },
        );

        results.push(progress);
      }

      await transaction.commit();

      return results;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Work-package view: steps belonging to a specific trade/team
   * with their start/end (due) dates and status
   */
  async getWorkPackagesByTeam(
    projectId: string,
    teamId: string,
  ): Promise<ProjectStepProgress[]> {
    const stepTeams = await this.processStepTeamModel.findAll({
      where: { team_id: teamId },
      attributes: ['step_id'],
    });
    const stepIds = stepTeams.map((st) => st.step_id);

    return this.projectStepProgressModel.findAll({
      where: {
        project_id: projectId,
        step_id: { [Op.in]: stepIds },
      },
      include: [
        {
          model: this.processStepModel,
          as: 'step',
          include: ['phase', 'teams'],
        },
        'assignee',
      ],
      order: [['due_date', 'ASC']],
    });
  }

  // ============================================================
  // 6. CONTINUOUS QUALITY GATE
  // ============================================================

  /**
   * Enforces that the previous gate step has been signed off
   * before allowing the next trade/step to start.
   */
  async enforceQualityGate(
    projectId: string,
    targetStepId: string,
  ): Promise<void> {
    const targetStep = await this.findStepById(targetStepId);

    // Find previous gate steps in the same phase (or overall sequence)
    const previousGates = await this.processStepModel.findAll({
      where: {
        phase_id: targetStep.phase_id,
        is_gate: true,
        sort_order: { [Op.lt]: targetStep.sort_order },
      },
      order: [['sort_order', 'DESC']],
      limit: 1,
    });

    if (!previousGates.length) return; // no previous gate → allowed

    const lastGate = previousGates[0];
    const gateProgress = await this.getStepProgress(projectId, lastGate.id);

    if (gateProgress.status !== 'completed') {
      throw new ForbiddenException(
        `Quality gate "${lastGate.title}" must be completed and signed off before starting this step.`,
      );
    }

    // Optional: also check that a gate log exists
    const gateLog = await this.projectGateLogModel.findOne({
      where: {
        project_id: projectId,
        step_id: lastGate.id,
      },
    });

    if (!gateLog) {
      throw new ForbiddenException(
        `Quality gate "${lastGate.title}" has not been formally signed off.`,
      );
    }
  }

  async logGateCrossing(dto: CreateProjectGateLogDto): Promise<ProjectGateLog> {
    // Ensure the step is actually a gate
    const step = await this.findStepById(dto.step_id);
    if (!step.is_gate) {
      throw new BadRequestException(
        `Step "${step.title}" is not configured as a quality gate.`,
      );
    }

    // Mark the step progress as completed + signed off
    await this.updateStepProgress(dto.project_id, dto.step_id, {
      status: 'completed',
      signed_off_by: dto.crossed_by,
      remarks: dto.remarks,
    });

    return this.projectGateLogModel.create({
      ...dto,
      gate_label: dto.gate_label || step.gate_between || step.title,
      crossed_at: dto.crossed_at || new Date(),
    } as any);
  }

  async getGateHistory(
    projectId: string,
    stepId?: string,
  ): Promise<ProjectGateLog[]> {
    const where: any = { project_id: projectId };
    if (stepId) where.step_id = stepId;

    return this.projectGateLogModel.findAll({
      where,
      include: ['step', 'crossedBy'],
      order: [['crossed_at', 'DESC']],
    });
  }

  // ============================================================
  // 7. DASHBOARD / AGGREGATION HELPERS
  // ============================================================

  /**
   * Overall project progress summary
   */
  async getProjectProgressSummary(projectId: string) {
    const phases = await this.findAllPhases(true);
    const phaseProgress = await this.getAllPhaseProgress(projectId);

    const summary = await Promise.all(
      phases.map(async (phase) => {
        const pp = phaseProgress.find((p) => p.phase_id === phase.id);
        const stepProgressList = await this.getStepsProgressByPhase(
          projectId,
          phase.id,
        );

        const totalSteps = stepProgressList.length;
        const completedSteps = stepProgressList.filter(
          (s) => s.status === 'completed',
        ).length;
        const inProgressSteps = stepProgressList.filter(
          (s) => s.status === 'in_progress',
        ).length;
        const blockedSteps = stepProgressList.filter(
          (s) => s.status === 'blocked',
        ).length;

        return {
          phase_id: phase.id,
          phase_no: phase.phase_no,
          title: phase.title,
          status: pp?.status || 'not_started',
          started_at: pp?.started_at,
          completed_at: pp?.completed_at,
          total_steps: totalSteps,
          completed_steps: completedSteps,
          in_progress_steps: inProgressSteps,
          blocked_steps: blockedSteps,
          completion_pct:
            totalSteps > 0
              ? Math.round((completedSteps / totalSteps) * 100)
              : 0,
        };
      }),
    );

    return {
      project_id: projectId,
      phases: summary,
      overall_completion_pct:
        summary.length > 0
          ? Math.round(
              summary.reduce((acc, p) => acc + p.completion_pct, 0) /
                summary.length,
            )
          : 0,
    };
  }

  /**
   * Trade-level progress view (Execution Tracking style)
   * Returns each trade's steps with status + remarks (can hold % values)
   */
  async getTradeLevelProgress(projectId: string, teamId: string) {
    const packages = await this.getWorkPackagesByTeam(projectId, teamId);

    return packages.map((p) => ({
      step_id: p.step_id,
      step_title: p.step?.title,
      step_no: p.step?.step_no,
      phase: p.step?.phase?.title,
      status: p.status,
      due_date: p.due_date,
      started_at: p.started_at,
      completed_at: p.completed_at,
      remarks: p.remarks, // e.g. "60%" or detailed note
      assignee: p.assignee,
      is_gate: p.step?.is_gate,
    }));
  }
}
