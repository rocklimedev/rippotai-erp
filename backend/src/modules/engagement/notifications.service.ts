import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from './models/notification.model';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
  ) {}

  create(dto: CreateNotificationDto): Promise<Notification> {
    return this.notificationModel.create({ ...dto } as any);
  }

  findAllForUser(user_id: string, unreadOnly = false): Promise<Notification[]> {
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
