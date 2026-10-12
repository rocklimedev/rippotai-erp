import { BadRequestException, Injectable } from '@nestjs/common';
import { ZohoAuthService } from '../auth/zoho-auth.service';
import { OAuthStateService } from '../auth/oauth/oauth-state.service';
import { ReminderSyncService } from './reminder-sync.service';
import { ReminderKind } from './models/reminder-sync.model';
import { ReminderSettingsDto } from './dto/reminder-settings.dto';

// Personal app connections use existing task/calendar permissions and fixed
// provider scopes. Administrative /sync routes retain their original policy.
@Injectable()
export class LocalZohoSyncService {
  constructor(private readonly reminders: ReminderSyncService,
    private readonly auth: ZohoAuthService, private readonly state: OAuthStateService) {}

  async status(userId: string, kind: ReminderKind) {
    const [status, connected] = await Promise.all([
      this.reminders.status(userId, kind), this.auth.isConnected(userId),
    ]);
    return { ...status, connected };
  }

  async authorize(userId: string, kind: ReminderKind) {
    const scopes = kind === 'tasks'
      ? ['ZohoProjects.tasks.ALL', 'ZohoProjects.portals.READ', 'ZohoProjects.projects.READ', 'ZohoProjects.users.READ']
      : ['ZohoCalendar.calendar.READ', 'ZohoCalendar.event.ALL'];
    const state = this.state.sign({ userId, provider: 'zoho' });
    return { authorizationUrl: await this.auth.buildAdditionalAuthorizationUrl(userId, state, scopes) };
  }

  async save(userId: string, kind: ReminderKind, dto: ReminderSettingsDto) {
    if (dto.enabled && !(await this.auth.isConnected(userId))) {
      throw new BadRequestException('Connect your Zoho account before enabling sync.');
    }
    if (dto.enabled && kind === 'tasks') {
      const users = await this.reminders.taskUsers(userId, dto.portal_id || '', dto.project_id || '');
      if (!users.some(user => user.id === dto.assignee_id)) {
        throw new BadRequestException('Choose your Zoho user from the selected project.');
      }
    }
    return this.reminders.saveSettings(userId, kind, dto);
  }
}
