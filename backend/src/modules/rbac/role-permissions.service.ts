import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';

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
