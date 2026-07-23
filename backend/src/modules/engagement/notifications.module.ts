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
import { NotificationForBriefService } from './services/notification-brief.service';
import { NotificationForCalendarService } from './services/notification-calendar.service';
import { NotificationForDrawingService } from './services/notification-drawing.service';
import { NotificationForQuotationService } from './services/notification-quotation.service';
import { NotificationForClientService } from './services/notification-client.service';
import { NotificationForVendorService } from './services/notification-vendor.service';
import { NotificationForUserService } from './services/notification-user.service';
import { NotificationForTaskService } from './services/notification-task.service';
import { NotificationForSiteRecceService } from './services/notification-site-recce.service';
import { NotificationForLeadService } from './services/notification-lead.service';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([Notification, User]), RedisModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationBroadcastService,
    NotificationForProjectService,
    NotificationForProjectService,
    NotificationForBriefService,
    NotificationForCalendarService,
    NotificationForDrawingService,
    NotificationForQuotationService,
    NotificationForClientService,
    NotificationForVendorService,
    NotificationForUserService,
    NotificationForTaskService,
    NotificationForSiteRecceService,
    NotificationForLeadService,
  ],
  exports: [
    NotificationsService,
    NotificationsGateway,
    NotificationBroadcastService,
    NotificationForProjectService,
    NotificationForProjectService,
    NotificationForBriefService,
    NotificationForCalendarService,
    NotificationForDrawingService,
    NotificationForQuotationService,
    NotificationForClientService,
    NotificationForVendorService,
    NotificationForUserService,
    NotificationForTaskService,
    NotificationForSiteRecceService,
    NotificationForLeadService,
  ],
})
export class NotificationsModule {}
