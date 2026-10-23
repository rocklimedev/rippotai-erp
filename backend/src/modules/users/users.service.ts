import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, UniqueConstraintError } from 'sequelize';
import * as bcrypt from 'bcryptjs';
import { assertNewPassword } from '@/common/security/password-policy';

import { User } from './models/user.model';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';
import { Role } from '@/modules/rbac/models/role.model';
import { CdnService } from '@/modules/cdn/cdn.service';
import { ActivityLogForUserService } from '../engagement/services/activity-log-user.service';
import { NotificationForUserService } from '../engagement/services/notification-user.service';
import { EmailVerificationService } from '../auth/email-verification.service';
import { AuthToken } from '../auth/models/auth-token.model';
import { ActivityLog } from '../engagement/models/activity-log.model';
import { ActivityAction } from '@/common/enums';
import { RolePermissionsCache } from '../rbac/role-permissions-cache';
import {
  requireActor,
  assertProtectedRole,
} from '@/common/security/privilege-policy';

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
    @InjectModel(Role)
    private readonly roleModel: typeof Role,
    private readonly cdnService: CdnService,
    private readonly activityLogForUserService: ActivityLogForUserService,
    private readonly notificationForUserService: NotificationForUserService,
    private readonly emailVerification?: EmailVerificationService,
    @InjectModel(AuthToken) private readonly sessions?: typeof AuthToken,
    @InjectModel(ActivityLog) private readonly activity?: typeof ActivityLog,
    private readonly permissionCache: RolePermissionsCache = new RolePermissionsCache(),
  ) {}

  // =========================
  // CREATE USER
  // =========================
  async create(dto: CreateUserDto, actor?: any): Promise<User> {
    if (!actor?.id || !['ADMIN', 'SUPERADMIN'].includes(actor.roleName)) {
      throw new ForbiddenException(
        'Only administrators can provision accounts.',
      );
    }
    requireActor(actor, 'users:create');
    if (dto.role_id) {
      const role = await this.roleModel.findByPk(dto.role_id);
      if (!role) throw new NotFoundException('Role not found');
      assertProtectedRole(actor, role.name);
    }
    await assertNewPassword(dto.password);
    const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.userModel.create({
        name: dto.name,
        email: dto.email.trim().toLowerCase(),
        password_hash,
        phone: dto.phone ?? null,
        job_title: dto.job_title ?? null,
        role_id: dto.role_id ?? null,
        is_active: dto.is_active ?? true,
        created_by: actor.id,
      });

      const createdUser = await this.findOne(user.id);

      // === Activity Log & Notification ===
      await this.activityLogForUserService.logUserCreated(
        createdUser,
        actor.id,
        actor,
      );
      await this.notificationForUserService.notifyUserCreated(
        createdUser,
        actor.id,
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
    requireActor(actor, 'users:update');
    const user = await this.userModel.findByPk(id, { include: ['role'] });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    assertProtectedRole(actor, user.role?.name);
    if (dto.role_id !== undefined && dto.role_id !== user.role_id) {
      if (user.id === actor.id)
        throw new ForbiddenException('Cannot change your own role');
      if (dto.role_id) {
        const role = await this.roleModel.findByPk(dto.role_id);
        if (!role) throw new NotFoundException('Role not found');
        assertProtectedRole(actor, role.name);
      }
    }

    const payload: Record<string, any> = {
      name: dto.name,
      phone: dto.phone,
      job_title: dto.job_title,
      is_active: dto.is_active,
      role_id: dto.role_id,
    };

    if (dto.password) {
      await assertNewPassword(dto.password);
      payload.password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    try {
      if (dto.email && dto.email.trim().toLowerCase() !== user.email) {
        await this.emailVerification!.requestChange(id, dto.email);
      }
      const roleChange = await this.userModel.sequelize!.transaction(
        async (transaction) => {
          // Recheck under a row lock so concurrent promotion cannot bypass policy.
          const locked = await this.userModel.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
          });
          if (!locked) throw new NotFoundException('User not found');
          const role = locked.role_id
            ? await this.roleModel.findByPk(locked.role_id, { transaction })
            : null;
          assertProtectedRole(actor, role?.name);
          if (
            dto.role_id !== undefined &&
            dto.role_id !== locked.role_id &&
            locked.id === actor.id
          ) {
            throw new ForbiddenException('Cannot change your own role');
          }
          if (dto.role_id !== undefined && dto.role_id) {
            const assignedRole = await this.roleModel.findByPk(dto.role_id, {
              transaction,
            });
            if (!assignedRole) throw new NotFoundException('Role not found');
            assertProtectedRole(actor, assignedRole.name);
          }
          const snapshot = () => ({
            name: locked.name,
            phone: locked.phone,
            job_title: locked.job_title,
            role_id: locked.role_id,
            is_active: locked.is_active,
          });
          const before = snapshot();
          const securityChanged =
            !!dto.password ||
            (dto.role_id !== undefined && dto.role_id !== locked.role_id) ||
            (dto.is_active !== undefined && dto.is_active !== locked.is_active);
          await locked.update(payload, { transaction });
          if (securityChanged)
            await this.sessions!.update(
              { revoked_at: new Date() },
              {
                where: { user_id: id, revoked_at: null },
                transaction,
              },
            );
          await this.activity!.create(
            {
              user_id: actor.id,
              user_email: actor.email,
              user_role: actor.roleName,
              action: ActivityAction.USER_UPDATED,
              entity_type: 'User',
              entity_id: id,
              entity_label: locked.name,
              changes: {
                before,
                after: snapshot(),
                ...(dto.email
                  ? { requested_email: dto.email.trim().toLowerCase() }
                  : {}),
                password_changed: !!dto.password,
                sessions_revoked: securityChanged,
              },
            } as any,
            { transaction },
          );
          return before.role_id !== locked.role_id
            ? { previous: before.role_id, current: locked.role_id }
            : null;
        },
      );
      if (roleChange) {
        if (roleChange.previous)
          this.permissionCache.invalidate(roleChange.previous);
        if (roleChange.current)
          this.permissionCache.invalidate(roleChange.current);
      }
      const updatedUser = await this.findOne(id);

      // === Activity Log & Notification ===
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
    if (!actorId || actorId !== id)
      throw new ForbiddenException('Can only update your own profile');
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    try {
      if (dto.email && dto.email.trim().toLowerCase() !== user.email) {
        await this.emailVerification!.requestChange(id, dto.email);
      }
      await user.update({
        name: dto.name,
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
    if (!actorId || actorId !== id)
      throw new ForbiddenException('Can only update your own avatar');
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
    const { url } = await this.cdnService.uploadPublicFile(file);

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
    return this.update(id, { is_active: false }, actor);
  }
  // =========================
  // FIND USERS BY ROLE NAME
  // =========================
  async findUsersByRoleName(roleName: string): Promise<User[]> {
    const role = await this.roleModel.findOne({
      where: { name: roleName },
    });

    if (!role) {
      // Functional roles like SITE_ENGINEER live in users.job_title, not in
      // the access-role table: match on the title instead of 404-ing so
      // pickers still get their people.
      const title = roleName.replace(/[_-]+/g, ' ').trim();
      return this.userModel.findAll({
        where: {
          is_active: true,
          job_title: { [Op.like]: `%${title}%` },
        },
        attributes: PUBLIC_ATTRIBUTES,
        include: ['role'],
        order: [['name', 'ASC']],
      });
    }

    return this.userModel.findAll({
      where: {
        role_id: role.id,
        is_active: true,
      },
      attributes: PUBLIC_ATTRIBUTES,
      include: ['role'],
      order: [['name', 'ASC']],
    });
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
    requireActor(actor, 'users:delete');
    const user = await this.userModel.findByPk(id, { include: ['role'] });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    assertProtectedRole(actor, user.role?.name);

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
