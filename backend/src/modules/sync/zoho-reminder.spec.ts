import { ZohoCalendarService } from '../zoho/calendar/zoho-calendar.service';
import { ZohoTasksService } from '../zoho/tasks/zoho-tasks.service';
import { ZohoAuthService } from '../auth/zoho-auth.service';

describe('Zoho reminder API contracts', () => {
  it('uses the account region and fresh etag for calendar updates', async () => {
    const http: any = {
      get: jest.fn(async () => ({ events: [{ uid: 'event', etag: '1234' }] })),
      put: jest.fn(async () => ({})),
    };
    const auth: any = {
      getApiDomain: jest.fn(async () => 'https://www.zohoapis.com.au'),
    };
    const calendar = new ZohoCalendarService(http, auth);
    await calendar.updateEvent('user', 'calendar', 'event', {
      title: 'Updated visit',
      reminders: [{ action: 'email', minutes: 30 }],
    });
    const options = http.put.mock.calls[0][2];
    expect(options.baseURL).toBe('https://calendar.zoho.com.au/api/v1');
    expect(JSON.parse(options.params.eventdata)).toMatchObject({
      etag: '1234',
      title: 'Updated visit',
      reminders: [{ action: 'email', minutes: 30 }],
    });
  });
  it('sets task owners, dates and native reminders using the selected timezone', async () => {
    const http: any = { post: jest.fn(async () => ({})) };
    const auth: any = {
      getApiDomain: jest.fn(async () => 'https://www.zohoapis.in'),
    };
    const tasks = new ZohoTasksService(http, auth);
    await tasks.createTask('user', 'portal', 'project', {
      title: 'Samples',
      due_date: '2026-10-04T18:30:00Z',
      reminderDate: '2026-10-04T18:30:00Z',
      assignee: 'zoho-user',
    });
    const options = http.post.mock.calls[0][2];
    expect(options.params).toMatchObject({
      end_date: '10-05-2026',
      start_date: '10-05-2026',
      person_responsible: 'zoho-user',
    });
    expect(
      JSON.parse(options.params.reminder_string).reminder[0],
    ).toMatchObject({
      custom_date: '10-05-2026',
      reminder_time: '09:00',
      reminder_notify_users: 'owner',
    });
  });
  it('retains existing OAuth permissions when adding reminder scopes', async () => {
    const tokens: any = {
      findOne: jest.fn(async () => ({
        scope: 'ZohoBigin.modules.ALL ZohoCalendar.event.READ',
      })),
    };
    const config: any = {
      get: jest.fn(() => ['WorkDrive.files.ALL']),
      getOrThrow: jest.fn(
        (key) =>
          ({
            'zoho.clientId': 'client',
            'zoho.redirectUri': 'https://erp.example/callback',
            'zoho.accountsBaseUrl': 'https://accounts.zoho.in',
          })[key],
      ),
    };
    const auth = new ZohoAuthService(tokens, config);
    const url = new URL(
      await auth.buildAdditionalAuthorizationUrl('user', 'signed-state', [
        'ZohoCalendar.event.ALL',
      ]),
    );
    expect(url.searchParams.get('scope')?.split(',')).toEqual(
      expect.arrayContaining([
        'WorkDrive.files.ALL',
        'ZohoBigin.modules.ALL',
        'ZohoCalendar.event.READ',
        'ZohoCalendar.event.ALL',
      ]),
    );
  });
});
