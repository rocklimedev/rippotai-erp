import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { Quotation } from '@/modules/quotations/models/quotations.model';
import { Project } from './models/projects.model';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectStatus } from '../../common/enums';
import { ActivityLogForProjectService } from '../engagement/services/activity-log-project.service';
import { NotificationForProjectService } from '../engagement/services/notification-project.service';
import { Vendor } from '../vendors/models/vendors.model';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project)
    private readonly projectModel: typeof Project,
    private readonly activityLogForProjectService: ActivityLogForProjectService,
    private readonly notificationForProjectService: NotificationForProjectService,
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

    if (user?.id) {
      try {
        await this.notificationForProjectService.notifyProjectCreated(
          project,
          user.id,
        );
      } catch (err) {
        console.error('NOTIFICATION FAILED:', err);
      }
    }

    return project;
  }
  // =========================
  // GET ALL
  // =========================
  findAll(
    filters: {
      status?: ProjectStatus;
      includeArchived?: boolean;
      includeDeleted?: boolean;
    } = {},
  ) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (!filters.includeArchived) where.archived_at = { [Op.is]: null };

    return this.projectModel.findAll({
      where,

      subQuery: false,

      attributes: {
        // Drop the stale stored columns so they don't collide with
        // (or shadow) the live-computed literals below.
        exclude: ['quotation_count', 'approved_value'],

        include: [
          // QUOTATION COUNT
          [
            literal(`(
            SELECT COUNT(*)
            FROM quotations q
            WHERE q.project_id = Project.id
            AND q.deleted_at IS NULL
          )`),
            'quotation_count',
          ],

          // TOTAL QUOTATIONS
          [
            literal(`(
            SELECT COALESCE(SUM(q.total_amount), 0)
            FROM quotations q
            WHERE q.project_id = Project.id
            AND q.deleted_at IS NULL
          )`),
            'quotation_total',
          ],

          // APPROVED ONLY
          [
            literal(`(
            SELECT COALESCE(SUM(q.total_amount), 0)
            FROM quotations q
            WHERE q.project_id = Project.id
            AND q.status = 'approved'
            AND q.deleted_at IS NULL
          )`),
            'approved_value',
          ],
        ],
      },

      include: [
        {
          model: Quotation,
          as: 'quotations',
          required: false,
          attributes: [], // only for relation existence, not aggregation
        },
      ],

      paranoid: !filters.includeDeleted,
      order: [['created_at', 'DESC']],
    });
  }
  // =========================
  // FIND ONE
  // =========================
  async findOne(id: string, includeDeleted = false): Promise<Project> {
    const project = await this.projectModel.findByPk(id, {
      subQuery: false,

      attributes: {
        include: [
          [
            fn('COALESCE', fn('SUM', col('quotations.total_amount')), 0),
            'quotation_total',
          ],
          [
            fn(
              'COALESCE',
              fn(
                'SUM',
                literal(`CASE 
                WHEN quotations.status = 'approved' 
                THEN quotations.total_amount 
                ELSE 0 
              END`),
              ),
              0,
            ),
            'approved_value',
          ],
        ],
      },

      include: [
        {
          model: Quotation,
          attributes: [
            'id',
            'quotationNumber',
            'status',
            'quotationDate',
            'totalAmount',
            'subtotal',
            'taxAmount',
            'vendorId',
          ],
          required: false,

          include: [
            {
              model: Vendor,
              attributes: [
                'id',
                'name',
                'company_name',
                'contact_number',
                'alternate_contact',
                'address',
                'status',
                'notes',
              ],
              include: [
                {
                  association: 'vendorCategory',
                  attributes: ['id', 'name'],
                },
                {
                  association: 'businessType',
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
        },
      ],

      group: ['Project.id', 'quotations.id', 'quotations->vendor.id'],
      paranoid: !includeDeleted,
    });

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

    if (user?.id) {
      try {
        await this.notificationForProjectService.notifyProjectUpdated(
          project,
          user.id,
        );
      } catch (err) {
        console.error('NOTIFICATION FAILED:', err);
      }
    }

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

    if (user?.id) {
      try {
        await this.notificationForProjectService.notifyProjectArchived(
          project,
          user.id,
        );
      } catch (err) {
        console.error('NOTIFICATION FAILED:', err);
      }
    }

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

    if (user?.id) {
      try {
        await this.notificationForProjectService.notifyProjectRestored(
          project,
          user.id,
        );
      } catch (err) {
        console.error('NOTIFICATION FAILED:', err);
      }
    }

    return project;
  }

  // =========================
  // DELETE (Soft Delete)
  // =========================
  async remove(id: string, user?: any): Promise<void> {
    const project = await this.findOne(id);
    const projectName = project.name; // capture before destroy wipes access

    try {
      await this.activityLogForProjectService.logProjectDeleted(
        project.id,
        user,
      );
    } catch (err) {
      console.error('AUDIT LOG FAILED:', err);
    }

    await project.update({
      deleted_by: user?.id ?? null,
      status: ProjectStatus.INACTIVE,
    });

    await project.destroy(); // sets deleted_at automatically

    if (user?.id) {
      try {
        await this.notificationForProjectService.notifyProjectDeleted(
          projectName,
          user.id,
        );
      } catch (err) {
        console.error('NOTIFICATION FAILED:', err);
      }
    }
  }
}
