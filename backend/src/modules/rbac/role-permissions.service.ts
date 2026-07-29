import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { RolePermission } from './models/role_permission.model';
import { Role } from '../rbac/models/role.model';
import { Permission } from './models/permission.model';
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
