import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EXECUTION_PHASE, executionWorkFor } from './execution-work';
import { col, fn, Op, Transaction, where, WhereOptions } from 'sequelize';
import { ConflictException } from '@nestjs/common';
import { Project } from './models/projects.model';
import { normalizeGoogleMapsUrl } from '@/common/google-maps-url';
import {
  CreateProjectDto,
  CreateProjectTeamMemberDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectStatus } from '../../common/enums';

import { ActivityLogForProjectService } from '../engagement/services/activity-log-project.service';
import { NotificationForProjectService } from '../engagement/services/notification-project.service';
import { ClientsService } from '../clients/clients.service';

import { User } from '@/modules/users/models/user.model';
import { Role } from '@/modules/rbac/models/role.model';
import { TeamMember } from '../users/models/team-member.model';
import { TeamMemberOwnerType } from '@/common/enums/team.enums';
const normalizeRole = (label?: string | null) =>
  (label ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

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

    @InjectModel(User)
    private readonly userModel: typeof User,
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

    const { team_members, google_maps_url, ...projectData } = dto;
    const mapsUrl = normalizeGoogleMapsUrl(google_maps_url);

    // ============================================================
    // CREATE PROJECT
    // ============================================================

    const members = team_members ?? [];
    if (
      members.filter(
        (member) => normalizeRole(member.role_label) === 'principal architect',
      ).length > 1
    ) {
      throw new ConflictException(
        'A project can have only one Principal Architect',
      );
    }

    const project = await this.projectModel.sequelize!.transaction(
      async (transaction) => {
        const created = await this.projectModel.create(
          {
            ...projectData,
            ...(google_maps_url !== undefined && { google_maps_url: mapsUrl }),
            slug,
            created_by: user?.id ?? null,
          } as any,
          { transaction },
        );

        for (const [index, member] of members.entries()) {
          await this.createTeamAssignment(
            created.id,
            { ...member, sort_order: member.sort_order ?? index },
            user,
            transaction,
          );
        }
        return created;
      },
    );

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
  async findAll(
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

    const projects = await this.projectModel.findAll({
      where,

      subQuery: false,

      include: [
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
    await this.attachExecutionWork(projects);
    return projects;
  }

  /** Projects in Execution carry the Build-planner work going on (execution_work). */
  private async attachExecutionWork(projects: Project[]) {
    const ids = projects
      .filter((p) => p.current_phase === EXECUTION_PHASE)
      .map((p) => p.id);
    if (!ids.length) return;
    try {
      const work = await executionWorkFor(this.projectModel.sequelize!, ids);
      projects.forEach((p) => {
        const w = work.get(p.id);
        if (w) p.setDataValue('execution_work' as keyof Project, w);
      });
    } catch {
      /* the list still works without it */
    }
  }

  // =========================
  // FIND ONE
  // =========================
  async findOne(id: string, includeDeleted = false): Promise<Project> {
    const project = await this.projectModel.findByPk(id, {
      subQuery: false,

      include: [
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
    await this.attachExecutionWork([project]);

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
      ...(dto.google_maps_url !== undefined && {
        google_maps_url: normalizeGoogleMapsUrl(dto.google_maps_url),
      }),
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
            'role_label',
            'is_active',
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

  async getDocumentPeople(projectId: string) {
    const members = (await this.getTeam(projectId)).filter(
      (member) => member.user?.is_active,
    );
    const pick = (matches: (member: TeamMember) => boolean) =>
      members.find((member) => member.is_primary && matches(member)) ||
      members.find(matches);
    const byLabel = (label: string) =>
      pick((member) => normalizeRole(member.role_label) === label) ||
      pick((member) => normalizeRole(member.user.role_label) === label);

    const principal = byLabel('principal architect');
    const lead =
      byLabel('project lead') ||
      pick((member) =>
        /project (manager|lead)|project head/i.test(member.role_label ?? ''),
      );

    let architect = principal?.user.name;
    if (!architect) {
      const defaults = await this.userModel.findAll({
        attributes: ['name'],
        where: {
          is_active: true,
          [Op.and]: where(
            fn('LOWER', col('role_label')),
            'principal architect',
          ),
        },
        limit: 2,
      });
      if (defaults.length === 1) architect = defaults[0].name;
    }
    architect ||= (
      pick((member) =>
        /principal/i.test(
          `${member.role_label ?? ''} ${member.user.job_title ?? ''}`,
        ),
      ) || pick((member) => /architect/i.test(member.role_label ?? ''))
    )?.user.name;

    return { architect: architect ?? '', lead: lead?.user.name ?? '' };
  }

  // =========================
  // ADD PROJECT TEAM MEMBER
  // =========================
  async addTeamMember(
    projectId: string,
    dto: CreateProjectTeamMemberDto,
    currentUser?: User,
  ) {
    return this.projectModel.sequelize!.transaction(async (transaction) => {
      await this.lockProjectTeam(projectId, transaction);
      return this.createTeamAssignment(
        projectId,
        dto,
        currentUser,
        transaction,
      );
    });
  }

  private async lockProjectTeam(projectId: string, transaction: Transaction) {
    const project = await this.projectModel.findByPk(projectId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!project) throw new NotFoundException('Project not found');
  }

  private async assertAvailablePrincipal(
    projectId: string,
    roleLabel: string | null,
    transaction: Transaction,
    except?: string,
  ) {
    if (normalizeRole(roleLabel) !== 'principal architect') return;
    const members = await this.teamMemberModel.findAll({
      where: { owner_type: TeamMemberOwnerType.PROJECT, owner_id: projectId },
      attributes: ['id', 'role_label'],
      transaction,
    });
    if (
      members.some(
        (member) =>
          member.id !== except &&
          normalizeRole(member.role_label) === 'principal architect',
      )
    ) {
      throw new ConflictException(
        'A project can have only one Principal Architect',
      );
    }
  }

  private async createTeamAssignment(
    projectId: string,
    dto: CreateProjectTeamMemberDto,
    actor: User | undefined,
    transaction: Transaction,
  ): Promise<TeamMember> {
    const person = await this.userModel.findByPk(dto.user_id, {
      include: [Role],
      transaction,
    });
    if (!person?.is_active || person.role?.name?.toUpperCase() === 'CLIENT') {
      throw new NotFoundException(
        'Choose an active staff user for the project team',
      );
    }
    const role = normalizeRole(dto.role_label);
    const roleLabel =
      role === 'principal architect'
        ? 'Principal Architect'
        : role === 'project lead'
          ? 'Project Lead'
          : dto.role_label;
    await this.assertAvailablePrincipal(projectId, roleLabel, transaction);

    const membership = await this.teamMemberModel.findOne({
      where: {
        user_id: dto.user_id,
        [Op.or]: [
          { owner_type: null, owner_id: null },
          { owner_type: TeamMemberOwnerType.TEAM, owner_id: { [Op.ne]: null } },
        ],
      },
      transaction,
    });
    if (
      !membership &&
      role !== 'principal architect' &&
      role !== 'project lead'
    ) {
      throw new NotFoundException(
        person.name + ' is not assigned to an admin team',
      );
    }

    const assignment = {
      owner_type: TeamMemberOwnerType.PROJECT,
      owner_id: projectId,
      role_label: roleLabel,
    };
    const existing = await this.teamMemberModel.findOne({
      where: { ...assignment, user_id: dto.user_id },
      transaction,
    });
    if (existing)
      throw new ConflictException(
        person.name + ' already has this project role',
      );

    if (dto.is_primary) {
      await this.teamMemberModel.update(
        { is_primary: false },
        {
          where: { ...assignment, is_primary: true },
          transaction,
        },
      );
    }
    return this.teamMemberModel.create(
      {
        ...assignment,
        team_id: membership?.team_id ?? null,
        user_id: dto.user_id,
        is_primary: dto.is_primary ?? false,
        sort_order: dto.sort_order ?? 0,
        created_by: actor?.id ?? null,
      },
      { transaction },
    );
  }

  async updateTeamMember(
    projectId: string,
    teamMemberId: string,
    dto: { role_label?: string; is_primary?: boolean; sort_order?: number },
  ): Promise<TeamMember> {
    return this.projectModel.sequelize!.transaction(async (transaction) => {
      await this.lockProjectTeam(projectId, transaction);
      const assignment = {
        owner_type: TeamMemberOwnerType.PROJECT,
        owner_id: projectId,
      };
      const member = await this.teamMemberModel.findOne({
        where: { ...assignment, id: teamMemberId },
        transaction,
      });
      if (!member) throw new NotFoundException('Project team member not found');

      const roleLabel = dto.role_label ?? member.role_label;
      if (dto.role_label !== undefined) {
        await this.assertAvailablePrincipal(
          projectId,
          roleLabel,
          transaction,
          teamMemberId,
        );
      }
      if (dto.is_primary === true) {
        await this.teamMemberModel.update(
          { is_primary: false },
          {
            where: {
              ...assignment,
              role_label: roleLabel,
              is_primary: true,
              id: { [Op.ne]: teamMemberId },
            },
            transaction,
          },
        );
      }
      return member.update(dto, { transaction });
    });
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
