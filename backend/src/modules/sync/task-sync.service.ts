import { BadRequestException, Injectable } from '@nestjs/common';
import { ReminderSyncService } from './reminder-sync.service';
import { SyncOptionsDto } from './dto/sync-options.dto';
@Injectable()
export class TaskSyncService {
  constructor(private readonly reminders: ReminderSyncService) {}
  fullSync(userId: string, options: SyncOptionsDto = {}) {
    return this.reminders.sync(userId, 'tasks', options);
  }
  pushTasksToZoho(userId: string, options: SyncOptionsDto = {}) {
    return this.fullSync(userId, options);
  }
  pullTasksFromZoho(_userId: string, _options: SyncOptionsDto = {}) {
    throw new BadRequestException(
      'Local database owns task data. Pull sync is disabled.',
    );
  }
  getSyncStatus(userId: string) {
    return this.reminders.status(userId, 'tasks');
  }
}
