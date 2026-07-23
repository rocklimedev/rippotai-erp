import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ActivityLog } from './models/activity-log.model';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogForProjectService } from './services/activity-log-project.service';
import { ActivityLogForVendorService } from './services/activity-log-vendors.service';
import { ActivityLogForQuotationService } from './services/activity-log-quotation.service';
import { ActivityLogForBriefService } from './services/activity-log-brief.service';
import { ActivityLogForUserService } from './services/activity-log-user.service';
import { ActivityLogForTaskService } from './services/activity-log-task.service';
import { ActivityLogForSiteRecceService } from './services/activity-log-site-recce.service';
import { ActivityLogForLeadService } from './services/activity-log-lead.service';
import { ActivityLogForClientService } from './services/activity-log-client.service';
import { ActivityLogForCalendarService } from './services/activity-log-calendar.service';
@Module({
  imports: [SequelizeModule.forFeature([ActivityLog])],
  controllers: [ActivityLogsController],
  providers: [
    ActivityLogsService,
    ActivityLogForProjectService, // 🔥 ADD THIS
    ActivityLogForVendorService,
    ActivityLogForQuotationService,
    ActivityLogForBriefService,
    ActivityLogForUserService,
    ActivityLogForTaskService,
    ActivityLogForSiteRecceService,
    ActivityLogForLeadService,
    ActivityLogForClientService,
    ActivityLogForCalendarService,
  ],
  exports: [
    ActivityLogsService,
    ActivityLogForProjectService, // 🔥 EXPORT THIS TOO
    ActivityLogForVendorService,
    ActivityLogForQuotationService,
    ActivityLogForBriefService,
    ActivityLogForUserService,
    ActivityLogForTaskService,
    ActivityLogForSiteRecceService,
    ActivityLogForLeadService,
    ActivityLogForClientService,
    ActivityLogForCalendarService,
  ],
})
export class ActivityLogsModule {}
