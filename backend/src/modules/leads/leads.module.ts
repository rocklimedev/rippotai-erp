import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

import { Lead } from './models/lead.model';
import { LeadNote } from './models/lead-note.model';
import { LeadActivity } from './models/lead-activity.model';

import { LeadActivityService } from './lead-activity.service';

import { NotificationsModule } from '../engagement/notifications.module';
import { ActivityLogsModule } from '../engagement/activity-logs.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Lead, LeadNote, LeadActivity]),
    NotificationsModule,
    ActivityLogsModule,
  ],

  controllers: [LeadsController],

  providers: [LeadsService, LeadActivityService],

  exports: [LeadsService, LeadActivityService],
})
export class LeadsModule {}
