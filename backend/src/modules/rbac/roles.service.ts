import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { Role } from './models/role.model';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role)
    private readonly roleModel: typeof Role,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    try {
      return await this.roleModel.create({ ...dto } as any);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(`Role "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  async findAll(): Promise<Role[]> {
    return this.roleModel.findAll({ order: [['name', 'ASC']] });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleModel.findByPk(id);
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    try {
      await role.update({ ...dto });
      return role;
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(`Role "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await role.destroy();
  }
}
