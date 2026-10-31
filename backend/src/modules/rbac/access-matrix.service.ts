import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { Role } from './models/role.model';
import { Permission } from './models/permission.model';
import { RolePermission } from './models/role_permission.model';
import { RoleApp } from './models/role-app.model';
import { App } from './models/app.model';
import { ActivityLog } from '../engagement/models/activity-log.model';
import { ActivityAction } from '@/common/enums';
import { RolePermissionsCache } from './role-permissions-cache';
import {
  requireActor,
  assertProtectedRole,
} from '@/common/security/privilege-policy';
import {
  ACCESS_CATALOGUE,
  ACCESS_LEVELS,
  AccessLevel,
  LEVEL_RANK,
  RANK_LEVEL,
  computePartLevel,
  findPart,
  isLegacyPermission,
  partFor,
  permissionsForLevel,
  actionLevel,
} from './access-catalogue';

const PROTECTED_ROLES = ['ADMIN', 'SUPERADMIN'];
// Parts an administrator role can never lose through the matrix.
const LOCKED_FOR_ADMINS = ['admin.roles', 'admin.users'];

/**
 * One level for an app when every part agrees. A part already at its own top
 * level (e.g. a document with no delete action) agrees with any higher level.
 */
export function aggregateLevel(
  parts: { level: AccessLevel; maxLevel: AccessLevel; custom: boolean }[],
): AccessLevel | 'mixed' {
  if (!parts.length) return 'none';
  if (parts.some((p) => p.custom)) return 'mixed';
  const top = parts.reduce((m, p) => Math.max(m, LEVEL_RANK[p.level]), 0);
  const ok = parts.every(
    (p) =>
      LEVEL_RANK[p.level] === top ||
      (p.level === p.maxLevel && LEVEL_RANK[p.maxLevel] < top),
  );
  return ok ? RANK_LEVEL[top] : 'mixed';
}

export interface SetAccessDto {
  apps?: Record<string, AccessLevel>;
  parts?: Record<string, AccessLevel>;
}

@Injectable()
export class AccessMatrixService {
  constructor(
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(Permission)
    private readonly permissionModel: typeof Permission,
    @InjectModel(RolePermission)
    private readonly rolePermissionModel: typeof RolePermission,
    @InjectModel(RoleApp) private readonly roleAppModel: typeof RoleApp,
    @InjectModel(App) private readonly appModel: typeof App,
    @InjectModel(ActivityLog) private readonly activity: typeof ActivityLog,
    private readonly sequelize: Sequelize,
    private readonly permissionCache: RolePermissionsCache,
  ) {}

  /** permission name -> id, grouped by part. Legacy UPPERCASE rows skipped. */
  private async ownedPermissions() {
    const rows = await this.permissionModel.findAll({
      attributes: ['id', 'resource', 'action'],
    });
    const byPart = new Map<string, string[]>();
    const idByName = new Map<string, string>();
    const unmapped: string[] = [];
    for (const r of rows) {
      if (isLegacyPermission(r.resource, r.action)) continue;
      const name = `${r.resource}:${r.action}`;
      idByName.set(name, r.id);
      const key = partFor(name);
      if (!key) {
        unmapped.push(name);
        continue;
      }
      if (!byPart.has(key)) byPart.set(key, []);
      byPart.get(key)!.push(name);
    }
    for (const list of byPart.values()) list.sort();
    return { byPart, idByName, unmapped: unmapped.sort() };
  }

  async catalogue() {
    const { byPart, unmapped } = await this.ownedPermissions();
    return {
      levels: ACCESS_LEVELS,
      apps: ACCESS_CATALOGUE.map((app) => ({
        code: app.code,
        name: app.name,
        description: app.description,
        launcher: app.launcher,
        parts: app.parts.map((p) => {
          const owned = byPart.get(p.key) ?? [];
          return {
            key: p.key,
            name: p.name,
            kind: p.kind,
            description: p.description ?? null,
            permissions: owned.map((name) => ({
              name,
              level: actionLevel(name.split(':')[1]),
            })),
          };
        }),
      })),
      unmapped,
    };
  }

