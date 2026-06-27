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

    console.log('RAW TOKEN:', rawToken);
    console.log('HASH SAVED:', tokenHash);

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
      },
    };
  }

  async getCurrentUser(token: string) {
    if (!token) {
      throw new UnauthorizedException('No token');
    }

    let payload: any;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      throw new UnauthorizedException('Invalid JWT');
    }

    console.log('JWT PAYLOAD:', payload);

    const tokenHash = createHash('sha256').update(payload.jti).digest('hex');

    console.log('HASH LOOKUP:', tokenHash);

    const authToken = await this.authTokensService.findByHash(tokenHash);

    console.log('TOKEN FROM DB:', authToken);

    if (!authToken) {
      throw new UnauthorizedException('Invalid or revoked token');
    }

    if (authToken.revoked_at) {
      throw new UnauthorizedException('Token revoked');
    }

    if (new Date(authToken.expires_at) < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    await this.authTokensService.touchLastUsed(authToken.id);

    return {
      id: authToken.user.id,
      name: authToken.user.name,
      email: authToken.user.email,
      role: authToken.user.role?.name,
      role_id: authToken.user.role_id,
    };
  }
  // In AuthService class
  async getCurrentUserFromPayload(payload: any) {
    const tokenHash = createHash('sha256').update(payload.jti).digest('hex');

    const authToken = await this.authTokensService.findByHash(tokenHash);

    if (!authToken) {
      throw new UnauthorizedException('Invalid or revoked token');
    }

    if (authToken.revoked_at) {
      throw new UnauthorizedException('Token revoked');
    }

    if (new Date(authToken.expires_at) < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    await this.authTokensService.touchLastUsed(authToken.id);

    return {
      id: authToken.user.id,
      name: authToken.user.name,
      email: authToken.user.email,
      role: authToken.user.role?.name,
      role_id: authToken.user.role_id,
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
}
