import { BadRequestException, Injectable } from '@nestjs/common';
import { ReminderSyncService } from './reminder-sync.service';
import { SyncOptionsDto } from './dto/sync-options.dto';
@Injectable()
export class CalendarSyncService {
  constructor(private readonly reminders: ReminderSyncService) {}
  fullSync(userId: string, options: SyncOptionsDto = {}) {
    return this.reminders.sync(userId, 'calendar', options);
  }
  pushEventsToZoho(userId: string, options: SyncOptionsDto = {}) {
    return this.fullSync(userId, options);
  }
  pullEventsFromZoho(_userId: string, _options: SyncOptionsDto = {}) {
    throw new BadRequestException(
      'Local database owns calendar data. Pull sync is disabled.',
    );
  }
  getSyncStatus(userId: string) {
    return this.reminders.status(userId, 'calendar');
  }
}
