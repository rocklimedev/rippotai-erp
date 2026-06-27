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
  ) {
    console.log(
      'ActivityLogForProjectService injected:',
      !!this.activityLogForProjectService,
    );
  }
  // =========================
  // CREATE PROJECT
  // =========================
  async create(dto: CreateProjectDto, userId?: string): Promise<Project> {
    console.log('➡️ CREATE PROJECT STARTED');
    console.log('DTO:', dto);
    console.log('UserId:', userId);

    const project = await this.projectModel.create({ ...dto } as any);

    console.log('✅ PROJECT CREATED:', project.id);

    try {
      console.log('📌 TRIGGERING AUDIT LOG...');

      await this.activityLogForProjectService.logProjectCreated(
        project,
        userId,
      );

      console.log('✅ AUDIT LOG SUCCESS');
    } catch (err) {
      console.error('❌ AUDIT LOG FAILED:', err);
    }

    console.log('🏁 CREATE PROJECT END');

    return project;
  }
  // =========================
  // GET ALL PROJECTS
  // =========================
  findAll(
    filters: { status?: ProjectStatus; includeArchived?: boolean } = {},
  ): Promise<Project[]> {
    const where: Record<string, any> = {};

    if (filters.status) where.status = filters.status;
    if (!filters.includeArchived) {
      where.archived_at = { [Op.is]: null };
    }

    return this.projectModel.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  // =========================
  // GET SINGLE PROJECT
  // =========================
  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel.findByPk(id, {
      include: ['creator', 'updater'],
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  // =========================
  // UPDATE PROJECT
  // =========================
  async update(
    id: string,
    dto: UpdateProjectDto,
    userId?: string,
  ): Promise<Project> {
    const project = await this.findOne(id);

    const changes = { ...dto };

    await project.update({ ...dto });

    await this.activityLogForProjectService.logProjectUpdated(
      project,
      userId,
      changes,
    );

    return project;
  }

  // =========================
  // ARCHIVE PROJECT
  // =========================
  async archive(id: string, userId?: string): Promise<Project> {
    const project = await this.findOne(id);

    await project.update({
      archived_at: new Date(),
      status: ProjectStatus.INACTIVE,
    });

    await this.activityLogForProjectService.logProjectArchived(project, userId);

    return project;
  }

  // =========================
  // RESTORE PROJECT
  // =========================
  async restore(id: string, userId?: string): Promise<Project> {
    const project = await this.findOne(id);

    await project.update({
      archived_at: null,
      status: ProjectStatus.ACTIVE,
    });

    await this.activityLogForProjectService.logProjectRestored(project, userId);

    return project;
  }

  // =========================
  // ROLLUPS UPDATE
  // =========================
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

  // =========================
  // DELETE PROJECT
  // =========================
  async remove(id: string, userId?: string): Promise<void> {
    const project = await this.findOne(id);

    await this.activityLogForProjectService.logProjectDeleted(id, userId);

    await project.destroy();
  }
}
