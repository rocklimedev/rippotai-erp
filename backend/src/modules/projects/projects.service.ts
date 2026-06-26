import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Project } from './models/projects.model';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectStatus } from '../../common/enums';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project)
    private readonly projectModel: typeof Project,
  ) {}

  create(dto: CreateProjectDto): Promise<Project> {
    return this.projectModel.create({ ...dto } as any);
  }

  findAll(
    filters: { status?: ProjectStatus; includeArchived?: boolean } = {},
  ): Promise<Project[]> {
    const where: Record<string, any> = {};
    if (filters.status) where.status = filters.status;
    if (!filters.includeArchived) where.archived_at = { [Op.is]: null };

    return this.projectModel.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel.findByPk(id, {
      include: ['creator', 'updater'],
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    await project.update({ ...dto });
    return project;
  }

  async archive(id: string, archived_by?: string): Promise<Project> {
    const project = await this.findOne(id);
    await project.update({
      archived_at: new Date(),
      archived_by,
      status: ProjectStatus.INACTIVE,
    });
    return project;
  }

  async restore(id: string): Promise<Project> {
    const project = await this.findOne(id);
    await project.update({
      archived_at: null,
      archived_by: null,
      status: ProjectStatus.ACTIVE,
    });
    return project;
  }

  /** Recompute the denormalized quotation_count / approved_value rollups. */
  async refreshRollups(
    id: string,
    quotation_count: number,
    approved_value: number,
  ): Promise<void> {
    await this.projectModel.update(
      { quotation_count, approved_value },
      { where: { id } },
    );
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await project.destroy();
  }
}
