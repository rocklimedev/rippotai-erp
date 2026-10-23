import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { RolePermissionsCache } from './role-permissions-cache';

import { RolePermission } from './models/role_permission.model';
import { Role } from '../rbac/models/role.model';
import { Permission } from './models/permission.model';
import packages from './permission-packages.json';
import { ForbiddenException } from '@nestjs/common';
import { Op, Transaction } from 'sequelize';
import { ActivityLog } from '../engagement/models/activity-log.model';
import { ActivityAction } from '@/common/enums';
import {
  requireActor,
  assertProtectedRole,
} from '@/common/security/privilege-policy';
import {
  CreateRolePermissionDto,
  BulkAssignPermissionsDto,
} from './dto/role-permission.dto';

@Injectable()
export class RolePermissionsService {
  constructor(
    @InjectModel(RolePermission)
    private readonly rolePermissionModel: typeof RolePermission,

    @InjectModel(Role)
    private readonly roleModel: typeof Role,

    @InjectModel(Permission)
    private readonly permissionModel: typeof Permission,

    private readonly sequelize: Sequelize,
    @InjectModel(ActivityLog) private readonly activity?: typeof ActivityLog,
    private readonly permissionCache: RolePermissionsCache = new RolePermissionsCache(),
  ) {}

  private async mutate<T>(
    roleId: string,
    write: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    const result = await this.sequelize.transaction(write);
    this.permissionCache.invalidate(roleId);
    return result;
  }

  private async authorize(
    roleId: string,
    ids: string[],
    actor: any,
    permission: string,
    transaction: Transaction,
  ) {
    requireActor(actor, permission);
    const role = await this.roleModel.findByPk(roleId, { transaction });
    if (!role) throw new NotFoundException('Role not found');
    assertProtectedRole(actor, role.name);
    const permissions = ids.length
      ? await this.permissionModel.findAll({
          where: { id: { [Op.in]: [...new Set(ids)] } },
          transaction,
        })
      : [];
    if (permissions.length !== new Set(ids).size)
      throw new NotFoundException('Permission not found');
    if (
      permissions.some(
        (p) => !actor.permissions.includes(`${p.resource}:${p.action}`),
      )
    ) {
      throw new ForbiddenException('Cannot grant permissions you do not hold');
    }
  }

  private async audit(
    roleId: string,
    ids: string[],
    operation: string,
    actor: any,
    transaction: Transaction,
  ) {
    await this.activity!.create(
      {
        user_id: actor.id,
        user_email: actor.email,
        user_role: actor.roleName,
        action: ActivityAction.USER_PERMISSION_UPDATED,
        entity_type: 'Role',
        entity_id: roleId,
        changes: { operation, permission_ids: ids },
      } as any,
      { transaction },
    );
  }

  getPackages() {
    return packages;
  }

  async applyPackage(role_id: string, package_id: string, actor?: any) {
    requireActor(actor, 'role-permissions:assign');
    const permissionPackage = packages.find((p) => p.id === package_id);
    if (!permissionPackage)
      throw new NotFoundException('Permission package not found');
    return this.mutate(role_id, async (transaction) => {
      const role = await this.roleModel.findByPk(role_id, { transaction });
      if (!role) throw new NotFoundException('Role not found');
      const permissions = await this.permissionModel.findAll({ transaction });
      const required = new Set(permissionPackage.permissions);
      const matching = permissions.filter((p) =>
        required.has(`${p.resource}:${p.action}`),
      );
      const available = new Set(
        matching.map((p) => `${p.resource}:${p.action}`),
      );
      const missing = [...required].filter((p) => !available.has(p));
      if (missing.length)
        throw new BadRequestException({
          message: 'Permission catalogue is incomplete; no grants were applied',
          missing,
        });
      await this.authorize(
        role_id,
        matching.map((p) => p.id),
        actor,
        'role-permissions:assign',
        transaction,
      );
      await this.rolePermissionModel.bulkCreate(
        matching.map((p) => ({
          role_id,
          permission_id: p.id,
          granted_by: actor.id,
        })) as any,
        { transaction, ignoreDuplicates: true },
      );
      await this.audit(
        role_id,
        matching.map((p) => p.id),
        'package',
        actor,
        transaction,
      );
      return { role_id, package_id, permission_count: matching.length };
    });
  }

