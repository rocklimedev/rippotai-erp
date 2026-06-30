import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { fn, col, literal } from 'sequelize';
import { Quotation } from '@/modules/quotations/models/quotations.model';
import { Project } from './models/projects.model';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectStatus } from '../../common/enums';
import { ActivityLogForProjectService } from '../engagement/services/activity-log-project.service';
import { Vendor } from '../vendors/models/vendors.model';
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

      attributes: {
        include: [
          // TOTAL QUOTATION VALUE
          [
            fn('COALESCE', fn('SUM', col('quotations.total_amount')), 0),
            'quotation_total',
          ],

          // APPROVED VALUE ONLY
          [
            fn(
              'COALESCE',
              fn(
                'SUM',
                literal(
                  `CASE WHEN quotations.status = 'approved' THEN quotations.total_amount ELSE 0 END`,
                ),
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
          attributes: [],
          required: false,
        },
      ],

      group: ['Project.id'],
      paranoid: !filters.includeDeleted,
      order: [['created_at', 'DESC']],
    });
  }

  // =========================
  // FIND ONE
  // =========================
  async findOne(id: string, includeDeleted = false): Promise<Project> {
    const project = await this.projectModel.findByPk(id, {
      attributes: {
        include: [
          // TOTAL QUOTATION VALUE
          [
            fn('COALESCE', fn('SUM', col('quotations.total_amount')), 0),
            'quotation_total',
          ],

          // APPROVED VALUE ONLY
          [
            fn(
              'COALESCE',
              fn(
                'SUM',
                literal(
                  `CASE WHEN quotations.status = 'approved' THEN quotations.total_amount ELSE 0 END`,
                ),
              ),
              0,
            ),
            'approved_value',
          ],
        ],
      },

      include: [
        // =========================
        // QUOTATIONS (LIGHT VERSION)
        // =========================
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
        },

        // =========================
        // VENDOR (FULL RELATIONS)
        // =========================
        {
          model: Quotation,
          attributes: [],
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

      group: ['Project.id'],
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
  // DELETE (Soft Delete)
  // =========================
  // =========================
  // DELETE (Soft Delete)
  // =========================
  async remove(id: string, user?: any): Promise<void> {
    const project = await this.findOne(id);

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
  }
}
