import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal, WhereOptions } from 'sequelize';
import { Quotation } from '@/modules/quotations/models/quotations.model';
import { Project } from './models/projects.model';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectStatus } from '../../common/enums';
import { ActivityLogForProjectService } from '../engagement/services/activity-log-project.service';
import { NotificationForProjectService } from '../engagement/services/notification-project.service';
import { Vendor } from '../vendors/models/vendors.model';
import { ClientsService } from '../clients/clients.service';
import { User } from '@/modules/users/models/user.model';
@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project)
    private readonly projectModel: typeof Project,
    private readonly activityLogForProjectService: ActivityLogForProjectService,
    private readonly notificationForProjectService: NotificationForProjectService,
    private readonly clientsService: ClientsService,
  ) {}
  private slugify(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = this.slugify(name);
    let slug = base;
    let suffix = 1;

    while (true) {
      const existing = await this.projectModel.findOne({ where: { slug } });
      if (!existing || existing.id === excludeId) break;
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    return slug;
  }

  // =========================
  // CREATE PROJECT
  // =========================
  async create(dto: CreateProjectDto, user?: User): Promise<Project> {
    if (dto.client_id) {
      const clientExists = await this.clientsService.exists(dto.client_id);
      if (!clientExists) {
        throw new NotFoundException(`Client ${dto.client_id} not found`);
      }
    }

    const slug = await this.generateUniqueSlug(dto.name);

    const project = await this.projectModel.create({
      ...dto,
      slug,
      created_by: user?.id ?? null,
    } as any);

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
      client_id?: string;
    } = {},
  ) {
    const where: WhereOptions<Project> = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.client_id) {
      where.client_id = filters.client_id;
    }

    if (!filters.includeArchived) {
      where.archived_at = { [Op.is]: null };
    }

    return this.projectModel.findAll({
      where,

      subQuery: false,

      attributes: {
        exclude: ['quotation_count', 'approved_value'],

        include: [
          [
            literal(`(
            SELECT COUNT(*)
            FROM quotations q
            WHERE q.project_id = Project.id
            AND q.deleted_at IS NULL
          )`),
            'quotation_count',
          ],

          [
            literal(`(
            SELECT COALESCE(SUM(q.total_amount), 0)
            FROM quotations q
            WHERE q.project_id = Project.id
            AND q.deleted_at IS NULL
          )`),
            'quotation_total',
          ],

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
          attributes: [],
        },
        {
          association: 'client',
          attributes: [
            'id',
            'name',
            'slug',
            'contact_person',
            'email',
            'phone',
          ],
          required: false,
        },
        {
          association: 'project_type',
          attributes: ['id', 'name', 'slug'],
          required: false,
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
                { association: 'vendorCategory', attributes: ['id', 'name'] },
                { association: 'businessType', attributes: ['id', 'name'] },
              ],
            },
          ],
        },
        {
          association: 'client',
          attributes: [
            'id',
            'name',
            'slug',
            'contact_person',
            'email',
            'phone',
            'address',
          ],
          required: false,
        },
        {
          association: 'project_type',
          attributes: ['id', 'name', 'slug', 'description'],
          required: false,
        },
        {
          association: 'creator',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          association: 'updater',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          association: 'archiver',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],

      group: [
        'Project.id',
        'quotations.id',
        'quotations->vendor.id',
        'client.id',
        'project_type.id',
        'creator.id',
        'updater.id',
        'archiver.id',
      ],
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
  async update(id: string, dto: UpdateProjectDto, user?: User) {
    const project = await this.findOne(id);

    if (dto.client_id) {
      const clientExists = await this.clientsService.exists(dto.client_id);
      if (!clientExists) {
        throw new NotFoundException(`Client ${dto.client_id} not found`);
      }
    }

    const updateData: Partial<Project> = {
      ...dto,
      updated_by: user?.id ?? project.updated_by,
      expected_completion_date: dto.expected_completion_date
        ? new Date(dto.expected_completion_date)
        : undefined,
    };

    await project.update(updateData);
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
  async archive(id: string, user?: User) {
    const project = await this.findOne(id);

    await project.update({
      archived_at: new Date(),
      archived_by: user?.id ?? null,
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
  async restore(id: string, user?: User) {
    const project = await this.findOne(id, true);

    await project.update({
      archived_at: null,
      archived_by: null,
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
  async remove(id: string, user?: User): Promise<void> {
    const project = await this.findOne(id);
    const projectName = project.name;

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

    await project.destroy();

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
