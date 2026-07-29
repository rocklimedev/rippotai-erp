// modules/rbac/role-apps.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';

import { RoleApp } from './models/role-app.model';
import { Role } from './models/role.model';
import { App } from './models/app.model';
import { CreateRoleAppDto, BulkAssignAppsDto } from './dto/role-app.dto';

@Injectable()
export class RoleAppsService {
  constructor(
    @InjectModel(RoleApp)
    private readonly roleAppModel: typeof RoleApp,

    @InjectModel(Role)
    private readonly roleModel: typeof Role,

    @InjectModel(App)
    private readonly appModel: typeof App,
  ) {}

  async grant(dto: CreateRoleAppDto): Promise<RoleApp> {
    try {
      return await this.roleAppModel.create({ ...dto } as any);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException('This app is already granted to the role');
      }
      throw err;
    }
  }

  async bulkAssign(dto: BulkAssignAppsDto): Promise<RoleApp[]> {
    const rows = dto.app_codes.map((app_code) => ({
      role_id: dto.role_id,
      app_code,
      granted_by: dto.granted_by ?? null,
    }));

    return this.roleAppModel.bulkCreate(rows as any, {
      ignoreDuplicates: true,
    });
  }

  findAllForRole(role_id: string): Promise<RoleApp[]> {
    return this.roleAppModel.findAll({
      where: { role_id },
      include: ['app', 'grantor'],
    });
  }

  findAll(): Promise<RoleApp[]> {
    return this.roleAppModel.findAll({
      include: ['role', 'app'],
    });
  }

  async revoke(role_id: string, app_code: string): Promise<void> {
    const row = await this.roleAppModel.findOne({
      where: { role_id, app_code },
    });

    if (!row) {
      throw new NotFoundException('App grant not found for this role');
    }

    await row.destroy();
  }

  /**
   * Replace a role's entire app set in one call — used by the admin
   * "edit role" screen where the UI sends a full checklist, not a diff.
   * Wrapped in a transaction so a partial write never leaves the role
   * with a half-updated app list.
   */
  async setForRole(
    role_id: string,
    app_codes: string[],
    granted_by?: string,
  ): Promise<RoleApp[]> {
    return this.roleAppModel.sequelize!.transaction(async (t) => {
      await this.roleAppModel.destroy({ where: { role_id }, transaction: t });

      if (app_codes.length === 0) return [];

      const rows = app_codes.map((app_code) => ({
        role_id,
        app_code,
        granted_by: granted_by ?? null,
      }));

      return this.roleAppModel.bulkCreate(rows as any, { transaction: t });
    });
  }

  // ============================
  // MATRIX (same shape as permissions matrix, for a parallel admin UI)
  // ============================

  async getMatrix() {
    const [roles, apps, assignments] = await Promise.all([
      this.roleModel.findAll({
        attributes: ['id', 'name'],
        order: [['name', 'ASC']],
      }),

      this.appModel.findAll({
        attributes: ['code', 'name', 'is_active'],
        where: { is_active: true },
        order: [['name', 'ASC']],
      }),

      this.roleAppModel.findAll({
        attributes: ['role_id', 'app_code'],
      }),
    ]);

    return { roles, apps, assignments };
  }
}
