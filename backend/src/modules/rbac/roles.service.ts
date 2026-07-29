import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Role } from './models/role.model';
import { RoleApp } from './models/role-app.model';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role)
    private readonly roleModel: typeof Role,

    @InjectModel(RoleApp)
    private readonly roleAppModel: typeof RoleApp,

    private readonly sequelize: Sequelize,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const { app_codes, ...roleFields } = dto;

    try {
      return await this.sequelize.transaction(async (t) => {
        const role = await this.roleModel.create({ ...roleFields } as any, {
          transaction: t,
        });

        if (app_codes?.length) {
          await this.roleAppModel.bulkCreate(
            app_codes.map((app_code) => ({
              role_id: role.id,
              app_code,
            })) as any,
            { transaction: t, ignoreDuplicates: true },
          );
        }

        return role;
      });
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(`Role "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  findAll(): Promise<Role[]> {
    return this.roleModel.findAll({ order: [['name', 'ASC']] });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleModel.findByPk(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  /**
   * Role plus its resolved apps + permissions — the shape the
   * requireAccess middleware and the admin "edit role" screen both need.
   */
  async findOneWithAccess(id: string): Promise<Role> {
    const role = await this.roleModel.findByPk(id, {
      include: [
        { association: 'roleApps', include: ['app'] },
        { association: 'rolePermissions', include: ['permission'] },
      ],
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    const { app_codes, ...roleFields } = dto;

    try {
      return await this.sequelize.transaction(async (t) => {
        if (Object.keys(roleFields).length) {
          await role.update({ ...roleFields }, { transaction: t });
        }

        // Only touch app assignments if the caller actually sent app_codes —
        // undefined means "not part of this update", [] means "revoke all".
        if (app_codes !== undefined) {
          await this.roleAppModel.destroy({
            where: { role_id: id },
            transaction: t,
          });
          if (app_codes.length) {
            await this.roleAppModel.bulkCreate(
              app_codes.map((app_code) => ({ role_id: id, app_code })) as any,
              { transaction: t, ignoreDuplicates: true },
            );
          }
        }

        return role;
      });
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(`Role "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await role.destroy(); // FK CASCADE on role_apps/role_permissions handles cleanup
  }
}
