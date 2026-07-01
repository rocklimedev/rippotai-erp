import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { User } from '@/modules/users/models/user.model';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '@/common/enums';

interface BroadcastParams {
  excludedUserId: string;
  type: NotificationType;
  title: string;
  message: string;
}

@Injectable()
export class NotificationBroadcastService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly notificationsService: NotificationsService,
  ) {}

  async broadcast({
    excludedUserId,
    type,
    title,
    message,
  }: BroadcastParams): Promise<void> {
    const users = await this.userModel.findAll({
      where: { id: { [Op.ne]: excludedUserId } },
      attributes: ['id'],
    });

    if (!users.length) return;

    await this.notificationsService.createMany(
      users.map((user) => ({ user_id: user.id, type, title, message })),
    );
  }
}
