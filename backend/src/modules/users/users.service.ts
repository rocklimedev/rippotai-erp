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
import { ActivityLogForUserService } from '../engagement/services/activity-log-user.service';
import { NotificationForUserService } from '../engagement/services/notification-user.service';

const SALT_ROUNDS = 10;
const PUBLIC_ATTRIBUTES = { exclude: ['password_hash'] };
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
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
    private readonly activityLogForUserService: ActivityLogForUserService,
    private readonly notificationForUserService: NotificationForUserService,
  ) {}

  // =========================
  // CREATE USER
  // =========================
  async create(dto: CreateUserDto, actor?: any): Promise<User> {
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

      const createdUser = await this.findOne(user.id);

      // === Activity Log & Notification ===
      await this.activityLogForUserService.logUserCreated(
        createdUser,
        dto.created_by,
        actor,
      );
      await this.notificationForUserService.notifyUserCreated(
        createdUser,
        dto.created_by,
      );

      return createdUser;
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Email "${dto.email}" is already registered`,
        );
      }
      throw err;
    }
  }

  // =========================
  // FIND ALL
  // =========================
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

  // =========================
  // FIND ONE
  // =========================
  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findByPk(id, {
      attributes: PUBLIC_ATTRIBUTES,
      include: ['role'],
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  // =========================
  // FIND BY EMAIL (FOR AUTH)
  // =========================
  async findByEmailWithSecret(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { email },
      include: ['role'],
    });
  }

  // =========================
  // UPDATE USER (Admin)
  // =========================
  async update(id: string, dto: UpdateUserDto, actor?: any): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const payload: Record<string, any> = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      job_title: dto.job_title,
      is_active: dto.is_active,
      role_id: dto.role_id,
    };

    if (dto.password) {
      payload.password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    try {
      await user.update(payload);
      const updatedUser = await this.findOne(id);

      // === Activity Log & Notification ===
      await this.activityLogForUserService.logUserUpdated(
        updatedUser,
        actor?.id,
        actor,
      );

      await this.notificationForUserService.notifyUserUpdated(
        updatedUser,
        actor?.id,
      );

      return updatedUser;
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Email "${dto.email}" is already registered`,
        );
      }
      throw err;
    }
  }

  // =========================
  // UPDATE PROFILE (Self)
  // =========================
  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
    actorId: string,
  ): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    try {
      await user.update({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        job_title: dto.job_title,
      });

      const updatedUser = await this.findOne(id);

      // === Activity Log & Notification ===
      await this.activityLogForUserService.logUserProfileUpdated(
        updatedUser,
        actorId,
      );
      await this.notificationForUserService.notifyUserProfileUpdated(
        updatedUser,
        actorId,
      );

      return updatedUser;
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Email "${dto.email}" is already registered`,
        );
      }
      throw err;
    }
  }

  // =========================
  // UPLOAD AVATAR
  // =========================
  async uploadAvatar(
    id: string,
    file: Express.Multer.File,
    actorId: string,
  ): Promise<User> {
    if (!file) throw new BadRequestException('No file uploaded');
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
    const { url } = await this.cdnService.uploadFile(file);

    await user.update({ avatar_url: url });

    // Cleanup old avatar (non-blocking)
    if (previousAvatarUrl) {
      const previousFilename = previousAvatarUrl.split('/').pop();
      if (previousFilename) {
        this.cdnService.deleteFile(previousFilename).catch(() => {});
      }
    }

    const updatedUser = await this.findOne(id);

    // === Activity Log & Notification ===
    await this.activityLogForUserService.logAvatarUpdated(updatedUser, actorId);
    await this.notificationForUserService.notifyAvatarUpdated(
      updatedUser,
      actorId,
    );

    return updatedUser;
  }

  // =========================
  // DEACTIVATE USER
  // =========================
  async deactivate(id: string, actor?: any): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    await user.update({ is_active: false });

    const deactivatedUser = await this.findOne(id);

    // === Activity Log & Notification ===
    await this.activityLogForUserService.logUserDeactivated(
      deactivatedUser,
      actor?.id,
      actor,
    );
    await this.notificationForUserService.notifyUserDeactivated(
      deactivatedUser,
      actor?.id,
    );

    return deactivatedUser;
  }

  // =========================
  // UPDATE LAST LOGIN
  // =========================
  async touchLastLogin(id: string): Promise<void> {
    await this.userModel.update(
      { last_login_at: new Date() },
      { where: { id } },
    );
  }

  // =========================
  // DELETE USER
  // =========================
  async remove(id: string, actor?: any): Promise<void> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const userName = user.name;
    const email = user.email;

    await user.destroy();

    // === Activity Log & Notification ===
    await this.activityLogForUserService.logUserDeleted(
      userName,
      email,
      id,
      actor?.id,
      actor,
    );
    await this.notificationForUserService.notifyUserDeleted(
      userName,
      email,
      actor?.id,
    );
  }
}
