import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '@/common/enums';
import { Client } from '@/modules/clients/models/client.model';
interface NotifyOptions {
  recipientUserIds: string[]; // who should receive this notification
  actorUserId?: string; // who triggered it (optional, for future use)
}

@Injectable()
export class NotificationClientService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async notifyClientCreated(
    client: Client,
    options: NotifyOptions,
  ): Promise<void> {
    await this.dispatch(
      options.recipientUserIds,
      NotificationType.CLIENT_CREATED, // TODO: match your actual enum member
      'New client added',
      `Client "${client.name ?? client.slug}" was created.`,
      client,
    );
  }

  async notifyClientUpdated(
    client: Client,
    options: NotifyOptions,
  ): Promise<void> {
    await this.dispatch(
      options.recipientUserIds,
      NotificationType.CLIENT_UPDATED,
      'Client updated',
      `Client "${client.name ?? client.slug}" was updated.`,
      client,
    );
  }

  async notifyClientDeleted(
    client: Client,
    options: NotifyOptions,
  ): Promise<void> {
    await this.dispatch(
      options.recipientUserIds,
      NotificationType.CLIENT_DELETED,
      'Client removed',
      `Client "${client.name ?? client.slug}" was deleted.`,
      client,
    );
  }

  async notifyClientRestored(
    client: Client,
    options: NotifyOptions,
  ): Promise<void> {
    await this.dispatch(
      options.recipientUserIds,
      NotificationType.CLIENT_RESTORED,
      'Client restored',
      `Client "${client.name ?? client.slug}" was restored.`,
      client,
    );
  }

  private async dispatch(
    recipientUserIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    client: Client,
  ): Promise<void> {
    if (!recipientUserIds?.length) return;

    const dtos = recipientUserIds.map((user_id) => ({
      user_id,
      type,
      title,
      message,
      entity_type: 'client',
      entity_id: client.id,
    }));

    await this.notificationsService.createMany(dtos as any);
  }
}
