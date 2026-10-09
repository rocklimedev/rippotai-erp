import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@/common/redis/redis.module';
import { Notification } from './models/notification.model';
import { CreateNotificationDto } from './dto/notification.dto';
import { NotificationsGateway } from '../../common/gateway/notification.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
    private readonly notificationsGateway: NotificationsGateway,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private readonly logger = new Logger(NotificationsService.name);

  private async invalidate(userIds: string[]) {
    try {
      await this.redis.del(...userIds.map((id) => this.unreadKey(id)));
    } catch {
      this.logger.warn(
        'Notification cache unavailable; database remains authoritative',
      );
    }
  }

  private unreadKey(userId: string) {
    return `notifications:unread:${userId}`;
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.notificationModel.create(dto as any);

    await this.invalidate([dto.user_id]);

    this.notificationsGateway.emitToUser(
      dto.user_id,
      notification.toJSON() as any,
    );

    return notification;
  }

  async createMany(dtos: CreateNotificationDto[]): Promise<void> {
    if (!dtos.length) return;

    const created = await this.notificationModel.bulkCreate(dtos as any[], {
      returning: true,
    });

    const affectedUsers = new Set(created.map((n) => n.user_id));
    if (affectedUsers.size) {
      await this.invalidate([...affectedUsers]);
    }

    for (const notification of created) {
      this.notificationsGateway.emitToUser(
        notification.user_id,
        notification.toJSON() as any,
      );
    }
  }

  async getUnreadCount(user_id: string): Promise<number> {
    return this.notificationModel.count({ where: { user_id, is_read: false } });
  }

  async findAllForUser(
    user_id: string,
    unreadOnly = false,
  ): Promise<Notification[]> {
    const where: Record<string, any> = { user_id };
    if (unreadOnly) where.is_read = false;

    return this.notificationModel.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async markAsRead(id: string, user_id: string): Promise<Notification> {
    const notification = await this.notificationModel.findOne({
      where: { id, user_id },
    });
    if (!notification)
      throw new NotFoundException(`Notification ${id} not found`);

    if (!notification.is_read)
      await notification.update({ is_read: true, read_at: new Date() });
    await this.invalidate([notification.user_id]);
    return notification;
  }

  async markAllAsRead(user_id: string): Promise<void> {
    await this.notificationModel.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id, is_read: false } },
    );
    await this.invalidate([user_id]);
  }

  async remove(id: string, user_id: string): Promise<void> {
    const notification = await this.notificationModel.findOne({
      where: { id, user_id },
    });
    if (!notification)
      throw new NotFoundException(`Notification ${id} not found`);

    await notification.destroy();
    await this.invalidate([notification.user_id]);
  }
  async deleteUserNotifications(user_id: string): Promise<void> {
    await this.notificationModel.destroy({
      where: { user_id },
    });

    // Clear unread count cache
    await this.invalidate([user_id]);
  }
}
