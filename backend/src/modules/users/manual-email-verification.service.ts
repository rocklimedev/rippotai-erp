import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { User } from './models/user.model';
import { AuthToken } from '../auth/models/auth-token.model';
import { ActivityLog } from '../engagement/models/activity-log.model';
import { ActivityAction } from '@/common/enums';

@Injectable()
export class ManualEmailVerificationService {
  constructor(
    @InjectModel(User) private readonly users: typeof User,
    @InjectModel(AuthToken) private readonly sessions: typeof AuthToken,
    @InjectModel(ActivityLog) private readonly activity: typeof ActivityLog,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  async update(id: string, verified: boolean, actor: any) {
    if (
      !actor?.id ||
      !['ADMIN', 'SUPERADMIN'].includes(actor.roleName) ||
      !Array.isArray(actor.permissions) ||
      !actor.permissions.includes('users:update')
    ) {
      throw new ForbiddenException(
        'Administrator with users:update permission required.',
      );
    }
    return this.sequelize.transaction(async (transaction) => {
      const user = await this.users.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user) throw new NotFoundException('User not found');
      const previous = {
        email_verified_at: user.email_verified_at,
        email_verified_address: user.email_verified_address,
      };
      const now = new Date();
      await user.update(
        {
          email_verified_at: verified ? now : null,
          email_verified_address: verified ? user.email : null,
        },
        { transaction },
      );
      await this.sessions.update(
        { revoked_at: now },
        { where: { user_id: id, revoked_at: null }, transaction },
      );
      await this.activity.create(
        {
          user_id: actor.id,
          user_email: actor.email,
          user_role: actor.roleName,
          action: ActivityAction.USER_UPDATED,
          entity_type: 'User',
          entity_id: id,
          entity_label: user.name,
          changes: {
            email_verification: {
              method: 'manual_admin',
              verified,
              email: user.email,
              previous,
            },
          },
        } as any,
        { transaction },
      );
      return {
        message: verified
          ? 'Email manually marked as verified.'
          : 'Email marked as unverified.',
        email_verified_at: user.email_verified_at,
        email_verified_address: user.email_verified_address,
      };
    });
  }
}
