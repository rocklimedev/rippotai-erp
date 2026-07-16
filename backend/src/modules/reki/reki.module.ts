import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { SiteRecce } from './models/site-recce.model';
import { SiteRecceFloor } from './models/site-recce-floor.model';
import { SiteRecceRoom } from './models/site-recce-room.model';
import { SiteLayoutAttachment } from './models/site-layout-attachment.model';
import { SiteImageAttachment } from './models/site-image-attachment.model';
import { SiteRecceDocument } from './models/site-recce-document.model';

import { SiteRecceController } from './reki.controller'; // <-- ADD
import { SiteRecceService } from './reki.service';

import { DocumentsModule } from '../documents/document.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      SiteRecce,
      SiteRecceFloor,
      SiteRecceRoom,
      SiteLayoutAttachment,
      SiteImageAttachment,
      SiteRecceDocument,
    ]),
    DocumentsModule,
  ],
  controllers: [SiteRecceController], // <-- ADD THIS
  providers: [SiteRecceService],
  exports: [SequelizeModule, SiteRecceService],
})
export class SiteRecceModule {}
