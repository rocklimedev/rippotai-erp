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
@Module({
  imports: [
    SequelizeModule.forFeature([
      Task,
      CalendarEvent,
      ReminderSyncSettings,
      ReminderSyncRecord,
    ]),
    ZohoModule,
  ],
  controllers: [SyncController],
  providers: [ReminderSyncService, TaskSyncService, CalendarSyncService],
  exports: [TaskSyncService, CalendarSyncService],
})
export class SyncModule {}
