import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { Op, Transaction } from 'sequelize';

import { TeamMember } from '../users/models/team-member.model';
import { User } from '../users/models/user.model';

import { Team } from './models/team.model';
import { TeamSection } from './models/team-sections.model';
import { TeamSectionAccess } from './models/team-section-access.model';

import { TeamMemberOwnerType } from '@/common/enums/team.enums';

import { AddTeamMemberDto, UpdateTeamMemberDto } from './dto/team.dto';

import {
  CreateTeamDto,
  UpdateTeamDto,
  CreateTeamSectionDto,
  UpdateTeamSectionDto,
  SetTeamSectionAccessDto,
  BulkTeamSectionAccessDto,
} from './dto/team.dto';

import { TeamAccessLevel } from '@/common/enums/team.enums';

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,

    @InjectModel(Team)
    private readonly teamModel: typeof Team,

    @InjectModel(TeamMember)
    private readonly teamMemberModel: typeof TeamMember,

    @InjectModel(TeamSection)
    private readonly teamSectionModel: typeof TeamSection,

    @InjectModel(TeamSectionAccess)
    private readonly teamSectionAccessModel: typeof TeamSectionAccess,
  ) {}

  // ============================================================
  // EXISTING OWNER-SCOPED TEAM SYSTEM
  // ============================================================
  //
  // Used by:
  //
  //   PROJECT
  //   PLAN_OF_ACTION
  //   QUOTATION
  //   BOQ
  //   etc.
  //
  // These methods MUST continue using:
  //
  //   owner_type
  //   owner_id
  //
  // Do not replace these with team_id.
  //
  // ============================================================

  async list(ownerType: TeamMemberOwnerType, ownerId: string) {
    return this.teamMemberModel.findAll({
      where: {
        owner_type: ownerType,
        owner_id: ownerId,
      },

      order: [
        ['sort_order', 'ASC'],
        ['created_at', 'ASC'],
      ],

      include: [
        {
          association: 'user',
        },
      ],
    });
  }

  async add(
    ownerType: TeamMemberOwnerType,
    ownerId: string,
    dto: AddTeamMemberDto,
    actingUserId?: string,
    transaction?: Transaction,
  ) {
    await this.ensureUserExists(dto.user_id, transaction);

    const existing = await this.teamMemberModel.findOne({
      where: {
        owner_type: ownerType,
        owner_id: ownerId,
        user_id: dto.user_id,
      },

      transaction,
    });

    if (existing) {
      throw new ConflictException('User is already a member of this team');
    }

    if (dto.is_primary) {
      await this.teamMemberModel.update(
        {
          is_primary: false,
        },

        {
          where: {
            owner_type: ownerType,
            owner_id: ownerId,
          },

          transaction,
        },
      );
    }

    return this.teamMemberModel.create(
      {
        owner_type: ownerType,
        owner_id: ownerId,

        // This is null for old owner-scoped memberships
        // unless the caller explicitly connects it to an
        // Admin Team.
        team_id: null,

        user_id: dto.user_id,

        role_label: dto.role_label ?? null,

        is_primary: dto.is_primary ?? false,

        sort_order: dto.sort_order ?? 0,

        created_by: actingUserId ?? null,
      } as any,

      {
        transaction,
      },
    );
  }

  async replaceAll(
    ownerType: TeamMemberOwnerType,
    ownerId: string,
    members: AddTeamMemberDto[],
    actingUserId?: string,
    transaction?: Transaction,
  ) {
    const trx =
      transaction ?? (await this.teamMemberModel.sequelize!.transaction());

    const ownTransaction = !transaction;

    try {
      for (const member of members) {
        await this.ensureUserExists(member.user_id, trx);
      }

      await this.teamMemberModel.destroy({
        where: {
          owner_type: ownerType,
          owner_id: ownerId,
        },

        transaction: trx,
      });

      if (!members.length) {
        if (ownTransaction) {
          await trx.commit();
        }

        return [];
      }

      const primaryCount = members.filter(
        (member) => member.is_primary === true,
      ).length;

      if (primaryCount > 1) {
        throw new BadRequestException('Only one primary member is allowed');
      }

      const rows = members.map((member, index) => ({
        owner_type: ownerType,
        owner_id: ownerId,

        team_id: null,

        user_id: member.user_id,

        role_label: member.role_label ?? null,

        is_primary: member.is_primary ?? false,

        sort_order: member.sort_order ?? index,

        created_by: actingUserId ?? null,
      }));

      const result = await this.teamMemberModel.bulkCreate(rows as any, {
        transaction: trx,
      });

      if (ownTransaction) {
        await trx.commit();
      }

      return result;
    } catch (error) {
      if (ownTransaction) {
        await trx.rollback();
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateTeamMemberDto) {
    const member = await this.teamMemberModel.findByPk(id);

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    return member.update(dto as any);
  }

  async remove(id: string) {
    const member = await this.teamMemberModel.findByPk(id);

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    await member.destroy();

    return {
      success: true,
      message: 'Team member removed successfully',
    };
  }

  // ============================================================
  // ADMIN TEAM CRUD
  // ============================================================

  async createTeam(dto: CreateTeamDto) {
    const name = dto.name?.trim();

    if (!name) {
      throw new BadRequestException('Team name is required');
    }

    const existing = await this.teamModel.findOne({
      where: {
        name,
      },
    });

    if (existing) {
      throw new ConflictException('A team with this name already exists');
    }

    return this.teamModel.create({
      ...dto,
      name,
    } as any);
  }

  async findAllTeams() {
    return this.teamModel.findAll({
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });
  }

  async getTeamById(teamId: string) {
    const team = await this.teamModel.findByPk(teamId, {
      include: [
        {
          association: 'members',
          include: [
            {
              association: 'user',
            },
          ],
        },
      ],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  async updateTeam(teamId: string, dto: UpdateTeamDto) {
    const team = await this.ensureTeamExists(teamId);

    if (dto.name && dto.name.trim() !== team.name) {
      const existing = await this.teamModel.findOne({
        where: {
          name: dto.name.trim(),
          id: {
            [Op.ne]: teamId,
          },
        },
      });

      if (existing) {
        throw new ConflictException('A team with this name already exists');
      }
    }

    const payload = {
      ...dto,
    } as any;

    if (payload.name) {
      payload.name = payload.name.trim();
    }

    return team.update(payload);
  }

  async activateTeam(teamId: string) {
    const team = await this.ensureTeamExists(teamId);

    return team.update({
      is_active: true,
    } as any);
  }

  async deactivateTeam(teamId: string) {
    const team = await this.ensureTeamExists(teamId);

    return team.update({
      is_active: false,
    } as any);
  }

  async deleteTeam(teamId: string) {
    const team = await this.ensureTeamExists(teamId);

    const transaction = await this.teamModel.sequelize!.transaction();

    try {
      await this.teamSectionAccessModel.destroy({
        where: {
          team_id: teamId,
        },

        transaction,
      });

      await this.teamMemberModel.destroy({
        where: {
          team_id: teamId,
        },

        transaction,
      });

      await team.destroy({
        transaction,
      });

      await transaction.commit();

      return {
        success: true,
        message: 'Team deleted successfully',
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ============================================================
  // ADMIN TEAM MEMBERS
  // ============================================================

  async getTeamMembers(teamId: string) {
    await this.ensureTeamExists(teamId);

    return this.teamMemberModel.findAll({
      where: {
        team_id: teamId,
      },

      order: [
        ['is_primary', 'DESC'],
        ['sort_order', 'ASC'],
        ['created_at', 'ASC'],
      ],

      include: [
        {
          association: 'user',
        },
      ],
    });
  }

  async addTeamMember(
    teamId: string,
    dto: AddTeamMemberDto,
    actingUserId?: string,
  ) {
    await this.ensureTeamExists(teamId);

    await this.ensureUserExists(dto.user_id);

    const existing = await this.teamMemberModel.findOne({
      where: {
        team_id: teamId,
        user_id: dto.user_id,
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this team');
    }

    const transaction = await this.teamMemberModel.sequelize!.transaction();

    try {
      if (dto.is_primary) {
        await this.teamMemberModel.update(
          {
            is_primary: false,
          },

          {
            where: {
              team_id: teamId,
            },

            transaction,
          },
        );
      }

      const member = await this.teamMemberModel.create(
        {
          team_id: teamId,

          // Admin Team membership is not
          // project-owner membership.
          owner_type: TeamMemberOwnerType.TEAM,
          owner_id: teamId,

          user_id: dto.user_id,

          role_label: dto.role_label ?? null,

          is_primary: dto.is_primary ?? false,

          sort_order: dto.sort_order ?? 0,

          created_by: actingUserId ?? null,
        } as any,

        {
          transaction,
        },
      );

      await transaction.commit();

      return this.getTeamMemberById(member.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getTeamMemberById(memberId: string) {
    const member = await this.teamMemberModel.findByPk(memberId, {
      include: [
        {
          association: 'user',
        },
        {
          association: 'team',
        },
      ],
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    return member;
  }

  async updateTeamMember(memberId: string, dto: UpdateTeamMemberDto) {
    const member = await this.teamMemberModel.findByPk(memberId);

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (dto.user_id && dto.user_id !== member.user_id) {
      await this.ensureUserExists(dto.user_id);

      const existing = await this.teamMemberModel.findOne({
        where: {
          team_id: member.team_id,
          user_id: dto.user_id,

          id: {
            [Op.ne]: memberId,
          },
        },
      });

      if (existing) {
        throw new ConflictException('User is already a member of this team');
      }
    }

    const transaction = await this.teamMemberModel.sequelize!.transaction();

    try {
      if (dto.is_primary === true && member.team_id) {
        await this.teamMemberModel.update(
          {
            is_primary: false,
          },

          {
            where: {
              team_id: member.team_id,

              id: {
                [Op.ne]: memberId,
              },
            },

            transaction,
          },
        );
      }

      const updated = await member.update(dto as any, {
        transaction,
      });

      await transaction.commit();

      return updated;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async makeMemberPrimary(memberId: string) {
    const member = await this.teamMemberModel.findByPk(memberId);

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (!member.team_id) {
      throw new BadRequestException(
        'This member is not attached to an Admin Team',
      );
    }

    const transaction = await this.teamMemberModel.sequelize!.transaction();

    try {
      await this.teamMemberModel.update(
        {
          is_primary: false,
        },

        {
          where: {
            team_id: member.team_id,
          },

          transaction,
        },
      );

      await member.update(
        {
          is_primary: true,
        },

        {
          transaction,
        },
      );

      await transaction.commit();

      return member;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async removeTeamMember(memberId: string) {
    const member = await this.teamMemberModel.findByPk(memberId);

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    await member.destroy();

    return {
      success: true,
      message: 'Team member removed successfully',
    };
  }

  // ============================================================
  // TEAM SECTIONS
  // ============================================================
  //
  // Example hierarchy:
  //
  // ERP
  // ├── Projects
  // │   ├── Overview
  // │   ├── Phases
  // │   └── Documents
  // ├── CRM
  // │   ├── Leads
  // │   └── Client Brief
  // ├── Design
  // ├── Materials
  // ├── Site Operations
  // └── Finance
  //
  // ============================================================

  async createSection(dto: CreateTeamSectionDto) {
    const key = dto.key?.trim();

    if (!key) {
      throw new BadRequestException('Section key is required');
    }

    const existing = await this.teamSectionModel.findOne({
      where: {
        key,
      },
    });

    if (existing) {
      throw new ConflictException('A section with this key already exists');
    }

    if (dto.parent_key) {
      await this.ensureParentSectionExists(dto.parent_key);
    }

    return this.teamSectionModel.create({
      ...dto,
      key,
    } as any);
  }

  async findAllSections() {
    return this.teamSectionModel.findAll({
      where: {
        status: 'ACTIVE',
      },

      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });
  }
  async getSectionById(sectionId: string) {
    const section = await this.teamSectionModel.findByPk(sectionId, {
      include: [
        {
          association: 'access',
        },
      ],
    });

    if (!section) {
      throw new NotFoundException('Team section not found');
    }

    return section;
  }

  async updateSection(sectionId: string, dto: UpdateTeamSectionDto) {
    const section = await this.ensureSectionExists(sectionId);

    if (dto.key && dto.key !== section.key) {
      const existing = await this.teamSectionModel.findOne({
        where: {
          key: dto.key,

          id: {
            [Op.ne]: sectionId,
          },
        },
      });

      if (existing) {
        throw new ConflictException('A section with this key already exists');
      }
    }

    if (dto.parent_key !== undefined && dto.parent_key !== null) {
      if (dto.parent_key === section.key) {
        throw new BadRequestException('A section cannot be its own parent');
      }

      await this.ensureParentSectionExists(dto.parent_key);
    }

    return section.update(dto as any);
  }

  async deleteSection(sectionId: string) {
    const section = await this.ensureSectionExists(sectionId);

    const children = await this.teamSectionModel.count({
      where: {
        parent_key: section.key,
      },
    });

    if (children > 0) {
      throw new ConflictException(
        'Cannot delete a section that contains child sections',
      );
    }

    const transaction = await this.teamSectionModel.sequelize!.transaction();

    try {
      await this.teamSectionAccessModel.destroy({
        where: {
          section_id: sectionId,
        },

        transaction,
      });

      await section.destroy({
        transaction,
      });

      await transaction.commit();

      return {
        success: true,
        message: 'Section deleted successfully',
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ============================================================
  // TEAM SECTION ACCESS
  // ============================================================

  async getTeamSectionAccess(teamId: string) {
    await this.ensureTeamExists(teamId);

    return this.teamSectionAccessModel.findAll({
      where: {
        team_id: teamId,
      },

      include: [
        {
          association: 'section',
        },
      ],

      order: [['created_at', 'ASC']],
    });
  }

  async getSectionAccess(teamId: string, sectionId: string) {
    await this.ensureTeamExists(teamId);
    await this.ensureSectionExists(sectionId);

    return this.teamSectionAccessModel.findOne({
      where: {
        team_id: teamId,
        section_id: sectionId,
      },

      include: [
        {
          association: 'section',
        },
      ],
    });
  }

  async setTeamSectionAccess(
    teamId: string,
    sectionId: string,
    dto: SetTeamSectionAccessDto,
  ) {
    await this.ensureTeamExists(teamId);
    await this.ensureSectionExists(sectionId);

    const payload = this.normalizeAccessPayload(dto);

    const [access, created] = await this.teamSectionAccessModel.findOrCreate({
      where: {
        team_id: teamId,
        section_id: sectionId,
      },

      defaults: {
        team_id: teamId,
        section_id: sectionId,

        ...payload,
      } as any,
    });

    if (!created) {
      await access.update(payload as any);
    }

    return access;
  }

  async bulkSetTeamSectionAccess(
    teamId: string,
    dto: BulkTeamSectionAccessDto,
  ) {
    await this.ensureTeamExists(teamId);

    const entries = this.extractBulkAccessEntries(dto);

    if (!entries.length) {
      return [];
    }

    const transaction =
      await this.teamSectionAccessModel.sequelize!.transaction();

    try {
      const results: TeamSectionAccess[] = [];

      for (const entry of entries) {
        await this.ensureSectionExists(entry.section_id, transaction);

        const payload = this.normalizeAccessPayload(entry);

        const [access, created] =
          await this.teamSectionAccessModel.findOrCreate({
            where: {
              team_id: teamId,
              section_id: entry.section_id,
            },

            defaults: {
              team_id: teamId,
              section_id: entry.section_id,

              ...payload,
            } as any,

            transaction,
          });

        if (!created) {
          await access.update(payload as any, {
            transaction,
          });
        }

        results.push(access);
      }

      await transaction.commit();

      return results;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async removeTeamSectionAccess(teamId: string, sectionId: string) {
    await this.ensureTeamExists(teamId);
    await this.ensureSectionExists(sectionId);

    const deleted = await this.teamSectionAccessModel.destroy({
      where: {
        team_id: teamId,
        section_id: sectionId,
      },
    });

    return {
      success: true,
      deleted: deleted > 0,
      message:
        deleted > 0
          ? 'Section access removed successfully'
          : 'No section access record found',
    };
  }

  // ============================================================
  // COMPLETE ACCESS MATRIX
  // ============================================================
  //
  // Returns EVERY active section.
  //
  // If a team has no explicit access record:
  //
  //   access_level = NONE
  //
  // This is ideal for the Admin Console access matrix.
  //
  // ============================================================

  async getTeamAccessMatrix(teamId: string) {
    await this.ensureTeamExists(teamId);

    const sections = await this.teamSectionModel.findAll({
      where: {
        status: 'ACTIVE',
      },

      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    const accessRecords = await this.teamSectionAccessModel.findAll({
      where: {
        team_id: teamId,
      },
    });

    const accessMap = new Map<string, TeamSectionAccess>();

    for (const access of accessRecords) {
      accessMap.set(access.section_id, access);
    }

    return sections.map((section) => {
      const access = accessMap.get(section.id);

      // No explicit access record
      if (!access) {
        return {
          section,
          access: {
            team_id: teamId,
            section_id: section.id,

            access_level: TeamAccessLevel.NONE,

            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
            can_approve: false,

            scope: null,

            exists: false,
          },
        };
      }

      // Existing access record
      return {
        section,
        access: {
          ...access.toJSON(),

          exists: true,
        },
      };
    });
  }

  // ============================================================
  // USER → ADMIN TEAMS
  // ============================================================

  async getUserTeams(userId: string) {
    await this.ensureUserExists(userId);

    return this.teamMemberModel.findAll({
      where: {
        user_id: userId,
      },

      include: [
        {
          association: 'team',
        },
      ],

      order: [
        ['is_primary', 'DESC'],
        ['sort_order', 'ASC'],
      ],
    });
  }

  // ============================================================
  // USER → SECTION ACCESS
  // ============================================================
  //
  // A user can belong to multiple teams.
  //
  // Access is additive.
  //
  // Example:
  //
  // Team A:
  //   CRM = VIEW_ONLY
  //
  // Team B:
  //   CRM = FULL
  //
  // User:
  //   CRM = FULL
  //
  // We calculate the strongest permission across
  // all teams.
  //
  // ============================================================
  async getUserSectionAccess(userId: string, sectionId: string) {
    await this.ensureUserExists(userId);

    await this.ensureSectionExists(sectionId);

    // ============================================================
    // GET USER TEAM MEMBERSHIPS
    // ============================================================

    const memberships = await this.teamMemberModel.findAll({
      where: {
        user_id: userId,
      },

      attributes: ['id', 'team_id'],
    });

    // ============================================================
    // USER HAS NO TEAMS
    // ============================================================

    if (!memberships.length) {
      return {
        user_id: userId,
        section_id: sectionId,

        access_level: TeamAccessLevel.NONE,

        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_approve: false,

        scope: null,

        teams: [],
      };
    }

    // team_id is guaranteed to be a string because TeamMember
    // defines it as allowNull: false.
    const teamIds = memberships.map((member) => member.team_id);

    // ============================================================
    // GET SECTION ACCESS FOR ALL USER TEAMS
    // ============================================================

    const accessRecords = await this.teamSectionAccessModel.findAll({
      where: {
        team_id: {
          [Op.in]: teamIds,
        },

        section_id: sectionId,
      },

      include: [
        {
          association: 'team',
        },
      ],
    });

    // ============================================================
    // NO ACCESS RECORDS
    // ============================================================

    if (!accessRecords.length) {
      return {
        user_id: userId,
        section_id: sectionId,

        access_level: TeamAccessLevel.NONE,

        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_approve: false,

        scope: null,

        teams: [],
      };
    }

    // ============================================================
    // ACCESS LEVEL PRIORITY
    // ============================================================

    const levelRank: Record<TeamAccessLevel, number> = {
      [TeamAccessLevel.NONE]: 0,
      [TeamAccessLevel.VIEW_ONLY]: 1,
      [TeamAccessLevel.LIMITED]: 2,
      [TeamAccessLevel.FULL]: 3,
    };

    let strongest = TeamAccessLevel.NONE;

    // ============================================================
    // PERMISSION FLAGS
    // ============================================================

    let canView = false;
    let canCreate = false;
    let canEdit = false;
    let canDelete = false;
    let canApprove = false;

    // ============================================================
    // MERGE ACCESS FROM ALL TEAMS
    // ============================================================

    for (const access of accessRecords) {
      const level = access.access_level;

      // Strongest access level wins
      if ((levelRank[level] ?? 0) > (levelRank[strongest] ?? 0)) {
        strongest = level;
      }

      // Any team granting a permission gives the user that permission
      canView = canView || Boolean(access.can_view);

      canCreate = canCreate || Boolean(access.can_create);

      canEdit = canEdit || Boolean(access.can_edit);

      canDelete = canDelete || Boolean(access.can_delete);

      canApprove = canApprove || Boolean(access.can_approve);
    }

    // ============================================================
    // FINAL USER ACCESS
    // ============================================================

    return {
      user_id: userId,
      section_id: sectionId,

      access_level: strongest,

      can_view: canView,
      can_create: canCreate,
      can_edit: canEdit,
      can_delete: canDelete,
      can_approve: canApprove,

      scope: null,

      teams: accessRecords,
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async ensureTeamExists(teamId: string, transaction?: Transaction) {
    const team = await this.teamModel.findByPk(teamId, {
      transaction,
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  private async ensureSectionExists(
    sectionId: string,
    transaction?: Transaction,
  ) {
    const section = await this.teamSectionModel.findByPk(sectionId, {
      transaction,
    });

    if (!section) {
      throw new NotFoundException('Team section not found');
    }

    return section;
  }

  private async ensureParentSectionExists(
    parentKey: string,
    transaction?: Transaction,
  ) {
    const parent = await this.teamSectionModel.findOne({
      where: {
        key: parentKey,
      },

      transaction,
    });

    if (!parent) {
      throw new NotFoundException(`Parent section "${parentKey}" not found`);
    }

    return parent;
  }

  private async ensureUserExists(userId: string, transaction?: Transaction) {
    const user = await this.userModel.findByPk(userId, {
      transaction,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ============================================================
  // ACCESS PAYLOAD NORMALIZATION
  // ============================================================

  private normalizeAccessPayload(dto: SetTeamSectionAccessDto | any) {
    let accessLevel = dto.access_level ?? TeamAccessLevel.NONE;

    let canView = Boolean(dto.can_view);

    let canCreate = Boolean(dto.can_create);

    let canEdit = Boolean(dto.can_edit);

    let canDelete = Boolean(dto.can_delete);

    let canApprove = Boolean(dto.can_approve);

    // ----------------------------------------------------------
    // NONE
    // ----------------------------------------------------------

    if (accessLevel === TeamAccessLevel.NONE) {
      canView = false;
      canCreate = false;
      canEdit = false;
      canDelete = false;
      canApprove = false;
    }

    // ----------------------------------------------------------
    // VIEW ONLY
    // ----------------------------------------------------------

    if (accessLevel === TeamAccessLevel.VIEW_ONLY) {
      canView = true;
      canCreate = false;
      canEdit = false;
      canDelete = false;
      canApprove = false;
    }

    // ----------------------------------------------------------
    // FULL
    // ----------------------------------------------------------

    if (accessLevel === TeamAccessLevel.FULL) {
      canView = true;
      canCreate = true;
      canEdit = true;
      canDelete = true;
      canApprove = true;
    }

    // ----------------------------------------------------------
    // LIMITED
    //
    // Keep the individual flags supplied by the UI.
    // ----------------------------------------------------------

    if (accessLevel === TeamAccessLevel.LIMITED) {
      if (canCreate || canEdit || canDelete || canApprove) {
        canView = true;
      }
    }

    return {
      access_level: accessLevel,

      can_view: canView,
      can_create: canCreate,
      can_edit: canEdit,
      can_delete: canDelete,
      can_approve: canApprove,

      scope: dto.scope ?? null,
    };
  }

  // ============================================================
  // BULK ACCESS DTO NORMALIZATION
  // ============================================================

  private extractBulkAccessEntries(dto: BulkTeamSectionAccessDto): any[] {
    const value = dto as any;

    if (Array.isArray(value.access)) {
      return value.access;
    }

    if (Array.isArray(value.items)) {
      return value.items;
    }

    if (Array.isArray(value.sections)) {
      return value.sections;
    }

    // Also support directly passing:
    //
    // {
    //   section_id: ...,
    //   access_level: ...
    // }
    //
    // although the DTO normally represents
    // a collection.

    if (value.section_id) {
      return [value];
    }

    return [];
  }
}
