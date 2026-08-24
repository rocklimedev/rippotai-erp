import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Phase } from './models/phase.model';
import { Step } from './models/step.model';
import { Team } from './models/team.model';
import { StepTeam } from './models/step-team.model';
import { Deliverable } from './models/deliverable.model';
import {
  CreatePhaseDto,
  UpdatePhaseDto,
  CreateStepDto,
  UpdateStepDto,
  CreateDeliverableDto,
  AssignStepTeamDto,
} from './dto/library.dto';
import {
  ResponsibilityType,
  TrackType,
} from '../../common/enums/process-workflow.enums';

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(Phase) private phaseModel: typeof Phase,
    @InjectModel(Step) private stepModel: typeof Step,
    @InjectModel(Team) private teamModel: typeof Team,
    @InjectModel(StepTeam) private stepTeamModel: typeof StepTeam,
    @InjectModel(Deliverable) private deliverableModel: typeof Deliverable,
  ) {}

  // ---------- Phases ----------

  async createPhase(dto: CreatePhaseDto): Promise<Phase> {
    const existing = await this.phaseModel.findOne({
      where: { code: dto.code },
    });
    if (existing)
      throw new ConflictException(`Phase code '${dto.code}' already exists`);
    return this.phaseModel.create({ ...dto } as any);
  }

  async updatePhase(id: number, dto: UpdatePhaseDto): Promise<Phase> {
    const phase = await this.getPhaseOrThrow(id);
    await phase.update(dto as any);
    return phase;
  }

  async getPhaseOrThrow(id: number): Promise<Phase> {
    const phase = await this.phaseModel.findByPk(id);
    if (!phase) throw new NotFoundException(`Phase ${id} not found`);
    return phase;
  }

  /** Full phase & step library, grouped by track, in display order — the master process brain. */
  async getFullLibrary(trackType?: TrackType) {
    const where = trackType ? { trackType } : {};
    const phases = await this.phaseModel.findAll({
      where,
      order: [['order', 'ASC']],
      include: [
        {
          model: this.stepModel,
          separate: true,
          order: [['order', 'ASC']],
          include: [
            { model: this.deliverableModel },
            {
              model: this.stepTeamModel,
              include: [{ model: this.teamModel }],
            },
          ],
        },
      ],
    });
    return phases;
  }

  // ---------- Steps ----------

  async createStep(dto: CreateStepDto): Promise<Step> {
    await this.getPhaseOrThrow(dto.phaseId);
    const existing = await this.stepModel.findOne({
      where: { code: dto.code },
    });
    if (existing)
      throw new ConflictException(`Step code '${dto.code}' already exists`);
    return this.stepModel.create({ ...dto } as any);
  }

  async updateStep(id: number, dto: UpdateStepDto): Promise<Step> {
    const step = await this.getStepOrThrow(id);
    await step.update(dto as any);
    return step;
  }

  async getStepOrThrow(id: number): Promise<Step> {
    const step = await this.stepModel.findByPk(id, {
      include: [
        { model: this.deliverableModel },
        { model: this.stepTeamModel, include: [this.teamModel] },
      ],
    });
    if (!step) throw new NotFoundException(`Step ${id} not found`);
    return step;
  }

  async listGateSteps(): Promise<Step[]> {
    return this.stepModel.findAll({
      where: { isGate: true },
      include: [{ model: this.phaseModel }],
      order: [
        [{ model: this.phaseModel, as: 'phase' }, 'order', 'ASC'],
        ['order', 'ASC'],
      ],
    });
  }

  // ---------- Deliverable catalogue ----------

  async addDeliverable(dto: CreateDeliverableDto): Promise<Deliverable> {
    await this.getStepOrThrow(dto.stepId);
    return this.deliverableModel.create({ ...dto } as any);
  }

  async listDeliverablesForStep(stepId: number): Promise<Deliverable[]> {
    return this.deliverableModel.findAll({ where: { stepId } });
  }

  // ---------- Team responsibility mapping ----------

  async assignTeamToStep(dto: AssignStepTeamDto): Promise<StepTeam> {
    await this.getStepOrThrow(dto.stepId);
    const team = await this.teamModel.findByPk(dto.teamId);
    if (!team) throw new NotFoundException(`Team ${dto.teamId} not found`);

    const [assignment] = await this.stepTeamModel.findOrCreate({
      where: {
        stepId: dto.stepId,
        teamId: dto.teamId,
        responsibilityType:
          (dto.responsibilityType as ResponsibilityType) ??
          ResponsibilityType.OWNER,
      },
      defaults: { ...dto } as any,
    });
    return assignment;
  }

  async removeTeamFromStep(stepTeamId: number): Promise<void> {
    const assignment = await this.stepTeamModel.findByPk(stepTeamId);
    if (!assignment)
      throw new NotFoundException(
        `Step-team assignment ${stepTeamId} not found`,
      );
    await assignment.destroy();
  }

  async listTeamsForStep(stepId: number): Promise<StepTeam[]> {
    return this.stepTeamModel.findAll({
      where: { stepId },
      include: [this.teamModel],
    });
  }

  async listStepsForTeam(teamId: number): Promise<StepTeam[]> {
    return this.stepTeamModel.findAll({
      where: { teamId },
      include: [{ model: this.stepModel, include: [this.phaseModel] }],
    });
  }
}
