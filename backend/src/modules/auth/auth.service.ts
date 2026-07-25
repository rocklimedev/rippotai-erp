import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { randomUUID, createHash } from 'crypto';

import { User } from '../users/models/user.model';
import { Role } from '@/modules/rbac/models/role.model';
import { AuthTokensService } from './auth-tokens.service';
import { PasswordResetToken } from './models/password-reset-token.model';
import { AuthTokenType } from '@/common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,

    @InjectModel(PasswordResetToken)
    private readonly passwordResetModel: typeof PasswordResetToken,

    private readonly authTokensService: AuthTokensService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({
      where: { email },
      attributes: [
        'id',
        'name',
        'email',
        'password_hash',
        'last_login_at',
        'role_id',
        'phone',
        'job_title',
        'avatar_url',
      ],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const rawToken = randomUUID();

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.authTokensService.create({
      user_id: user.id,
      token_hash: tokenHash,
      type: AuthTokenType.REFRESH,
      expires_at: expiresAt,
    });

    await user.update({
      last_login_at: new Date(),
    });

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role?.name,
        role_id: user.role_id,
        type: 'access',
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: '7d',
        jwtid: rawToken,
      },
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
        role_id: user.role_id,
        phone: user.phone,
        job_title: user.job_title,
        avatar_url: user.avatar_url,
      },
    };
  }

  async getCurrentUserFromPayload(payload: any) {
    const tokenHash = createHash('sha256').update(payload.jti).digest('hex');

    const authToken = await this.authTokensService.findByHash(tokenHash);

    if (!authToken) {
      throw new UnauthorizedException('Token not found in database');
    }

    if (authToken.revoked_at) {
      throw new UnauthorizedException('Token has been revoked');
    }

    if (new Date(authToken.expires_at) < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    await this.authTokensService.touchLastUsed(authToken.id);

    return {
      id: authToken.user?.id,
      name: authToken.user?.name,
      email: authToken.user?.email,
      role: authToken.user?.role?.name,
      role_id: authToken.user?.role_id,
      phone: authToken.user?.phone,
      job_title: authToken.user?.job_title,
      avatar_url: authToken.user?.avatar_url,
    };
  }

  async getCurrentUser(token: string) {
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    let payload: any;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err: any) {
      throw new UnauthorizedException(`Invalid JWT: ${err.name}`);
    }

    return this.getCurrentUserFromPayload(payload);
  }
  /**
   * Signup
   */
  async signup(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    job_title?: string;
    avatar_url?: string;
  }) {
    const existingUser = await this.userModel.findOne({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists.');
    }

    // Optional: Assign default USER role
    const defaultRole = await Role.findOne({
      where: {
        name: 'USER',
      },
    });

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.userModel.create({
      name: data.name,
      email: data.email,
      password_hash: passwordHash,
      phone: data.phone ?? null,
      job_title: data.job_title ?? null,
      avatar_url: data.avatar_url ?? null,
      role_id: defaultRole?.id ?? null,
      is_active: true,
      last_login_at: new Date(),
    });

    const rawToken = randomUUID();

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.authTokensService.create({
      user_id: user.id,
      token_hash: tokenHash,
      type: AuthTokenType.REFRESH,
      expires_at: expiresAt,
    });

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: defaultRole?.name,
        role_id: defaultRole?.id,
        type: 'access',
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: '7d',
        jwtid: rawToken,
      },
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: defaultRole?.name,
        role_id: defaultRole?.id,
        phone: user.phone,
        job_title: user.job_title,
        avatar_url: user.avatar_url,
      },
    };
  }
  async logout(token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

      const tokenHash = createHash('sha256').update(payload.jti).digest('hex');

      const authToken = await this.authTokensService.findByHash(tokenHash);

      if (authToken) {
        await this.authTokensService.revoke(authToken.id);
      }
    } catch {}
  }

  /**
   * Change Password (authenticated user, knows their current password)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'password_hash'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!valid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password_hash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await user.update({
      password_hash: passwordHash,
    });

    /**
     * Revoke every active session for this user as a security measure.
     * Note: this also logs out the session making this request. If you'd
     * rather keep the current session alive, extend revokeAllForUser to
     * accept an "exclude token id" parameter and pass the current token's
     * jti through from the controller.
     */
    await this.authTokensService.revokeAllForUser(user.id);

    return {
      message: 'Password changed successfully.',
    };
  }

  /**
   * Reset Password
   */
  async resetPassword(
    token: string,
    password: string,
  ): Promise<{
    message: string;
  }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const resetToken = await this.passwordResetModel.findOne({
      where: {
        token_hash: tokenHash,
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid reset token.');
    }

    if (resetToken.used_at) {
      throw new BadRequestException('This reset link has already been used.');
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      throw new BadRequestException('Reset link has expired.');
    }

    const user = await this.userModel.findByPk(resetToken.user_id);

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await user.update({
      password_hash: passwordHash,
    });

    /**
     * Mark every password reset token as used.
     */
    await this.passwordResetModel.update(
      {
        used_at: new Date(),
      },
      {
        where: {
          user_id: user.id,
          used_at: null,
        },
      },
    );

    /**
     * Revoke all login sessions.
     */
    await this.authTokensService.revokeAllForUser(user.id);

    return {
      message: 'Password reset successfully.',
    };
  }
}
