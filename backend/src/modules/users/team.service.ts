import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { TeamMember } from './models/team-member.model';
import { TeamMemberOwnerType } from '@/common/enums/team.enums';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(TeamMember)
    private readonly teamMemberModel: typeof TeamMember,
  ) {}

  // Every other module calls this scoped to itself, e.g.
  //   teamService.list(TeamMemberOwnerType.PLAN_OF_ACTION, planOfActionId)
  list(ownerType: TeamMemberOwnerType, ownerId: string) {
    return this.teamMemberModel.findAll({
      where: { owner_type: ownerType, owner_id: ownerId },
      order: [['sort_order', 'ASC']],
      include: [{ association: 'user' }],
    });
  }

  add(
    ownerType: TeamMemberOwnerType,
    ownerId: string,
    dto: AddTeamMemberDto,
    actingUserId?: string,
    transaction?: Transaction,
  ) {
    return this.teamMemberModel.create(
      {
        owner_type: ownerType,
        owner_id: ownerId,
        user_id: dto.user_id,
        role_label: dto.role_label,
        is_primary: dto.is_primary ?? false,
        sort_order: dto.sort_order ?? 0,
        created_by: actingUserId ?? null,
      } as TeamMember,
      { transaction },
    );
  }

  // Lets a caller replace the whole roster in one call - used when a
  // "Team" section is saved as a batch from the UI rather than row by row.
  async replaceAll(
    ownerType: TeamMemberOwnerType,
    ownerId: string,
    members: AddTeamMemberDto[],
    actingUserId?: string,
    transaction?: Transaction,
  ) {
    await this.teamMemberModel.destroy({
      where: { owner_type: ownerType, owner_id: ownerId },
      transaction,
    });
    if (!members.length) return [];
    return this.teamMemberModel.bulkCreate(
      members.map((m, index) => ({
        owner_type: ownerType,
        owner_id: ownerId,
        user_id: m.user_id,
        role_label: m.role_label,
        is_primary: m.is_primary ?? false,
        sort_order: m.sort_order ?? index,
        created_by: actingUserId ?? null,
      })) as TeamMember[],
      { transaction },
    );
  }

  async update(id: string, dto: UpdateTeamMemberDto) {
    const member = await this.teamMemberModel.findByPk(id);
    if (!member) throw new NotFoundException('Team member not found');
    return member.update(dto);
  }

  async remove(id: string) {
    const member = await this.teamMemberModel.findByPk(id);
    if (!member) throw new NotFoundException('Team member not found');
    await member.destroy();
  }
}
