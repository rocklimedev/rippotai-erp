import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Project } from '../projects/models/projects.model';
import { Step } from '../process-workflow/models/step.model';
import { Phase } from '../process-workflow/models/phase.model';
import { ProjectStepProgress } from './models/project-step-progress.model';
import { Team } from './models/team.model';
import {
  UpdateStepProgressDto,
  SignOffStepDto,
} from '../process-workflow/dto/tracking.dto';
import {
  StepStatus,
  PhaseStatus,
} from '../../common/enums/process-workflow.enums';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(Step) private stepModel: typeof Step,
    @InjectModel(Phase) private phaseModel: typeof Phase,
    @InjectModel(ProjectStepProgress)
    private progressModel: typeof ProjectStepProgress,
    @InjectModel(Team) private teamModel: typeof Team,
  ) {}

  /** Ensures a project has a progress row (NOT_STARTED) for every active step in the library. */
  async initializeProjectProgress(projectId: number): Promise<void> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const steps = await this.stepModel.findAll({ where: { isActive: true } });
    for (const step of steps) {
      await this.progressModel.findOrCreate({
        where: { projectId, stepId: step.id },
        defaults: {
          projectId,
          stepId: step.id,
          status: StepStatus.NOT_STARTED,
        } as any,
      });
    }
  }

  async updateStepProgress(
    projectId: number,
    stepId: number,
    dto: UpdateStepProgressDto,
  ): Promise<ProjectStepProgress> {
    const [progress] = await this.progressModel.findOrCreate({
      where: { projectId, stepId },
      defaults: { projectId, stepId, status: StepStatus.NOT_STARTED } as any,
    });

    if (dto.assigneeTeamId) {
      const team = await this.teamModel.findByPk(dto.assigneeTeamId);
      if (!team)
        throw new NotFoundException(`Team ${dto.assigneeTeamId} not found`);
    }

    const patch: Partial<ProjectStepProgress> = { ...(dto as any) };

    if (dto.status === StepStatus.IN_PROGRESS && !progress.actualStartDate) {
      patch.actualStartDate = new Date();
    }
    if (dto.status === StepStatus.COMPLETED && !progress.actualCompletionDate) {
      patch.actualCompletionDate = new Date();
    }
    if (dto.status !== StepStatus.BLOCKED) {
      patch.blockedReason = null;
    }

    await progress.update(patch as any);
    return progress;
  }

  async signOffStep(
    projectId: number,
    stepId: number,
    dto: SignOffStepDto,
  ): Promise<ProjectStepProgress> {
    const progress = await this.progressModel.findOne({
      where: { projectId, stepId },
    });
    if (!progress)
      throw new NotFoundException(
        'Progress record not found for this project/step',
      );
    if (progress.status !== StepStatus.COMPLETED) {
      throw new BadRequestException(
        'Step must be COMPLETED before it can be signed off',
      );
    }
    await progress.update({
      signedOffBy: dto.signedOffBy,
      signedOffAt: new Date(),
    } as any);
    return progress;
  }

  /** Step-level progress for a project, grouped by phase, in phase/step order. */
  async getProjectProgress(projectId: number) {
    const phases = await this.phaseModel.findAll({
      order: [['order', 'ASC']],
      include: [
        {
          model: this.stepModel,
          separate: true,
          order: [['order', 'ASC']],
          include: [
            {
              model: this.progressModel,
              where: { projectId },
              required: false,
              include: [this.teamModel],
            },
          ],
        },
      ],
    });

    return phases.map((phase) => {
      const steps = phase.steps ?? [];
      const statuses = steps.map(
        (s) => s.progressEntries?.[0]?.status ?? StepStatus.NOT_STARTED,
      );
      return {
        phaseId: phase.id,
        phaseName: phase.name,
        phaseCode: phase.code,
        trackType: phase.trackType,
        phaseStatus: this.rollUpPhaseStatus(statuses),
        steps: steps.map((step) => ({
          stepId: step.id,
          stepCode: step.code,
          stepName: step.name,
          isGate: step.isGate,
          gateName: step.gateName,
          progress: step.progressEntries?.[0] ?? null,
        })),
      };
    });
  }

  /** Derives a phase-level status from its steps' statuses. */
  private rollUpPhaseStatus(statuses: StepStatus[]): PhaseStatus {
    if (statuses.length === 0) return PhaseStatus.NOT_STARTED;
    if (statuses.every((s) => s === StepStatus.COMPLETED))
      return PhaseStatus.COMPLETED;
    if (statuses.some((s) => s === StepStatus.BLOCKED))
      return PhaseStatus.BLOCKED;
    if (
      statuses.some(
        (s) => s === StepStatus.IN_PROGRESS || s === StepStatus.COMPLETED,
      )
    ) {
      return PhaseStatus.IN_PROGRESS;
    }
    return PhaseStatus.NOT_STARTED;
  }
}
