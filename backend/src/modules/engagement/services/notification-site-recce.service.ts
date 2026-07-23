import { Injectable } from '@nestjs/common';

import { NotificationBroadcastService } from '../notification-broadcast.service';
import { NotificationType } from '@/common/enums';
import { SiteRecce } from '@/modules/reki/models/site-recce.model';
@Injectable()
export class NotificationForSiteRecceService {
  constructor(
    private readonly notificationBroadcastService: NotificationBroadcastService,
  ) {}

  async notifySiteRecceCreated(
    recce: SiteRecce,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.SITE_RECCE_CREATED,
      title: 'New Site Recce Created',
      message: `Site Recce for project "${recce.project?.name || 'Unknown'}" has been created.`,
    });
  }

  async notifySiteRecceUpdated(
    recce: SiteRecce,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.SITE_RECCE_UPDATED,
      title: 'Site Recce Updated',
      message: `Site Recce #${recce.id} has been updated.`,
    });
  }

  async notifySiteRecceStatusChanged(
    recce: SiteRecce,
    oldStatus: string,
    newStatus: string,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.SITE_RECCE_STATUS_CHANGED,
      title: 'Site Recce Status Changed',
      message: `Site Recce for project "${recce.project?.name || 'Unknown'}" changed from ${oldStatus} to ${newStatus}.`,
    });
  }

  async notifySiteRecceDeleted(
    recceId: string,
    projectName: string | null,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.SITE_RECCE_DELETED,
      title: 'Site Recce Deleted',
      message: `Site Recce has been deleted for project "${projectName || 'Unknown'}".`,
    });
  }
}
