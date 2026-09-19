import { validateAssignment } from './team-assignment';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { Op, Transaction } from 'sequelize';

import { User } from '../users/models/user.model';
import {
  TeamMember,
  TeamMemberCreationAttributes,
} from './models/team-member.model';
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
          attributes: [
            'id',
            'name',
            'email',
            'avatar_url',
            'job_title',
            'is_active',
          ],
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
    if (!transaction)
      return this.teamMemberModel.sequelize!.transaction((trx) =>
        this.add(ownerType, ownerId, dto, actingUserId, trx),
      );
    await this.lockOwner(ownerType, ownerId, transaction);
    const role_label = await validateAssignment(
      dto.user_id,
      dto.role_label,
      'PROJECT',
      transaction,
    );
    const where = { owner_type: ownerType, owner_id: ownerId };
    const existing = await this.teamMemberModel.findOne({
      where: { ...where, user_id: dto.user_id, role_label },
      transaction,
    });
    if (existing)
      throw new ConflictException('User already has this role in this team');
    if (dto.is_primary)
      await this.teamMemberModel.update(
        { is_primary: false },
        {
          where: { ...where, role_label },
          transaction,
        },
      );
    return this.teamMemberModel.create(
      {
        ...where,
        team_id: null,
        user_id: dto.user_id,
        role_label,
        is_primary: dto.is_primary ?? false,
        sort_order: dto.sort_order ?? 0,
        created_by: actingUserId ?? null,
      },
      { transaction },
    );
  }

  async replaceAll(
    ownerType: TeamMemberOwnerType,
    ownerId: string,
    members: AddTeamMemberDto[],
    actingUserId?: string,
    transaction?: Transaction,
  ) {
    if (ownerType === TeamMemberOwnerType.TEAM)
      throw new BadRequestException('Use internal team endpoints');
    const keys = members.map((m) => `${m.user_id}:${m.role_label?.trim()}`);
    if (new Set(keys).size !== keys.length)
      throw new BadRequestException('Duplicate team member role');
    const trx =
      transaction ?? (await this.teamMemberModel.sequelize!.transaction());

    const ownTransaction = !transaction;

    try {
      await this.lockOwner(ownerType, ownerId, trx);
      // ============================================================
      // VALIDATE OWNER-SCOPED ASSIGNMENTS
      // ============================================================

      const rows: TeamMemberCreationAttributes[] = [];

      for (let index = 0; index < members.length; index++) {
        const member = members[index];

        member.role_label = await validateAssignment(
          member.user_id,
          member.role_label,
          'PROJECT',
          trx,
        );

        rows.push({
          owner_type: ownerType,
          owner_id: ownerId,

          // Owner-scoped membership is independent of internal teams.
          team_id: null,

          user_id: member.user_id,

          role_label: member.role_label ?? null,

          is_primary: member.is_primary ?? false,

          sort_order: member.sort_order ?? index,

          created_by: actingUserId ?? null,
        });
      }

      // ============================================================
      // REMOVE EXISTING OWNER-SCOPED MEMBERS
      // ============================================================

      await this.teamMemberModel.destroy({
        where: {
          owner_type: ownerType,
          owner_id: ownerId,
        },
        transaction: trx,
      });

      // ============================================================
      // NOTHING TO INSERT
      // ============================================================

      if (!rows.length) {
        if (ownTransaction) {
          await trx.commit();
        }

        return [];
      }

      // ============================================================
      // PRIMARY VALIDATION
      // ============================================================

      const primaryRoles = rows
        .filter((member) => member.is_primary)
        .map((member) => member.role_label);
      if (new Set(primaryRoles).size !== primaryRoles.length) {
        throw new BadRequestException(
          'Only one primary member per role is allowed',
        );
      }

      // ============================================================
      // CREATE OWNER-SCOPED MEMBERS
      // ============================================================

      const result = await this.teamMemberModel.bulkCreate(rows, {
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
    return this.teamMemberModel.sequelize!.transaction(async (transaction) => {
      const member = await this.teamMemberModel.findByPk(id, { transaction });
      if (!member?.owner_type || !member.owner_id)
        throw new NotFoundException('Owner-scoped member not found');
      await this.lockOwner(member.owner_type, member.owner_id, transaction);
      const role_label = await validateAssignment(
        dto.user_id ?? member.user_id,
        dto.role_label ?? member.role_label,
        'PROJECT',
        transaction,
      );
      const where = {
        owner_type: member.owner_type,
        owner_id: member.owner_id,
      };
      const duplicate = await this.teamMemberModel.findOne({
        where: {
          ...where,
          user_id: dto.user_id ?? member.user_id,
          role_label,
          id: { [Op.ne]: id },
        },
        transaction,
      });
      if (duplicate)
        throw new ConflictException('User already has this role in this team');
      if (dto.is_primary ?? member.is_primary)
        await this.teamMemberModel.update(
          { is_primary: false },
          {
            where: { ...where, role_label, id: { [Op.ne]: id } },
            transaction,
          },
        );
      return member.update({ ...dto, role_label }, { transaction });
    });
  }

  async remove(id: string) {
    const member = await this.teamMemberModel.findByPk(id);

    if (!member?.owner_type || !member.owner_id) {
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
          where: { owner_type: null, owner_id: null },
          required: false,
          include: [
            {
              association: 'user',
              attributes: [
                'id',
                'name',
                'email',
                'avatar_url',
                'job_title',
                'is_active',
              ],
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
      status: 'ACTIVE',
    } as any);
  }

  async deactivateTeam(teamId: string) {
    const team = await this.ensureTeamExists(teamId);

    return team.update({
      status: 'INACTIVE',
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

        // Only the canonical Admin Team roster rows, not
        // owner-scoped POA/PROJECT/etc. rows that happen to
        // carry the same team_id.
        owner_type: null,
        owner_id: null,
      },

      order: [
        ['is_primary', 'DESC'],
        ['sort_order', 'ASC'],
        ['created_at', 'ASC'],
      ],

      include: [
        {
          association: 'user',
          attributes: [
            'id',
            'name',
            'email',
            'avatar_url',
            'job_title',
            'is_active',
          ],
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

    dto.role_label = await validateAssignment(
      dto.user_id,
      dto.role_label,
      'INTERNAL',
    );

    const existing = await this.teamMemberModel.findOne({
      where: {
        team_id: teamId,
        user_id: dto.user_id,
        owner_type: null,
        owner_id: null,
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
              owner_type: null,
              owner_id: null,
            },

            transaction,
          },
        );
      }

      const member = await this.teamMemberModel.create(
        {
          team_id: teamId,

          // IMPORTANT:
          // Admin Team membership = team_id set, owner_type/owner_id
          // both null. The DB's owner_type ENUM does not contain a
          // 'TEAM' value ('PROJECT' | 'PLAN_OF_ACTION' | 'QUOTATION'
          // | 'BOQ' only), so this must NOT be written as
          // TeamMemberOwnerType.TEAM.
          owner_type: null,
          owner_id: null,

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
          attributes: [
            'id',
            'name',
            'email',
            'avatar_url',
            'job_title',
            'is_active',
          ],
        },
        {
          association: 'team',
        },
      ],
    });

    if (member?.owner_type || member?.owner_id)
      throw new BadRequestException('Use owner-scoped membership endpoints');
    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    return member;
  }

  async updateTeamMember(memberId: string, dto: UpdateTeamMemberDto) {
    const member = await this.teamMemberModel.findByPk(memberId);

    if (member?.owner_type || member?.owner_id)
      throw new BadRequestException('Use owner-scoped membership endpoints');
    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    dto.role_label = await validateAssignment(
      dto.user_id ?? member.user_id,
      dto.role_label ?? member.role_label,
      'INTERNAL',
    );
    if (dto.user_id && dto.user_id !== member.user_id) {
      await this.ensureUserExists(dto.user_id);

      const existing = await this.teamMemberModel.findOne({
        where: {
          team_id: member.team_id,
          user_id: dto.user_id,
          owner_type: null,
          owner_id: null,

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
              owner_type: null,
              owner_id: null,

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

    if (member?.owner_type || member?.owner_id)
      throw new BadRequestException('Use owner-scoped membership endpoints');
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
            owner_type: null,
            owner_id: null,
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

    if (member?.owner_type || member?.owner_id)
      throw new BadRequestException('Use owner-scoped membership endpoints');
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
          association: 'teamAccess',
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

        // Only the canonical Admin Team roster rows. Owner-scoped
        // rows (PROJECT / PLAN_OF_ACTION / QUOTATION / BOQ) also
        // carry team_id (inherited from the resolved Admin Team in
        // replaceAll) but are NOT Admin Team memberships, and must
        // be excluded here or a user in N owner-scoped contexts
        // would appear to belong to their team N+1 times.
        owner_type: null,
        owner_id: null,
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

    const section = await this.ensureSectionExists(sectionId);
    if (section.status !== 'ACTIVE')
      throw new BadRequestException('Team section is inactive');

    // ============================================================
    // GET USER TEAM MEMBERSHIPS
    // ============================================================
    //
    // Restricted to canonical Admin Team rows (owner_type/owner_id
    // null) — see getUserTeams() for why owner-scoped rows must be
    // excluded here too.

    const memberships = await this.teamMemberModel.findAll({
      where: {
        user_id: userId,
        owner_type: null,
        owner_id: null,
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
    const teamIds = memberships
      .map((member) => member.team_id)
      .filter((id): id is string => Boolean(id));

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
          required: true,
          where: { status: 'ACTIVE' },
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
      if (access.scope && Object.keys(access.scope).length) continue;
      const level = access.access_level;

      // Strongest access level wins
      if ((levelRank[level] ?? 0) > (levelRank[strongest] ?? 0)) {
        strongest = level;
      }

      // Any team granting a permission gives the user that permission
      canView =
        canView ||
        level === TeamAccessLevel.FULL ||
        level === TeamAccessLevel.VIEW_ONLY ||
        (level === TeamAccessLevel.LIMITED && Boolean(access.can_view));

      canCreate =
        canCreate ||
        level === TeamAccessLevel.FULL ||
        (level === TeamAccessLevel.LIMITED && Boolean(access.can_create));

      canEdit =
        canEdit ||
        level === TeamAccessLevel.FULL ||
        (level === TeamAccessLevel.LIMITED && Boolean(access.can_edit));

      canDelete =
        canDelete ||
        level === TeamAccessLevel.FULL ||
        (level === TeamAccessLevel.LIMITED && Boolean(access.can_delete));

      canApprove =
        canApprove ||
        level === TeamAccessLevel.FULL ||
        (level === TeamAccessLevel.LIMITED && Boolean(access.can_approve));
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

  private async lockOwner(
    ownerType: TeamMemberOwnerType,
    ownerId: string,
    transaction: Transaction,
  ) {
    const table = {
      PROJECT: 'projects',
      BOQ: 'boqs',
      QUOTATION: 'quotations',
      PLAN_OF_ACTION: 'plan_of_actions',
    }[ownerType];
    if (!table)
      throw new BadRequestException('Use internal team membership endpoints');
    const model = Object.values(this.teamMemberModel.sequelize!.models).find(
      (model) => {
        const name = model.getTableName();
        return (typeof name === 'string' ? name : name.tableName) === table;
      },
    );
    const owner =
      model &&
      (await model.findByPk(ownerId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      }));
    if (!owner) throw new NotFoundException('Team owner not found');
  }

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
