import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { Permission } from './models/permission.model';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission)
    private readonly permissionModel: typeof Permission,
  ) {}

  async create(dto: CreatePermissionDto): Promise<Permission> {
    try {
      return await this.permissionModel.create({ ...dto } as any);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Permission "${dto.name}" or resource/action pair already exists`,
        );
      }
      throw err;
    }
  }

  findAll(resource?: string): Promise<Permission[]> {
    const where = resource ? { resource } : {};
    return this.permissionModel.findAll({
      where,
      order: [
        ['resource', 'ASC'],
        ['action', 'ASC'],
      ],
    });
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionModel.findByPk(id);
    if (!permission) throw new NotFoundException(`Permission ${id} not found`);
    return permission;
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);
    try {
      await permission.update({ ...dto });
      return permission;
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Permission "${dto.name}" or resource/action pair already exists`,
        );
      }
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    const permission = await this.findOne(id);
    await permission.destroy();
  }
}
