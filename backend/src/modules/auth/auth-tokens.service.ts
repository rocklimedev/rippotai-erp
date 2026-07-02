import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { AuthToken } from './models/auth-token.model';
import { CreateAuthTokenDto } from './dto/auth-token.dto';
import { User } from '@/modules/users/models/user.model';
import { Role } from '@/modules/rbac/models/role.model';

@Injectable()
export class AuthTokensService {
  constructor(
    @InjectModel(AuthToken)
    private readonly authTokenModel: typeof AuthToken,
  ) {}

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
  async findByHash(hash: string): Promise<AuthToken | null> {
    const result = await this.authTokenModel.findOne({
      where: { token_hash: hash },
      include: [
        {
          model: User,
          as: 'user',
          include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
        },
      ],
      logging: console.log, // shows the actual SQL + JOINs executed
    });

    return result;
  }
  async touchLastUsed(id: string): Promise<void> {
    await this.authTokenModel.update(
      { last_used_at: new Date() },
      { where: { id } },
    );
  }

  async revoke(id: string): Promise<AuthToken> {
    const token = await this.authTokenModel.findByPk(id);
    if (!token) {
      throw new NotFoundException(`Auth token ${id} not found`);
    }

    await token.update({ revoked_at: new Date() });
    return token;
  }

  async revokeAllForUser(user_id: string): Promise<void> {
    await this.authTokenModel.update(
      { revoked_at: new Date() },
      {
        where: {
          user_id,
          revoked_at: { [Op.is]: null },
        },
      },
    );
  }

  async remove(id: string): Promise<void> {
    const token = await this.authTokenModel.findByPk(id);
    if (!token) throw new NotFoundException(`Auth token ${id} not found`);
    await token.destroy();
  }
}
