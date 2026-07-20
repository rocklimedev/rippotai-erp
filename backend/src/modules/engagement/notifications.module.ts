import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Notification } from './models/notification.model';
import { User } from '@/modules/users/models/user.model';

import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from '../../common/gateway/notification.gateway';
import { NotificationBroadcastService } from './notification-broadcast.service';
import { NotificationForProjectService } from './services/notification-project.service';
import { NotificationsController } from './notifications.controller';
import { RedisModule } from '@/common/redis/redis.module';
import { NotificationClientService } from './services/notification-client.service';
import { NotificationVendorService } from './services/notification-vendor.service';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([Notification, User]), RedisModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationBroadcastService,
    NotificationForProjectService,
    NotificationClientService,
    NotificationVendorService,
  ],
  exports: [
    NotificationsService,
    NotificationsGateway,
    NotificationBroadcastService,
    NotificationForProjectService,
    NotificationClientService,
  ],
})
export class NotificationsModule {}