  async grant(
    dto: CreateRolePermissionDto,
    actor?: any,
  ): Promise<RolePermission> {
    try {
      return await this.mutate(dto.role_id, async (transaction) => {
        await this.authorize(
          dto.role_id,
          [dto.permission_id],
          actor,
          'role-permissions:grant',
          transaction,
        );
        const row = await this.rolePermissionModel.create(
          {
            role_id: dto.role_id,
            permission_id: dto.permission_id,
            granted_by: actor.id,
          } as any,
          { transaction },
        );
        await this.audit(
          dto.role_id,
          [dto.permission_id],
          'grant',
          actor,
          transaction,
        );
        return row;
      });
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          'This permission is already granted to the role',
        );
      }
      throw err;
    }
  }

  async bulkAssign(
    dto: BulkAssignPermissionsDto,
    actor?: any,
  ): Promise<RolePermission[]> {
    return this.mutate(dto.role_id, async (transaction) => {
      await this.authorize(
        dto.role_id,
        dto.permission_ids,
        actor,
        'role-permissions:assign',
        transaction,
      );
      const rows = dto.permission_ids.map((permission_id) => ({
        role_id: dto.role_id,
        permission_id,
        granted_by: actor.id,
      }));

      const result = await this.rolePermissionModel.bulkCreate(rows as any, {
        transaction,
        ignoreDuplicates: true,
      });
      await this.audit(
        dto.role_id,
        dto.permission_ids,
        'bulk_assign',
        actor,
        transaction,
      );
      return result;
    });
  }

  /**
   * Replace a role's entire permission set in one call — mirrors
   * RoleAppsService.setForRole. Used by a matrix/checklist admin UI
   * that submits the full desired state rather than incremental
   * grant/revoke calls.
   */
  async setForRole(
    role_id: string,
    permission_ids: string[],
    actor?: any,
  ): Promise<RolePermission[]> {
    return this.mutate(role_id, async (t) => {
      await this.authorize(
        role_id,
        permission_ids,
        actor,
        'role-permissions:assign',
        t,
      );
      await this.rolePermissionModel.destroy({
        where: { role_id },
        transaction: t,
      });

      await this.audit(role_id, permission_ids, 'replace', actor, t);
      if (permission_ids.length === 0) return [];

      const rows = permission_ids.map((permission_id) => ({
        role_id,
        permission_id,
        granted_by: actor.id,
      }));

      return this.rolePermissionModel.bulkCreate(rows as any, {
        transaction: t,
      });
    });
  }

  findAllForRole(role_id: string): Promise<RolePermission[]> {
    return this.rolePermissionModel.findAll({
      where: { role_id },
      include: ['permission', 'grantor'],
    });
  }

  findAll(): Promise<RolePermission[]> {
    return this.rolePermissionModel.findAll({
      include: ['role', 'permission'],
    });
  }

  async revoke(
    role_id: string,
    permission_id: string,
    actor?: any,
  ): Promise<void> {
    return this.mutate(role_id, async (transaction) => {
      await this.authorize(
        role_id,
        [],
        actor,
        'role-permissions:revoke',
        transaction,
      );
      const row = await this.rolePermissionModel.findOne({
        where: { role_id, permission_id },
        transaction,
      });

      if (!row) {
        throw new NotFoundException('Permission grant not found for this role');
      }

      await row.destroy({ transaction });
      await this.audit(role_id, [permission_id], 'revoke', actor, transaction);
    });
  }

  // ============================
  // MATRIX
  // ============================

  async getMatrix() {
    const [roles, permissions, assignments] = await Promise.all([
      this.roleModel.findAll({
        attributes: ['id', 'name'],
        order: [['name', 'ASC']],
      }),

      this.permissionModel.findAll({
        attributes: ['id', 'name', 'resource', 'action'],
        order: [
          ['resource', 'ASC'],
          ['action', 'ASC'],
        ],
      }),

      this.rolePermissionModel.findAll({
        attributes: ['role_id', 'permission_id'],
      }),
    ]);

    return {
      roles,
      permissions,
      assignments,
    };
  }
}
