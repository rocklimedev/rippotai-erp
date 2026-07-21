import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { randomUUID, createHash } from 'crypto';

import { User } from '../users/models/user.model';
import { Role } from '@/modules/rbac/models/role.model';
import { AuthTokensService } from './auth-tokens.service';
import { AuthTokenType } from '@/common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,

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

    // NOTE: authTokensService.findByHash must include the User association
    // with these attributes (phone, job_title, avatar_url) as well, or
    // authToken.user below simply won't have them. That file wasn't
    // provided here, so double check its `attributes`/`include` list.
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
    if (!token) throw new UnauthorizedException('No token provided');

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err: any) {
      throw new UnauthorizedException(`Invalid JWT: ${err.name}`);
    }

    return this.getCurrentUserFromPayload(payload);
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
}
