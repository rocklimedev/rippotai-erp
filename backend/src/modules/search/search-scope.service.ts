import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Project } from '../projects/models/projects.model';
import { TeamMember } from '../users/models/team-member.model';
import { TeamMemberOwnerType } from '@/common/enums/team.enums';
import { isSearchAdmin, SearchUserContext } from './search-access';

@Injectable()
export class SearchScopeService {
  constructor(
    @InjectModel(Project) private readonly projects: typeof Project,
    @InjectModel(TeamMember) private readonly members: typeof TeamMember,
  ) {}

  async resolve(principal: {
    id?: string;
    roleName?: string;
  }): Promise<SearchUserContext> {
    const user: SearchUserContext = {
      id: principal?.id as string,
      role: principal?.roleName,
    };
    if (isSearchAdmin(user)) return { ...user, isAdmin: true, projectIds: [] };
    const assignments = await this.members.findAll({
      where: { user_id: user.id, owner_type: TeamMemberOwnerType.PROJECT },
      attributes: ['owner_id'],
      raw: true,
    });
    const assignedIds = assignments
      .map((row) => row.owner_id)
      .filter((id): id is string => Boolean(id));
    const visible = await this.projects.findAll({
      where: {
        deleted_at: null,
        [Op.or]: [{ created_by: user.id }, { id: { [Op.in]: assignedIds } }],
      },
      attributes: ['id'],
      raw: true,
    });
    return {
      ...user,
      isAdmin: false,
      projectIds: visible.map((project) => project.id),
    };
  }
}
