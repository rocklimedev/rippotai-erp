import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import * as bcrypt from 'bcryptjs';
import { User } from './models/user.model';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';
import { CdnService } from '@/modules/cdn/cdn.service';

const SALT_ROUNDS = 10;
const PUBLIC_ATTRIBUTES = { exclude: ['password_hash'] };
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // keep in sync with frontend + Multer limit
const ALLOWED_AVATAR_MIME = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly cdnService: CdnService,
  ) {}

  // ✅ CREATE USER
  async create(dto: CreateUserDto): Promise<User> {
    const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.userModel.create({
        name: dto.name,
        email: dto.email,
        password_hash,
        phone: dto.phone ?? null,
        job_title: dto.job_title ?? null,
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

    if (filters.role_id) where.role_id = filters.role_id;
    if (filters.is_active !== undefined) where.is_active = filters.is_active;

    return this.userModel.findAll({
      where,
      attributes: PUBLIC_ATTRIBUTES,
      include: ['role'],
      order: [['created_at', 'DESC']],
    });
  }

  // ✅ GET ONE USER
  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findByPk(id, {
      attributes: PUBLIC_ATTRIBUTES,
      include: ['role'], // needed so the frontend can render the (read-only) role name
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

  // ✅ UPDATE USER (admin-facing - can touch role_id / is_active / etc.)
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByPk(id);

    if (!user) throw new NotFoundException(`User ${id} not found`);

    const payload: Record<string, any> = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      job_title: dto.job_title,
      is_active: dto.is_active,
      created_by: dto.created_by,
      role_id: dto.role_id,
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

  // ✅ UPDATE OWN PROFILE (self-service - name/email/phone/job_title only,
  // role/is_active/created_by are intentionally not accepted here so a
  // user can never grant themselves a different role via this endpoint)
  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.userModel.findByPk(id);

    if (!user) throw new NotFoundException(`User ${id} not found`);

    try {
      await user.update({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        job_title: dto.job_title,
      });
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

  // ✅ UPLOAD / REPLACE AVATAR
  // Pushes the file to the CDN over SFTP via CdnService, then persists the
  // resulting URL on the user row. Best-effort deletes the old avatar file
  // afterwards so orphaned images don't accumulate on the CDN.
  async uploadAvatar(id: string, file: Express.Multer.File): Promise<User> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!ALLOWED_AVATAR_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        'Avatar must be a JPG, PNG, GIF or WEBP image',
      );
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw new BadRequestException('Avatar must be 2MB or smaller');
    }

    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const previousAvatarUrl = user.avatar_url;

    const { url, filename } = await this.cdnService.uploadFile(file);

    await user.update({ avatar_url: url });

    if (previousAvatarUrl) {
      const previousFilename = previousAvatarUrl.split('/').pop();
      if (previousFilename && previousFilename !== filename) {
        // don't let a slow/failed cleanup block the response to the user
        this.cdnService.deleteFile(previousFilename).catch(() => {});
      }
    }

    return this.findOne(id);
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
