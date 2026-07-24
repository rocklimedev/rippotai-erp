import { Injectable } from '@nestjs/common';

import { NotificationBroadcastService } from '../notification-broadcast.service';
import { NotificationType } from '@/common/enums';
import { User } from '@/modules/users/models/user.model';
@Injectable()
export class NotificationForUserService {
  constructor(
    private readonly notificationBroadcastService: NotificationBroadcastService,
  ) {}

  async notifyUserCreated(user: User, actorId?: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.USER_CREATED,
      title: 'New User Added',
      message: `User "${user.name}" (${user.email}) has been added to the system.`,
    });
  }

  async notifyUserUpdated(user: User, actorId?: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.USER_UPDATED,
      title: 'User Updated',
      message: `User "${user.name}" has been updated.`,
    });
  }

  async notifyUserProfileUpdated(user: User, actorId: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.USER_PROFILE_UPDATED,
      title: 'Profile Updated',
      message: `Your profile has been updated successfully.`,
    });
  }

  async notifyAvatarUpdated(user: User, actorId: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.USER_AVATAR_UPDATED,
      title: 'Avatar Updated',
      message: `Avatar for user "${user.name}" has been updated.`,
    });
  }

  async notifyUserDeactivated(user: User, actorId?: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.USER_DEACTIVATED,
      title: 'User Deactivated',
      message: `User "${user.name}" has been deactivated.`,
    });
  }

  async notifyUserDeleted(
    userName: string,
    email: string,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.USER_DELETED,
      title: 'User Deleted',
      message: `User "${userName}" (${email}) has been deleted.`,
    });
  }
}
