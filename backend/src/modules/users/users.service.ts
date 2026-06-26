import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import * as bcrypt from 'bcryptjs';
import { User } from './models/user.model';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const SALT_ROUNDS = 10;
const PUBLIC_ATTRIBUTES = { exclude: ['password_hash'] };

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  // ✅ CREATE USER
  async create(dto: CreateUserDto): Promise<User> {
    const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.userModel.create({
        name: dto.name,
        email: dto.email,
        password_hash,

        // ✅ FIXED: role_id instead of role
        role_id: dto.role_id ?? null,

        is_active: dto.is_active ?? true,
        created_by: dto.created_by ?? null,
      } as any);

      return this.findOne(user.id);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Email "${dto.email}" is already registered`,
        );
      }
      throw err;
    }
  }

  // ✅ GET ALL USERS
  async findAll(
    filters: { role_id?: string; is_active?: boolean } = {},
  ): Promise<User[]> {
    const where: Record<string, any> = {};

    // ✅ FIXED filter
    if (filters.role_id) where.role_id = filters.role_id;
    if (filters.is_active !== undefined) where.is_active = filters.is_active;

    return this.userModel.findAll({
      where,
      attributes: PUBLIC_ATTRIBUTES,
      order: [['created_at', 'DESC']],
    });
  }

  // ✅ GET ONE USER
  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findByPk(id, {
      attributes: PUBLIC_ATTRIBUTES,
      include: ['role'], // optional: loads Role association
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);

    return user;
  }

  // ✅ AUTH USE CASE (keep password)
  async findByEmailWithSecret(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { email },
      include: ['role'],
    });
  }

  // ✅ UPDATE USER
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByPk(id);

    if (!user) throw new NotFoundException(`User ${id} not found`);

    const payload: Record<string, any> = {
      name: dto.name,
      email: dto.email,
      is_active: dto.is_active,
      created_by: dto.created_by,
      role_id: dto.role_id, // ✅ FIXED
    };

    if (dto.password) {
      payload.password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    try {
      await user.update(payload);
      return this.findOne(id);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Email "${dto.email}" is already registered`,
        );
      }
      throw err;
    }
  }

  // ✅ DEACTIVATE USER
  async deactivate(id: string): Promise<User> {
    const user = await this.userModel.findByPk(id);

    if (!user) throw new NotFoundException(`User ${id} not found`);

    await user.update({ is_active: false });

    return this.findOne(id);
  }

  // ✅ UPDATE LAST LOGIN
  async touchLastLogin(id: string): Promise<void> {
    await this.userModel.update(
      { last_login_at: new Date() },
      { where: { id } },
    );
  }

  // ✅ DELETE USER
  async remove(id: string): Promise<void> {
    const user = await this.userModel.findByPk(id);

    if (!user) throw new NotFoundException(`User ${id} not found`);

    await user.destroy();
  }
}
