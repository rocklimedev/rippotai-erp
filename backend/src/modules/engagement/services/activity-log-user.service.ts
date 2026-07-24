import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ActivityLog } from '../models/activity-log.model';
import { ActivityAction } from '@/common/enums';
import { User } from '@/modules/users/models/user.model';
@Injectable()
export class ActivityLogForUserService {
  constructor(
    @InjectModel(ActivityLog)
    private readonly activityLogModel: typeof ActivityLog,
  ) {}

  async logUserCreated(
    user: User,
    actorId?: string,
    actor?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: actorId || null,
      user_email: actor?.email || 'system',
      user_role: actor?.role?.name || 'system',
      action: ActivityAction.USER_CREATED,
      entity_type: 'User',
      entity_id: user.id,
      entity_label: user.name,
      changes: {
        email: user.email,
        role_id: user.role_id,
        is_active: user.is_active,
      },
      ip_address: actor?.ip_address,
      user_agent: actor?.user_agent,
    } as any);
  }

  async logUserUpdated(
    user: User,
    actorId?: string,
    actor?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: actorId || null,
      user_email: actor?.email || 'system',
      user_role: actor?.role?.name || 'system',
      action: ActivityAction.USER_UPDATED,
      entity_type: 'User',
      entity_id: user.id,
      entity_label: user.name,
      changes: {
        name: user.name,
        email: user.email,
        job_title: user.job_title,
        role_id: user.role_id,
        is_active: user.is_active,
      },
      ip_address: actor?.ip_address,
      user_agent: actor?.user_agent,
    } as any);
  }

  async logUserProfileUpdated(user: User, actorId: string): Promise<void> {
    await this.activityLogModel.create({
      user_id: actorId,
      user_email: user.email,
      user_role: user.role?.name || 'user',
      action: ActivityAction.USER_PROFILE_UPDATED,
      entity_type: 'User',
      entity_id: user.id,
      entity_label: user.name,
      changes: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        job_title: user.job_title,
      },
    } as any);
  }

  async logAvatarUpdated(user: User, actorId: string): Promise<void> {
    await this.activityLogModel.create({
      user_id: actorId,
      user_email: user.email,
      user_role: user.role?.name || 'user',
      action: ActivityAction.USER_AVATAR_UPDATED,
      entity_type: 'User',
      entity_id: user.id,
      entity_label: user.name,
      changes: { avatar_updated: true },
    } as any);
  }

  async logUserDeactivated(
    user: User,
    actorId?: string,
    actor?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: actorId || null,
      user_email: actor?.email || 'system',
      user_role: actor?.role?.name || 'system',
      action: ActivityAction.USER_DEACTIVATED,
      entity_type: 'User',
      entity_id: user.id,
      entity_label: user.name,
      changes: { is_active: false },
      ip_address: actor?.ip_address,
      user_agent: actor?.user_agent,
    } as any);
  }

  async logUserDeleted(
    userName: string,
    email: string,
    userId: string,
    actorId?: string,
    actor?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: actorId || null,
      user_email: actor?.email || 'system',
      user_role: actor?.role?.name || 'system',
      action: ActivityAction.USER_DELETED,
      entity_type: 'User',
      entity_id: userId,
      entity_label: userName,
      changes: { deleted_email: email },
      ip_address: actor?.ip_address,
      user_agent: actor?.user_agent,
    } as any);
  }
}
