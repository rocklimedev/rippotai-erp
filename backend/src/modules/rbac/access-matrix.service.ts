import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes } from 'sequelize';
import { DOCUMENT_TYPE_LEVELS, DocumentTypeLimits } from '@/common/security/document-type-access';
import { Sequelize } from 'sequelize-typescript';

import { Role } from './models/role.model';
import { Permission } from './models/permission.model';
import { RolePermission } from './models/role_permission.model';
import { RoleApp } from './models/role-app.model';
import { App } from './models/app.model';
import { ActivityLog } from '../engagement/models/activity-log.model';
import { ActivityAction } from '@/common/enums';
import { PROJECT_FINANCIAL_VALUES_PART } from '@/common/security/project-financial-values';
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
    const [{ byPart, unmapped }, documentTypes] = await Promise.all([
      this.ownedPermissions(),
      this.sequelize.query<{ id: string; name: string; phaseName: string }>(
        `SELECT id, name, phase_name AS phaseName FROM document_types
          WHERE target_type = 'DOCUMENT' ORDER BY phase_code, sequence, name`,
        { type: QueryTypes.SELECT },
      ),
    ]);
    return {
      levels: ACCESS_LEVELS,
      documentTypes,
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
      attributes: ['id', 'name', 'description', 'scope', 'frontend_route_restrictions', 'document_type_access'],
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
      const meaningful = parts.filter(
        (p) => p.key !== PROJECT_FINANCIAL_VALUES_PART && p.maxLevel !== 'none',
      );
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

  async setFrontendRoute(roleId: string, pattern: unknown, restricted: unknown, actor: any) {
    requireActor(actor, 'role-permissions:assign');
    const route = typeof pattern === 'string' ? pattern.trim().toLowerCase() : '';
    if (
      typeof restricted !== 'boolean' ||
      route.length > 250 ||
      !/^\/[a-z0-9_-]+(?:\/(?:[a-z0-9_-]+|:[a-z0-9_-]+))*(?:\/\*)?$/.test(route)
    ) {
      throw new BadRequestException('Enter an absolute route such as /tasks/:id/edit.');
    }
    return this.sequelize.transaction(async (transaction) => {
      const role = await this.roleModel.findByPk(roleId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!role) throw new NotFoundException('Role not found');
      if (PROTECTED_ROLES.includes(role.name)) {
        throw new ForbiddenException('Administrator roles keep their frontend route access.');
      }
      const routes = new Set(role.frontend_route_restrictions ?? []);
      if (routes.has(route) === restricted) return [...routes];
      if (restricted && routes.size >= 500) {
        throw new BadRequestException('This role already has 500 route restrictions.');
      }
      if (restricted) routes.add(route);
      else routes.delete(route);
      const restrictions = [...routes].sort();
      await role.update({ frontend_route_restrictions: restrictions }, { transaction });
      await this.activity.create(
        {
          user_id: actor.id,
          user_email: actor.email,
          user_role: actor.roleName,
          action: ActivityAction.USER_PERMISSION_UPDATED,
          entity_type: 'Role',
          entity_id: roleId,
          changes: { operation: 'frontend_route_restriction', route, restricted },
        } as any,
        { transaction },
      );
      return restrictions;
    });
  }

  async setLauncherApp(roleId: string, code: string, enabled: unknown, actor: any) {
    requireActor(actor, 'role-apps:update');
    const app = ACCESS_CATALOGUE.find((item) => item.code === code && item.launcher);
    if (!app) throw new NotFoundException('Unknown launcher app');
    if (typeof enabled !== 'boolean') throw new BadRequestException('Expected enabled to be a boolean');

    return this.sequelize.transaction(async (transaction) => {
      const role = await this.roleModel.findByPk(roleId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!role) throw new NotFoundException('Role not found');
      assertProtectedRole(actor, role.name);

      const where = { role_id: roleId, app_code: code };
      if (enabled) {
        await this.appModel.findOrCreate({
          where: { code },
          defaults: { code, name: app.name, is_active: true } as any,
          transaction,
        });
        await this.roleAppModel.findOrCreate({
          where,
          defaults: { ...where, granted_by: actor.id } as any,
          transaction,
        });
      } else {
        await this.roleAppModel.destroy({ where, transaction });
      }
      await this.activity.create({
        user_id: actor.id,
        user_email: actor.email,
        user_role: actor.roleName,
        action: ActivityAction.USER_PERMISSION_UPDATED,
        entity_type: 'Role',
        entity_id: roleId,
        changes: { operation: 'launcher_app', app_code: code, enabled },
      } as any, { transaction });
      return { on_launcher: enabled };
    });
  }

  async setDocumentTypeAccess(roleId: string, typeId: string, level: unknown, actor: any) {
    requireActor(actor, 'role-permissions:assign');
    if (!DOCUMENT_TYPE_LEVELS.some((option) => option === level)) {
      throw new BadRequestException('Invalid document type access level');
    }
    return this.sequelize.transaction(async (transaction) => {
      const role = await this.roleModel.findByPk(roleId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!role) throw new NotFoundException('Role not found');
      assertProtectedRole(actor, role.name);
      const [type] = await this.sequelize.query<{ id: string }>(
        "SELECT id FROM document_types WHERE id = :typeId AND target_type = 'DOCUMENT'",
        { replacements: { typeId }, type: QueryTypes.SELECT, transaction },
      );
      if (!type) throw new NotFoundException('Document type not found');
      const limits = { ...role.document_type_access };
      const key = type.id.toLowerCase();
      const previous = limits[key] ?? 'inherit';
      if (previous === level) return limits;
      if (DOCUMENT_TYPE_LEVELS.indexOf(level as any) < DOCUMENT_TYPE_LEVELS.indexOf(previous)) {
        requireActor(actor, 'role-permissions:revoke');
      }
      if (level === 'inherit') delete limits[key];
      else limits[key] = level as DocumentTypeLimits[string];
      await role.update({ document_type_access: limits }, { transaction });
      await this.activity.create({
        user_id: actor.id,
        user_email: actor.email,
        user_role: actor.roleName,
        action: ActivityAction.USER_PERMISSION_UPDATED,
        entity_type: 'Role',
        entity_id: roleId,
        changes: { operation: 'document_type_access', document_type_id: typeId, previous, level },
      } as any, { transaction });
      return limits;
    });
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
          .filter((p) => p.key !== PROJECT_FINANCIAL_VALUES_PART)
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
      for (const p of app.parts) {
        if (p.key !== PROJECT_FINANCIAL_VALUES_PART) targets.set(p.key, level);
      }
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
