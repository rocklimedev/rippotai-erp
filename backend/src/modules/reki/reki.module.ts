import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { SiteRecce } from './models/site-recce.model';
import { SiteRecceFloor } from './models/site-recce-floor.model';
import { SiteRecceRoom } from './models/site-recce-room.model';
import { SiteLayoutAttachment } from './models/site-layout-attachment.model';
import { SiteImageAttachment } from './models/site-image-attachment.model';
import { SiteRecceDocument } from './models/site-recce-document.model';

import { SiteRecceController } from './reki.controller';
import { SiteRecceService } from './reki.service';

import { DocumentsModule } from '../documents/document.module';
import { Document } from '../documents/models/document.model';

import { NotificationsModule } from '../engagement/notifications.module';
import { ActivityLogsModule } from '../engagement/activity-logs.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      SiteRecce,
      SiteRecceFloor,
      SiteRecceRoom,
      SiteLayoutAttachment,
      SiteImageAttachment,
      SiteRecceDocument,
      Document,
    ]),
    DocumentsModule,

    NotificationsModule,
    ActivityLogsModule,
  ],
  controllers: [SiteRecceController],
  providers: [SiteRecceService],
  exports: [SequelizeModule, SiteRecceService],
})
export class SiteRecceModule {}
