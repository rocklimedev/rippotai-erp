import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { NotificationsModule } from '../engagement/notifications.module';
import { ActivityLogsModule } from '../engagement/activity-logs.module';

import { ProjectBrief } from './models/project-brief.model';
import { BriefController } from './brief.controller';
import { BriefService } from './brief.service';

@Module({
  imports: [
    SequelizeModule.forFeature([ProjectBrief]),
    NotificationsModule,
    ActivityLogsModule,
  ],
  controllers: [BriefController],
  providers: [BriefService],
  exports: [BriefService],
})
export class BriefModule {}
