import { ScheduledJobsModule } from '@/common/jobs/scheduled-jobs.module';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Task } from '../tasks/models/task.model';
import { CalendarEvent } from '../calendar/models/calender-event.model';
import { ZohoModule } from '../zoho/zoho.module';
import {
  ReminderSyncSettings,
  ReminderSyncRecord,
} from './models/reminder-sync.model';
import { ReminderSyncService } from './reminder-sync.service';
import { SyncController } from './sync.controller';
import { TaskSyncService } from './task-sync.service';
import { CalendarSyncService } from './sync-calendar.service';
import { AuthModule } from '../auth/auth.module';
import { LocalZohoSyncService } from './local-zoho-sync.service';
import { TaskZohoSyncController } from './task-zoho-sync.controller';
import { CalendarZohoSyncController } from './calendar-zoho-sync.controller';
@Module({
  imports: [
    ScheduledJobsModule,
    SequelizeModule.forFeature([
      Task,
      CalendarEvent,
      ReminderSyncSettings,
      ReminderSyncRecord,
    ]),
    ZohoModule,
    AuthModule,
  ],
  controllers: [
    SyncController,
    TaskZohoSyncController,
    CalendarZohoSyncController,
  ],
  providers: [
    ReminderSyncService,
    TaskSyncService,
    CalendarSyncService,
    LocalZohoSyncService,
  ],
  exports: [TaskSyncService, CalendarSyncService],
})
export class SyncModule {}
