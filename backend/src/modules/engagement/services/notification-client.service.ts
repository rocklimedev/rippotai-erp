import { Injectable } from '@nestjs/common';

import { NotificationBroadcastService } from '../notification-broadcast.service';
import { NotificationType } from '@/common/enums';
import { Client } from '@/modules/clients/models/client.model';
@Injectable()
export class NotificationForClientService {
  constructor(
    private readonly notificationBroadcastService: NotificationBroadcastService,
  ) {}

  async notifyClientCreated(client: Client, actorId: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.CLIENT_CREATED,
      title: 'New Client Added',
      message: `Client "${client.name}" has been added to the system.`,
    });
  }

  async notifyClientUpdated(client: Client, actorId: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.CLIENT_UPDATED,
      title: 'Client Updated',
      message: `Client "${client.name}" has been updated.`,
    });
  }

  async notifyClientDeleted(
    clientName: string,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.CLIENT_DELETED,
      title: 'Client Deleted',
      message: `Client "${clientName}" has been deleted.`,
    });
  }

  async notifyClientRestored(client: Client, actorId: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.CLIENT_RESTORED,
      title: 'Client Restored',
      message: `Client "${client.name}" has been restored.`,
    });
  }
}
