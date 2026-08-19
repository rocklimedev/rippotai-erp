import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GateLog } from './models/gate-log.model';
import { Step } from './models/step.model';
import { Project } from '../projects/models/projects.model';
import { ProjectStepProgress } from './models/project-step-progress.model';
import { Team } from './models/team.model';
import { LogGateDto } from './dto/tracking.dto';
import { StepStatus } from '../../common/enums/process-workflow.enums';

@Injectable()
export class GateService {
  constructor(
    @InjectModel(GateLog) private gateLogModel: typeof GateLog,
    @InjectModel(Step) private stepModel: typeof Step,
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(ProjectStepProgress)
    private progressModel: typeof ProjectStepProgress,
    @InjectModel(Team) private teamModel: typeof Team,
  ) {}

  /** Logs a hard gate as achieved for a project: timestamp + approver, and marks the step COMPLETED. */
  async logGate(dto: LogGateDto): Promise<GateLog> {
    const project = await this.projectModel.findByPk(dto.projectId);
    if (!project)
      throw new NotFoundException(`Project ${dto.projectId} not found`);

    const step = await this.stepModel.findByPk(dto.stepId);
    if (!step) throw new NotFoundException(`Step ${dto.stepId} not found`);
    if (!step.isGate)
      throw new BadRequestException(
        `Step '${step.name}' is not marked as a gate`,
      );

    if (dto.approverTeamId) {
      const team = await this.teamModel.findByPk(dto.approverTeamId);
      if (!team)
        throw new NotFoundException(`Team ${dto.approverTeamId} not found`);
    }

    const gateLog = await this.gateLogModel.create({
      projectId: dto.projectId,
      stepId: dto.stepId,
      gateName: step.gateName ?? step.name,
      achievedAt: dto.achievedAt ? new Date(dto.achievedAt) : new Date(),
      approverTeamId: dto.approverTeamId ?? null,
      approverName: dto.approverName,
      notes: dto.notes ?? null,
    } as any);

    // Achieving the gate implicitly completes and signs off the underlying step.
    const [progress] = await this.progressModel.findOrCreate({
      where: { projectId: dto.projectId, stepId: dto.stepId },
      defaults: {
        projectId: dto.projectId,
        stepId: dto.stepId,
        status: StepStatus.NOT_STARTED,
      } as any,
    });
    await progress.update({
      status: StepStatus.COMPLETED,
      actualCompletionDate: gateLog.achievedAt,
      signedOffBy: dto.approverName,
      signedOffAt: gateLog.achievedAt,
    } as any);

    return gateLog;
  }

  async getGateHistory(projectId: number): Promise<GateLog[]> {
    return this.gateLogModel.findAll({
      where: { projectId },
      include: [{ model: this.stepModel }, { model: this.teamModel }],
      order: [['achievedAt', 'ASC']],
    });
  }

  /** All gates in the library vs which ones a project has cleared, in phase/step order. */
  async getGateChecklist(projectId: number) {
    const gateSteps = await this.stepModel.findAll({
      where: { isGate: true },
      order: [['order', 'ASC']],
    });
    const achieved = await this.gateLogModel.findAll({ where: { projectId } });
    const achievedByStep = new Map(achieved.map((g) => [g.stepId, g]));

    return gateSteps.map((step) => ({
      stepId: step.id,
      gateName: step.gateName ?? step.name,
      achieved: achievedByStep.has(step.id),
      achievedAt: achievedByStep.get(step.id)?.achievedAt ?? null,
      approverName: achievedByStep.get(step.id)?.approverName ?? null,
    }));
  }
}
