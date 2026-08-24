import { Injectable } from '@nestjs/common';

import { NotificationBroadcastService } from '../notification-broadcast.service';
import { NotificationType } from '@/common/enums';

import { ProjectBrief } from '@/modules/brief/models/project-brief.model';

@Injectable()
export class NotificationForBriefService {
  constructor(
    private readonly notificationBroadcastService: NotificationBroadcastService,
  ) {}

  // =========================================================
  // BRIEF CREATED
  // =========================================================

  async notifyBriefCreated(
    brief: ProjectBrief,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.BRIEF_CREATED,
      title: 'Brief Created',
      message: `Project brief version ${brief.version} has been created.`,
    });
  }

  // =========================================================
  // BRIEF UPDATED
  // =========================================================

  async notifyBriefUpdated(
    brief: ProjectBrief,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.BRIEF_UPDATED,
      title: 'Brief Updated',
      message: `Project brief version ${brief.version} has been updated.`,
    });
  }

  // =========================================================
  // BRIEF DELETED
  // =========================================================

  async notifyBriefDeleted(
    brief: ProjectBrief,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.BRIEF_DELETED,
      title: 'Brief Deleted',
      message: `Project brief version ${brief.version} has been deleted.`,
    });
  }
}
