import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal, WhereOptions } from 'sequelize';
import { ConflictException } from '@nestjs/common';
import { Quotation } from '@/modules/quotations/models/quotations.model';
import { Project } from './models/projects.model';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectStatus } from '../../common/enums';

import { ActivityLogForProjectService } from '../engagement/services/activity-log-project.service';
import { NotificationForProjectService } from '../engagement/services/notification-project.service';
import { ClientsService } from '../clients/clients.service';

import { User } from '@/modules/users/models/user.model';
import { Role } from '@/modules/rbac/models/role.model';
import { Vendor } from '../vendors/models/vendors.model';
import { TeamMember } from '../users/models/team-member.model';
import { TeamMemberOwnerType } from '@/common/enums/team.enums';
@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project)
    private readonly projectModel: typeof Project,

    @InjectModel(TeamMember)
    private readonly teamMemberModel: typeof TeamMember,

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
    // ============================================================
    // VALIDATE CLIENT
    // ============================================================

    if (dto.client_id) {
      const clientExists = await this.clientsService.exists(dto.client_id);

      if (!clientExists) {
        throw new NotFoundException(`Client ${dto.client_id} not found`);
      }
    }

    // ============================================================
    // GENERATE SLUG
    // ============================================================

    const slug = await this.generateUniqueSlug(dto.name);

    // ============================================================
    // STRIP TEAM MEMBERS FROM PROJECT PAYLOAD
    // ============================================================

    const { team_members, ...projectData } = dto;

    // ============================================================
    // CREATE PROJECT
    // ============================================================

    const project = await this.projectModel.create({
      ...projectData,
      slug,
      created_by: user?.id ?? null,
    } as any);

    // ============================================================
    // CREATE PROJECT TEAM ASSIGNMENTS
    // ============================================================

    if (team_members?.length) {
      for (const [index, member] of team_members.entries()) {
        // --------------------------------------------------------
        // Find the user's actual team membership
        // --------------------------------------------------------

        const teamMembership = await this.teamMemberModel.findOne({
          where: {
            user_id: member.user_id,

            // Only look at actual team memberships
            // rather than project assignments.
            owner_type: TeamMemberOwnerType.TEAM,
            owner_id: {
              [Op.ne]: null,
            },
          },
        });

        if (!teamMembership) {
          throw new NotFoundException(
            `User ${member.user_id} is not assigned to a team`,
          );
        }

        // --------------------------------------------------------
        // Prevent duplicate project assignment
        // --------------------------------------------------------

        const existing = await this.teamMemberModel.findOne({
          where: {
            owner_type: TeamMemberOwnerType.PROJECT,
            owner_id: project.id,
            user_id: member.user_id,
            role_label: member.role_label,
          },
        });

        if (existing) {
          continue;
        }

        // --------------------------------------------------------
        // Only one primary member per project + role
        // --------------------------------------------------------

        if (member.is_primary) {
          await this.teamMemberModel.update(
            {
              is_primary: false,
            },
            {
              where: {
                owner_type: TeamMemberOwnerType.PROJECT,
                owner_id: project.id,
                role_label: member.role_label,
                is_primary: true,
              },
            },
          );
        }

        // --------------------------------------------------------
        // Create project assignment
        // --------------------------------------------------------

        await this.teamMemberModel.create({
          team_id: teamMembership.team_id,

          owner_type: TeamMemberOwnerType.PROJECT,
          owner_id: project.id,

          user_id: member.user_id,

          role_label: member.role_label,

          is_primary: member.is_primary ?? false,

          sort_order: member.sort_order ?? index,

          created_by: user?.id ?? null,
        });
      }
    }

    // ============================================================
    // ACTIVITY LOG
    // ============================================================

    await this.activityLogForProjectService.logProjectCreated(project, user);

    // ============================================================
    // NOTIFICATION
    // ============================================================

    await this.notificationForProjectService.notifyProjectCreated(
      project,
      user?.id,
    );

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

    // ============================================
    // LOAD PROJECT TEAM
    // ============================================

    const teamMembers = await this.teamMemberModel.findAll({
      where: {
        owner_type: TeamMemberOwnerType.PROJECT,
        owner_id: project.id,
      },

      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'name',
            'email',
            'phone',
            'job_title',
            'avatar_url',
            'role_id',
          ],

          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'description'],
            },
          ],
        },
      ],

      order: [
        ['sort_order', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });

    // Attach team to project response
    project.setDataValue('team_members', teamMembers);

    return project;
  }

  // =========================
  // UPDATE
  // =========================
  async update(
    id: string,
    dto: UpdateProjectDto,
    user?: User,
  ): Promise<Project> {
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

    // Log Activity & Send Notification
    await this.activityLogForProjectService.logProjectUpdated(
      project,
      user,
      dto,
    );

    await this.notificationForProjectService.notifyProjectUpdated(
      project,
      user?.id,
    );

    return project;
  }

  // =========================
  // ARCHIVE
  // =========================
  async archive(id: string, user?: User): Promise<Project> {
    const project = await this.findOne(id);

    await project.update({
      archived_at: new Date(),
      archived_by: user?.id ?? null,
      status: ProjectStatus.INACTIVE,
    });

    // Log Activity & Send Notification
    await this.activityLogForProjectService.logProjectArchived(project, user);
    await this.notificationForProjectService.notifyProjectArchived(
      project,
      user?.id,
    );

    return project;
  }

  // =========================
  // RESTORE
  // =========================
  async restore(id: string, user?: User): Promise<Project> {
    const project = await this.findOne(id, true);

    await project.update({
      archived_at: null,
      archived_by: null,
      status: ProjectStatus.ACTIVE,
    });

    // Log Activity & Send Notification
    await this.activityLogForProjectService.logProjectRestored(project, user);
    await this.notificationForProjectService.notifyProjectRestored(
      project,
      user?.id,
    );

    return project;
  }

  // =========================
  // DELETE (Soft Delete)
  // =========================
  async remove(id: string, user?: User): Promise<void> {
    const project = await this.findOne(id);
    const projectName = project.name;

    await project.update({
      deleted_by: user?.id ?? null,
      status: ProjectStatus.INACTIVE,
    });

    await project.destroy();

    // Log Activity & Send Notification
    await this.activityLogForProjectService.logProjectDeleted(id, user);
    await this.notificationForProjectService.notifyProjectDeleted(
      projectName,
      user?.id,
    );
  }

  // =========================
  // GET PROJECT TEAM
  // =========================
  async getTeam(projectId: string): Promise<TeamMember[]> {
    const project = await this.projectModel.findByPk(projectId);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    return this.teamMemberModel.findAll({
      where: {
        owner_type: TeamMemberOwnerType.PROJECT,
        owner_id: projectId,
      },

      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'name',
            'email',
            'phone',
            'job_title',
            'avatar_url',
            'role_id',
          ],

          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'description'],
            },
          ],
        },
      ],

      order: [
        ['sort_order', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });
  }

  // =========================
  // ADD PROJECT TEAM MEMBER
  // =========================
  async addTeamMember(
    projectId: string,
    dto: {
      user_id: string;
      role_label: string;
      is_primary?: boolean;
      sort_order?: number;
    },
    currentUser?: User,
  ): Promise<TeamMember> {
    // ============================================================
    // VALIDATE PROJECT
    // ============================================================

    const project = await this.projectModel.findByPk(projectId);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // ============================================================
    // VALIDATE USER
    // ============================================================

    const targetUser = await User.findByPk(dto.user_id);

    if (!targetUser) {
      throw new NotFoundException(`User ${dto.user_id} not found`);
    }

    // ============================================================
    // FIND ACTUAL TEAM MEMBERSHIP
    // ============================================================
    //
    // A PROJECT assignment must inherit the team_id from the
    // user's actual TEAM membership.
    //
    // Do NOT create a project assignment without team_id because
    // team_id is required by the TeamMember model/database.
    //
    // ============================================================

    const teamMembership = await this.teamMemberModel.findOne({
      where: {
        user_id: dto.user_id,

        // Only the user's real admin/team membership.
        // Project assignments must NOT be used here.
        owner_type: TeamMemberOwnerType.TEAM,

        owner_id: {
          [Op.ne]: null,
        },
      },
    });

    if (!teamMembership) {
      throw new NotFoundException(
        `${targetUser.name} is not assigned to an admin team`,
      );
    }

    // ============================================================
    // CHECK EXISTING PROJECT ASSIGNMENT
    // ============================================================

    const existing = await this.teamMemberModel.findOne({
      where: {
        owner_type: TeamMemberOwnerType.PROJECT,
        owner_id: projectId,
        user_id: dto.user_id,
        role_label: dto.role_label,
      },
    });

    if (existing) {
      throw new ConflictException(
        `${targetUser.name} is already assigned to this project with the role "${dto.role_label}"`,
      );
    }

    // ============================================================
    // ONLY ONE PRIMARY MEMBER PER PROJECT + ROLE
    // ============================================================

    if (dto.is_primary) {
      await this.teamMemberModel.update(
        {
          is_primary: false,
        },
        {
          where: {
            owner_type: TeamMemberOwnerType.PROJECT,
            owner_id: projectId,
            role_label: dto.role_label,
            is_primary: true,
          },
        },
      );
    }

    // ============================================================
    // CREATE PROJECT ASSIGNMENT
    // ============================================================

    return this.teamMemberModel.create({
      // IMPORTANT:
      // Project member inherits team_id from the user's actual
      // TEAM membership.
      team_id: teamMembership.team_id,

      owner_type: TeamMemberOwnerType.PROJECT,
      owner_id: projectId,

      user_id: dto.user_id,

      role_label: dto.role_label,

      is_primary: dto.is_primary ?? false,

      sort_order: dto.sort_order ?? 0,

      created_by: currentUser?.id ?? null,
    });
  }

  // =========================
  // UPDATE PROJECT TEAM MEMBER
  // =========================
  async updateTeamMember(
    projectId: string,
    teamMemberId: string,
    dto: {
      role_label?: string;
      is_primary?: boolean;
      sort_order?: number;
    },
  ): Promise<TeamMember> {
    const member = await this.teamMemberModel.findOne({
      where: {
        id: teamMemberId,
        owner_type: TeamMemberOwnerType.PROJECT,
        owner_id: projectId,
      },
    });

    if (!member) {
      throw new NotFoundException(
        `Project team member ${teamMemberId} not found`,
      );
    }

    const newRoleLabel = dto.role_label ?? member.role_label;

    if (dto.is_primary === true) {
      await this.teamMemberModel.update(
        {
          is_primary: false,
        },
        {
          where: {
            owner_type: TeamMemberOwnerType.PROJECT,
            owner_id: projectId,
            role_label: newRoleLabel,
            is_primary: true,
            id: {
              [Op.ne]: teamMemberId,
            },
          },
        },
      );
    }

    await member.update({
      ...dto,
    });

    return member;
  }

  // =========================
  // REMOVE PROJECT TEAM MEMBER
  // =========================
  async removeTeamMember(
    projectId: string,
    teamMemberId: string,
  ): Promise<void> {
    const member = await this.teamMemberModel.findOne({
      where: {
        id: teamMemberId,
        owner_type: TeamMemberOwnerType.PROJECT,
        owner_id: projectId,
      },
    });

    if (!member) {
      throw new NotFoundException(
        `Project team member ${teamMemberId} not found`,
      );
    }

    await member.destroy();
  }
}
