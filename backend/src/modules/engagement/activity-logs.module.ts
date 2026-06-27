import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ActivityLog } from './models/activity-log.model';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogForProjectService } from './services/activity-log-project.service';
@Module({
  imports: [SequelizeModule.forFeature([ActivityLog])],
  controllers: [ActivityLogsController],
  providers: [
    ActivityLogsService,
    ActivityLogForProjectService, // 🔥 ADD THIS
  ],
  exports: [
    ActivityLogsService,
    ActivityLogForProjectService, // 🔥 EXPORT THIS TOO
  ],
})
export class ActivityLogsModule {}
