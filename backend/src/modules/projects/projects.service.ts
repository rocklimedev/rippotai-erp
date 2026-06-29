import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { Project } from './models/projects.model';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectStatus } from '../../common/enums';
import { ActivityLogForProjectService } from '../engagement/services/activity-log-project.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project)
    private readonly projectModel: typeof Project,
    private readonly activityLogForProjectService: ActivityLogForProjectService,
  ) {}

  // =========================
  // CREATE PROJECT
  // =========================
  async create(dto: CreateProjectDto, user?: any): Promise<Project> {
    const project = await this.projectModel.create({ ...dto } as any);

    try {
      await this.activityLogForProjectService.logProjectCreated(project, user);
    } catch (err) {
      console.error('AUDIT LOG FAILED:', err);
    }

    return project;
  }

  // =========================
  // GET ALL
  // =========================
  findAll(filters: { status?: ProjectStatus; includeArchived?: boolean } = {}) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (!filters.includeArchived) where.archived_at = { [Op.is]: null };

    return this.projectModel.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  // =========================
  // FIND ONE
  // =========================
  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel.findByPk(id);

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: string, dto: UpdateProjectDto, user?: any) {
    const project = await this.findOne(id);

    await project.update({ ...dto });

    await this.activityLogForProjectService.logProjectUpdated(
      project,
      user,
      dto,
    );

    return project;
  }

  // =========================
  // ARCHIVE
  // =========================
  async archive(id: string, user?: any) {
    const project = await this.findOne(id);

    await project.update({
      archived_at: new Date(),
      status: ProjectStatus.INACTIVE,
    });

    await this.activityLogForProjectService.logProjectArchived(project, user);

    return project;
  }

  // =========================
  // RESTORE
  // =========================
  async restore(id: string, user?: any) {
    const project = await this.findOne(id);

    await project.update({
      archived_at: null,
      status: ProjectStatus.ACTIVE,
    });

    await this.activityLogForProjectService.logProjectRestored(project, user);

    return project;
  }

  // =========================
  // DELETE
  // =========================
  async remove(id: string, user?: any): Promise<void> {
    const project = await this.findOne(id);

    await this.activityLogForProjectService.logProjectDeleted(project.id, user);

    await project.destroy();
  }
}
