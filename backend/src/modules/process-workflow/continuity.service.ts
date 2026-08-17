import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ContinuityRole } from './models/continuity-role.model';
import { Project } from './models/project.model';
import { Team } from './models/team.model';
import { Step } from './models/step.model';
import { CreateContinuityRoleDto } from './dto/tracking.dto';
import { ContinuityType } from '../../common/enums/process-workflow.enums';

@Injectable()
export class ContinuityService {
  constructor(
    @InjectModel(ContinuityRole) private continuityModel: typeof ContinuityRole,
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(Team) private teamModel: typeof Team,
    @InjectModel(Step) private stepModel: typeof Step,
  ) {}

  async createRole(dto: CreateContinuityRoleDto): Promise<ContinuityRole> {
    const project = await this.projectModel.findByPk(dto.projectId);
    if (!project)
      throw new NotFoundException(`Project ${dto.projectId} not found`);

    const team = await this.teamModel.findByPk(dto.teamId);
    if (!team) throw new NotFoundException(`Team ${dto.teamId} not found`);

    if (dto.continuityType === ContinuityType.GATE_BOUND) {
      if (dto.opensAtStepId) await this.assertStepExists(dto.opensAtStepId);
      if (dto.closesAtStepId) await this.assertStepExists(dto.closesAtStepId);
    }

    return this.continuityModel.create({ ...dto } as any);
  }

  async markOpened(id: number): Promise<ContinuityRole> {
    const role = await this.getOrThrow(id);
    await role.update({ actualOpenedAt: new Date() } as any);
    return role;
  }

  async markClosed(id: number): Promise<ContinuityRole> {
    const role = await this.getOrThrow(id);
    await role.update({ actualClosedAt: new Date() } as any);
    return role;
  }

  /** Continuous roles (run end-to-end) vs gate-bound roles (open/close at gates), for a project. */
  async getProjectRoleMap(projectId: number) {
    const roles = await this.continuityModel.findAll({
      where: { projectId },
      include: [
        this.teamModel,
        { model: this.stepModel, as: 'opensAtStep' },
        { model: this.stepModel, as: 'closesAtStep' },
      ],
    });

    return {
      continuous: roles.filter(
        (r) => r.continuityType === ContinuityType.CONTINUOUS,
      ),
      gateBound: roles.filter(
        (r) => r.continuityType === ContinuityType.GATE_BOUND,
      ),
    };
  }

  private async getOrThrow(id: number): Promise<ContinuityRole> {
    const role = await this.continuityModel.findByPk(id);
    if (!role) throw new NotFoundException(`Continuity role ${id} not found`);
    return role;
  }

  private async assertStepExists(stepId: number): Promise<void> {
    const step = await this.stepModel.findByPk(stepId);
    if (!step) throw new NotFoundException(`Step ${stepId} not found`);
  }
}
