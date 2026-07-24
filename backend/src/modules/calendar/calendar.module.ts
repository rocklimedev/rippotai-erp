import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { CalendarEvent } from './models/calender-event.model';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { NotificationsModule } from '../engagement/notifications.module';
import { ActivityLogsModule } from '../engagement/activity-logs.module';

@Module({
  imports: [
    SequelizeModule.forFeature([CalendarEvent]),
    NotificationsModule,
    ActivityLogsModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