  async getForRole(roleId: string) {
    const role = await this.roleModel.findByPk(roleId, {
      attributes: ['id', 'name', 'description', 'scope'],
    });
    if (!role) throw new NotFoundException('Role not found');
    const [{ byPart }, grants, appRows] = await Promise.all([
      this.ownedPermissions(),
      this.rolePermissionModel.findAll({
        where: { role_id: roleId },
        include: [{ model: Permission, attributes: ['resource', 'action'] }],
      }),
      this.roleAppModel.findAll({
        where: { role_id: roleId },
        attributes: ['app_code'],
      }),
    ]);
    const granted = new Set(
      grants
        .filter((g: any) => g.permission)
        .map((g: any) => `${g.permission.resource}:${g.permission.action}`),
    );
    const launcherApps = new Set(appRows.map((r) => r.app_code));

    const apps = ACCESS_CATALOGUE.map((app) => {
      const parts = app.parts.map((p) => {
        const owned = byPart.get(p.key) ?? [];
        const r = computePartLevel(owned, granted);
        return {
          key: p.key,
          ...r,
          granted: owned.filter((x) => granted.has(x)),
        };
      });
      const meaningful = parts.filter((p) => p.maxLevel !== 'none');
      const level = aggregateLevel(meaningful);
      const best = meaningful.reduce(
        (m, p) => Math.max(m, LEVEL_RANK[p.level]),
        0,
      );
      return {
        code: app.code,
        level,
        highest: RANK_LEVEL[best],
        on_launcher: launcherApps.has(app.code),
        parts,
      };
    });
    return {
      role: role.toJSON(),
      protected: PROTECTED_ROLES.includes(role.name),
      apps,
    };
  }

  /** One app's level for every role (per-app "Roles and permissions" page). */
  async getAppAcrossRoles(code: string) {
    const app = ACCESS_CATALOGUE.find((a) => a.code === code);
    if (!app) throw new NotFoundException('Unknown app');
    const [{ byPart }, roles, grants] = await Promise.all([
      this.ownedPermissions(),
      this.roleModel.findAll({
        attributes: ['id', 'name', 'description', 'scope'],
        order: [['name', 'ASC']],
      }),
      this.rolePermissionModel.findAll({
        attributes: ['role_id'],
        include: [{ model: Permission, attributes: ['resource', 'action'] }],
      }),
    ]);
    const byRole = new Map<string, Set<string>>();
    for (const g of grants as any[]) {
      if (!g.permission) continue;
      if (!byRole.has(g.role_id)) byRole.set(g.role_id, new Set());
      byRole
        .get(g.role_id)!
        .add(`${g.permission.resource}:${g.permission.action}`);
    }
    return {
      app: { code: app.code, name: app.name },
      roles: roles.map((role) => {
        const granted = byRole.get(role.id) ?? new Set<string>();
        const parts = app.parts
          .map((p) => computePartLevel(byPart.get(p.key) ?? [], granted))
          .filter((p) => p.maxLevel !== 'none');
        const level = aggregateLevel(parts);
        return {
          id: role.id,
          name: role.name,
          description: role.description,
          protected: PROTECTED_ROLES.includes(role.name),
          level,
        };
      }),
    };
  }

