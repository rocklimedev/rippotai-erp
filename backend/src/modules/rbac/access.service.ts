import { ForbiddenException, Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { Role } from './models/role.model';
import { RolePermission } from './models/role_permission.model';
import { Permission } from './models/permission.model';
import { AccessRuleModel } from './models/access-rule.model';
import { TeamMember } from '../users/models/team-member.model';
import { TeamMemberOwnerType } from '../../common/enums/team.enums';
import { decideAccess, isSuperadmin, matchesResource } from './access-policy';
import { RoleApp } from './models/role-app.model';
import { App } from './models/app.model';
import { Team } from '../users/models/team.model';
import { TeamSectionAccess } from '../users/models/team-section-access.model';
import { TeamSection } from '../users/models/team-sections.model';

@Injectable()
export class AccessService {
  async check(user: any, resource: string, action: string, projectId?: string) {
    if (isSuperadmin(user)) return true;
    const internalRoleId = user.roleId ?? user.role_id;
    let roleIds: string[] = internalRoleId ? [internalRoleId] : [];
    let internalTeamIds: string[] = [];
    if (!projectId) {
      const members = await TeamMember.findAll({
        where: {
          user_id: user.id,
          owner_type: null,
          owner_id: null,
        },
        include: [
          {
            model: Team,
            as: 'team',
            required: true,
            where: { status: 'ACTIVE' },
          },
        ],
      });
      const labels = members
        .map((member) => member.role_label)
        .filter(Boolean) as string[];
      internalTeamIds = members
        .map((member) => member.team_id)
        .filter(Boolean) as string[];
      if (labels.length) {
        const teamRoles = await Role.findAll({
          where: { scope: 'INTERNAL', name: { [Op.in]: labels } },
        });
        roleIds = [
          ...new Set([...roleIds, ...teamRoles.map((role) => role.id)]),
        ];
      }
    }
    if (projectId) {
      const memberships = await TeamMember.findAll({
        where: {
          user_id: user.id,
          owner_type: TeamMemberOwnerType.PROJECT,
          owner_id: projectId,
        },
      });
      const labels = memberships
        .map((member) => member.role_label)
        .filter(Boolean) as string[];
      if (!labels.length) return false;
      const roles = await Role.findAll({
        where: { scope: 'PROJECT', name: { [Op.in]: labels } },
      });
      roleIds = roles.map((role) => role.id);
      if (!roleIds.length) return false;
    }
    const grants = roleIds.length
      ? await RolePermission.findAll({
          where: { role_id: { [Op.in]: roleIds } },
          include: [Permission],
        })
      : [];
    let granted = grants.some(
      ({ permission }) =>
        permission &&
        matchesResource(permission.resource, resource) &&
        (permission.action === action || permission.action === '*'),
    );
    if (!projectId && internalTeamIds.length) {
      const sections = await TeamSectionAccess.findAll({
        where: { team_id: { [Op.in]: internalTeamIds } },
        include: [
          {
            model: TeamSection,
            as: 'section',
            required: true,
            where: { status: 'ACTIVE', key: resource },
          },
        ],
      });
      granted ||= sections.some((section) => {
        // Scoped section grants need an owner-aware policy; never flatten them to global access.
        if (section.scope && Object.keys(section.scope).length) return false;
        if (section.access_level === 'FULL') return true;
        if (section.access_level === 'VIEW_ONLY') return action === 'view';
        return (
          section.access_level === 'LIMITED' &&
          section.get(`can_${action}`) === true
        );
      });
    }
    if (resource.startsWith('route:/')) {
      const segment = resource.slice(7).split('/')[0];
      const appCode =
        {
          console: 'adminConsole',
          'command-center': 'commandCenter',
          'design-studio': 'designStudio',
          'site-operations': 'siteOperations',
        }[segment] ?? segment;
      const appGrants = roleIds.length
        ? await RoleApp.findAll({
            where: {
              role_id: { [Op.in]: roleIds },
              app_code: appCode,
            },
            include: [
              { model: App, required: true, where: { is_active: true } },
            ],
          })
        : [];
      granted ||= appGrants.length > 0;
    }
    const rules = await AccessRuleModel.findAll({
      where: {
        [Op.or]: [
          { subject_type: 'USER', subject_id: user.id },
          {
            subject_type: 'ROLE',
            subject_id: {
              [Op.in]: [
                ...new Set([
                  ...roleIds,
                  ...(internalRoleId ? [internalRoleId] : []),
                ]),
              ],
            },
          },
        ],
      },
    });
    // Internal role blocks still apply, but internal grants never elevate a project role.
    return decideAccess(
      rules.filter(
        (rule) =>
          !projectId ||
          rule.effect === 'DENY' ||
          (rule.subject_type === 'ROLE' && roleIds.includes(rule.subject_id)),
      ),
      resource,
      action,
      granted,
    );
  }

  async projectIds(
    user: any,
    resource: string,
    action: string,
  ): Promise<string[]> {
    const members = await TeamMember.findAll({
      where: { user_id: user.id, owner_type: TeamMemberOwnerType.PROJECT },
    });
    const ids = [
      ...new Set(members.map((member) => member.owner_id).filter(Boolean)),
    ] as string[];
    const allowed: string[] = [];
    for (const id of ids)
      if (await this.check(user, resource, action, id)) allowed.push(id);
    return allowed;
  }

  async require(
    user: any,
    resource: string,
    action: string,
    projectId?: string,
  ) {
    if (!(await this.check(user, resource, action, projectId))) {
      throw new ForbiddenException(`Missing ${resource}:${action} access`);
    }
  }
}
