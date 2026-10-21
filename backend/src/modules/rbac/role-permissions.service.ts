import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { RolePermission } from './models/role_permission.model';
import { Role } from '../rbac/models/role.model';
import { Permission } from './models/permission.model';
import packages from './permission-packages.json';
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
  ) {}

  getPackages() {
    return packages;
  }

  async applyPackage(role_id: string, package_id: string) {
    const permissionPackage = packages.find((p) => p.id === package_id);
    if (!permissionPackage)
      throw new NotFoundException('Permission package not found');
    return this.sequelize.transaction(async (transaction) => {
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
      await this.rolePermissionModel.bulkCreate(
        matching.map((p) => ({
          role_id,
          permission_id: p.id,
          granted_by: null,
        })) as any,
        { transaction, ignoreDuplicates: true },
      );
      return { role_id, package_id, permission_count: matching.length };
    });
  }

  async grant(dto: CreateRolePermissionDto): Promise<RolePermission> {
    try {
      return await this.rolePermissionModel.create({ ...dto } as any);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          'This permission is already granted to the role',
        );
      }
      throw err;
    }
  }

  async bulkAssign(dto: BulkAssignPermissionsDto): Promise<RolePermission[]> {
    const rows = dto.permission_ids.map((permission_id) => ({
      role_id: dto.role_id,
      permission_id,
      granted_by: dto.granted_by ?? null,
    }));

    return this.rolePermissionModel.bulkCreate(rows as any, {
      ignoreDuplicates: true,
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
    granted_by?: string,
  ): Promise<RolePermission[]> {
    return this.sequelize.transaction(async (t) => {
      await this.rolePermissionModel.destroy({
        where: { role_id },
        transaction: t,
      });

      if (permission_ids.length === 0) return [];

      const rows = permission_ids.map((permission_id) => ({
        role_id,
        permission_id,
        granted_by: granted_by ?? null,
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

  async revoke(role_id: string, permission_id: string): Promise<void> {
    const row = await this.rolePermissionModel.findOne({
      where: { role_id, permission_id },
    });

    if (!row) {
      throw new NotFoundException('Permission grant not found for this role');
    }

    await row.destroy();
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