  async setForRole(roleId: string, dto: SetAccessDto, actor: any) {
    requireActor(actor, 'role-permissions:assign');
    const valid = new Set(Object.keys(LEVEL_RANK));
    const targets = new Map<string, AccessLevel>();
    for (const [code, level] of Object.entries(dto?.apps ?? {})) {
      const app = ACCESS_CATALOGUE.find((a) => a.code === code);
      if (!app) throw new BadRequestException(`Unknown app "${code}"`);
      if (!valid.has(level))
        throw new BadRequestException(`Unknown level "${level}"`);
      for (const p of app.parts) targets.set(p.key, level);
    }
    for (const [key, level] of Object.entries(dto?.parts ?? {})) {
      if (!findPart(key))
        throw new BadRequestException(`Unknown part "${key}"`);
      if (!valid.has(level))
        throw new BadRequestException(`Unknown level "${level}"`);
      targets.set(key, level);
    }
    if (!targets.size) throw new BadRequestException('Nothing to change');

    const result = await this.sequelize.transaction(async (transaction) => {
      const role = await this.roleModel.findByPk(roleId, { transaction });
      if (!role) throw new NotFoundException('Role not found');
      assertProtectedRole(actor, role.name);
      if (PROTECTED_ROLES.includes(role.name)) {
        for (const key of LOCKED_FOR_ADMINS)
          if (targets.has(key) && targets.get(key) !== 'full')
            throw new ForbiddenException(
              'Administrators always keep full access to users, roles and permissions',
            );
      }

      const { byPart, idByName } = await this.ownedPermissions();
      const grants = await this.rolePermissionModel.findAll({
        where: { role_id: roleId },
        include: [{ model: Permission, attributes: ['resource', 'action'] }],
        transaction,
      });
      const current = new Set(
        grants
          .filter((g: any) => g.permission)
          .map((g: any) => `${g.permission.resource}:${g.permission.action}`),
      );

      const add = new Set<string>();
      const remove = new Set<string>();
      for (const [key, level] of targets) {
        const owned = byPart.get(key) ?? [];
        const want = new Set(permissionsForLevel(owned, level));
        for (const p of owned) {
          if (want.has(p) && !current.has(p)) add.add(p);
          if (!want.has(p) && current.has(p)) remove.add(p);
        }
      }

      // Never let an operator lock their own role out of this screen.
      if (actor.roleId === roleId && remove.has('role-permissions:assign'))
        throw new ForbiddenException(
          'You cannot remove your own access to roles & permissions',
        );

      if (add.size) {
        const missing = [...add].filter((p) => !actor.permissions.includes(p));
        if (missing.length)
          throw new ForbiddenException({
            message: 'Cannot grant permissions you do not hold',
            missing,
          });
      }
      if (remove.size) requireActor(actor, 'role-permissions:revoke');

      const removeIds = [...remove]
        .map((p) => idByName.get(p)!)
        .filter(Boolean);
      const addIds = [...add].map((p) => idByName.get(p)!).filter(Boolean);
      if (removeIds.length)
        await this.rolePermissionModel.destroy({
          where: { role_id: roleId, permission_id: { [Op.in]: removeIds } },
          transaction,
        });
      if (addIds.length)
        await this.rolePermissionModel.bulkCreate(
          addIds.map((permission_id) => ({
            role_id: roleId,
            permission_id,
            granted_by: actor.id,
          })) as any,
          { transaction, ignoreDuplicates: true },
        );

      // Keep role_apps (launcher list) in step with the catalogue apps.
      const final = new Set([...current, ...add].filter((p) => !remove.has(p)));
      const openApps: string[] = [];
      const closedApps: string[] = [];
      for (const app of ACCESS_CATALOGUE) {
        const open = app.parts.some((p) =>
          (byPart.get(p.key) ?? []).some((x) => final.has(x)),
        );
        (open ? openApps : closedApps).push(app.code);
      }
      await this.appModel.bulkCreate(
        ACCESS_CATALOGUE.map((a) => ({
          code: a.code,
          name: a.name,
          is_active: true,
        })) as any,
        { ignoreDuplicates: true, transaction },
      );
      if (closedApps.length)
        await this.roleAppModel.destroy({
          where: { role_id: roleId, app_code: { [Op.in]: closedApps } },
          transaction,
        });
      if (openApps.length)
        await this.roleAppModel.bulkCreate(
          openApps.map((app_code) => ({
            role_id: roleId,
            app_code,
            granted_by: actor.id,
          })) as any,
          { ignoreDuplicates: true, transaction },
        );

      await this.activity.create(
        {
          user_id: actor.id,
          user_email: actor.email,
          user_role: actor.roleName,
          action: ActivityAction.USER_PERMISSION_UPDATED,
          entity_type: 'Role',
          entity_id: roleId,
          changes: {
            operation: 'access_levels',
            levels: Object.fromEntries(targets),
            added: [...add],
            removed: [...remove],
          },
        } as any,
        { transaction },
      );
      return { added: add.size, removed: remove.size };
    });
    this.permissionCache.invalidate(roleId);
    return { ...result, access: await this.getForRole(roleId) };
  }
}
