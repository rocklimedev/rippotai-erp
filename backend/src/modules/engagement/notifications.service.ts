import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from './models/notification.model';
import { CreateNotificationDto } from './dto/notification.dto';
import { NotificationsGateway } from '../../common/gateway/notification.gateway';
@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.notificationModel.create(dto as any);

    this.notificationsGateway.emitToUser(
      dto.user_id,
      notification.toJSON() as any,
    );

    return notification;
  }

  async createMany(dtos: CreateNotificationDto[]): Promise<void> {
    if (!dtos.length) return;

    // NOTE: `returning: true` only works on Postgres. On MySQL/SQLite you
    // won't get rows back from bulkCreate — emit from `dtos` directly instead
    // if you're not on Postgres.
    const created = await this.notificationModel.bulkCreate(dtos as any[], {
      returning: true,
    });

    for (const notification of created) {
      this.notificationsGateway.emitToUser(
        notification.user_id,
        notification.toJSON() as any,
      );
    }
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

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationModel.findByPk(id);
    if (!notification)
      throw new NotFoundException(`Notification ${id} not found`);

    await notification.update({ is_read: true, read_at: new Date() });
    return notification;
  }

  async markAllAsRead(user_id: string): Promise<void> {
    await this.notificationModel.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id, is_read: false } },
    );
  }

  async remove(id: string): Promise<void> {
    const notification = await this.notificationModel.findByPk(id);
    if (!notification)
      throw new NotFoundException(`Notification ${id} not found`);

    await notification.destroy();
  }
}
