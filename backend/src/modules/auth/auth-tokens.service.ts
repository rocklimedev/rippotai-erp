import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';

import { AuthToken } from './models/auth-token.model';
import { CreateAuthTokenDto } from './dto/auth-token.dto';
import { User } from '@/modules/users/models/user.model';
import { Role } from '@/modules/rbac/models/role.model';
import type { CurrentUserPayload } from '@/common/interfaces/current-user-payload.interface';
import { RolePermission } from '../rbac/models/role_permission.model';
import { Permission } from '../rbac/models/permission.model';

export const SESSION_TOUCH_INTERVAL_MS = 60_000;
const MAX_RECENT_TOUCHES = 10_000;

const SESSION_ATTRIBUTES = [
  'id',
  'user_id',
  'type',
  'device_info',
  'ip_address',
  'expires_at',
  'revoked_at',
  'last_used_at',
  'created_at',
];

@Injectable()
export class AuthTokensService {
  private readonly touches = new Map<
    string,
    { at: number; work: Promise<void> }
  >();
  constructor(
    @InjectModel(AuthToken)
    private readonly authTokenModel: typeof AuthToken,
  ) {}

  private isAdmin(actor: CurrentUserPayload): boolean {
    if (!actor?.id?.trim())
      throw new UnauthorizedException('Authenticated actor required');
    return actor.roleName === 'ADMIN' || actor.roleName === 'SUPERADMIN';
  }

  private assertSessionOwner(
    userId: string,
    actor: CurrentUserPayload,
    permission: string,
  ) {
    const admin = this.isAdmin(actor);
    if (actor.id === userId) return;
    if (
      !admin ||
      !Array.isArray(actor.permissions) ||
      !actor.permissions.includes(permission)
    ) {
      throw new ForbiddenException(
        'Cross-user sessions require an administrator and explicit permission',
      );
    }
  }

  private sessionMetadata(token: AuthToken) {
    return Object.fromEntries(
      SESSION_ATTRIBUTES.map((field) => [field, token.get(field)]),
    );
  }

  async listSessions(userId: string, actor: CurrentUserPayload) {
    this.assertSessionOwner(userId, actor, 'sessions:read-any');
    return this.authTokenModel.findAll({
      where: { user_id: userId },
      attributes: SESSION_ATTRIBUTES,
      order: [['created_at', 'DESC']],
      raw: true,
    });
  }

  async revokeSession(id: string, actor: CurrentUserPayload) {
    this.isAdmin(actor);
    const token = await this.authTokenModel.findByPk(id);
    if (!token) throw new NotFoundException('Session not found');
    this.assertSessionOwner(token.user_id, actor, 'sessions:revoke-any');
    await token.update({ revoked_at: new Date() });
    return this.sessionMetadata(token);
  }

  async revokeUserSessions(userId: string, actor: CurrentUserPayload) {
    this.assertSessionOwner(userId, actor, 'sessions:revoke-any');
    return this.revokeAllForUser(userId);
  }

  async deleteSession(id: string, actor: CurrentUserPayload) {
    if (!this.isAdmin(actor))
      throw new ForbiddenException('Only administrators can delete sessions');
    return this.remove(id);
  }

  async create(dto: CreateAuthTokenDto): Promise<AuthToken> {
    return this.authTokenModel.create(dto as any);
  }

  async findAllForUser(user_id: string): Promise<AuthToken[]> {
    return this.authTokenModel.findAll({
      where: { user_id },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          include: [{ model: Role, as: 'role' }],
        },
      ],
    });
  }

  /**
   * Find token by SHA256 hash - This is the critical method for auth
   */
  async findByHash(
    hash: string,
    includePermissions = false,
  ): Promise<AuthToken | null> {
    const result = await this.authTokenModel.findOne({
      where: { token_hash: hash },
      include: [
        {
          model: User,
          as: 'user',
          // Keep authentication independent of unrelated profile columns.
          attributes: [
            'id',
            'name',
            'email',
            'role_id',
            'is_active',
            'email_verified_at',
            'email_verified_address',
            'phone',
            'job_title',
            'avatar_url',
          ],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name'],
              ...(includePermissions
                ? {
                    include: [
                      {
                        model: RolePermission,
                        as: 'rolePermissions',
                        attributes: ['role_id', 'permission_id'],
                        required: false,
                        include: [
                          {
                            model: Permission,
                            attributes: ['id', 'resource', 'action'],
                            required: false,
                          },
                        ],
                      },
                    ],
                  }
                : {}),
            },
          ],
        },
      ],
    });

    return result;
  }
  async touchLastUsed(id: string, lastUsedAt?: Date | null): Promise<void> {
    const now = Date.now();
    if (
      lastUsedAt &&
      now - new Date(lastUsedAt).getTime() < SESSION_TOUCH_INTERVAL_MS
    )
      return;
    const recent = this.touches.get(id);
    if (recent && now - recent.at < SESSION_TOUCH_INTERVAL_MS)
      return recent.work;
    // Deferring the query by a microtask lets parallel requests share the promise.
    const work = Promise.resolve().then(async () => {
      await this.authTokenModel.update(
        { last_used_at: new Date(now) },
        {
          where: {
            id,
            revoked_at: { [Op.is]: null },
            [Op.or]: [
              {
                last_used_at: {
                  [Op.lte]: new Date(now - SESSION_TOUCH_INTERVAL_MS),
                },
              },
              { last_used_at: { [Op.is]: null } },
            ],
          },
        },
      );
    });
    const entry = { at: now, work };
    if (this.touches.size >= MAX_RECENT_TOUCHES)
      this.touches.delete(this.touches.keys().next().value!);
    this.touches.set(id, entry);
    try {
      await work;
    } catch (error) {
      if (this.touches.get(id) === entry) this.touches.delete(id);
      throw error;
    }
  }

  async revoke(id: string): Promise<AuthToken> {
    const token = await this.authTokenModel.findByPk(id);
    if (!token) {
      throw new NotFoundException(`Auth token ${id} not found`);
    }

    await token.update({ revoked_at: new Date() });
    return token;
  }

  async revokeAllForUser(
    user_id: string,
    transaction?: Transaction,
  ): Promise<void> {
    await this.authTokenModel.update(
      { revoked_at: new Date() },
      {
        where: {
          user_id,
          revoked_at: { [Op.is]: null },
        },
        transaction,
      },
    );
  }

  async remove(id: string): Promise<void> {
    const token = await this.authTokenModel.findByPk(id);
    if (!token) throw new NotFoundException(`Auth token ${id} not found`);
    await token.destroy();
  }
}
