import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ActivityLog } from './models/activity-log.model';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogForProjectService } from './services/activity-log-project.service';
import { ActivityLogForVendorService } from './services/activity-log-vendors.service';
import { ActivityLogForQuotationService } from './services/activity-log-quotation.service';
@Module({
  imports: [SequelizeModule.forFeature([ActivityLog])],
  controllers: [ActivityLogsController],
  providers: [
    ActivityLogsService,
    ActivityLogForProjectService, // 🔥 ADD THIS
    ActivityLogForVendorService,
    ActivityLogForQuotationService,
  ],
  exports: [
    ActivityLogsService,
    ActivityLogForProjectService, // 🔥 EXPORT THIS TOO
    ActivityLogForVendorService,
    ActivityLogForQuotationService,
  ],
})
export class ActivityLogsModule {}
