import 'reflect-metadata';
jest.mock('../auth/oauth/oauth-state.service', () => ({
  OAuthStateService: class {},
}));
import { LocalZohoSyncService } from './local-zoho-sync.service';
import { TaskZohoSyncController } from './task-zoho-sync.controller';
import { CalendarZohoSyncController } from './calendar-zoho-sync.controller';
import { PERMISSION_KEY } from '../../common/decorator/require-permission.decorator';

describe('Personal Zoho app connections', () => {
  const reminders: any = {
    status: jest.fn(),
    taskUsers: jest.fn(),
    saveSettings: jest.fn(),
    taskPortals: jest.fn(),
    taskProjects: jest.fn(),
    calendarDestinations: jest.fn(),
    sync: jest.fn(),
    reconcile: jest.fn(),
  };
  const auth: any = {
    isConnected: jest.fn(),
    buildAdditionalAuthorizationUrl: jest.fn(),
  };
  const state: any = { sign: jest.fn() };
  const service = new LocalZohoSyncService(reminders, auth, state);
  beforeEach(() => {
    jest.resetAllMocks();
    auth.isConnected.mockResolvedValue(true);
    state.sign.mockReturnValue('signed-oauth-state');
    auth.buildAdditionalAuthorizationUrl.mockResolvedValue(
      'https://accounts.zoho.in/oauth/v2/auth',
    );
    reminders.status.mockResolvedValue({ direction: 'local_to_zoho' });
    reminders.taskUsers.mockResolvedValue([{ id: 'zoho-user' }]);
  });

  it('binds OAuth to the signed-in person and requests only fixed app scopes', async () => {
    await service.authorize('actor', 'tasks');
    expect(state.sign).toHaveBeenCalledWith({
      userId: 'actor',
      provider: 'zoho',
    });
    expect(auth.buildAdditionalAuthorizationUrl).toHaveBeenCalledWith(
      'actor',
      'signed-oauth-state',
      [
        'ZohoProjects.tasks.ALL',
        'ZohoProjects.portals.READ',
        'ZohoProjects.projects.READ',
        'ZohoProjects.users.READ',
      ],
    );
    await service.authorize('actor', 'calendar');
    expect(auth.buildAdditionalAuthorizationUrl).toHaveBeenLastCalledWith(
      'actor',
      'signed-oauth-state',
      ['ZohoCalendar.calendar.READ', 'ZohoCalendar.event.ALL'],
    );
  });

  it('requires connection and an active project user to enable task sync, while allowing a disconnected user to pause', async () => {
    const dto = {
      enabled: true,
      portal_id: 'portal',
      project_id: 'project',
      assignee_id: 'zoho-user',
    };
    await service.save('actor', 'tasks', dto);
    expect(reminders.taskUsers).toHaveBeenCalledWith(
      'actor',
      'portal',
      'project',
    );
    expect(reminders.saveSettings).toHaveBeenCalledWith('actor', 'tasks', dto);
    await expect(
      service.save('actor', 'tasks', { ...dto, assignee_id: 'other' }),
    ).rejects.toThrow('Choose your Zoho user');
    auth.isConnected.mockResolvedValue(false);
    await expect(
      service.save('actor', 'calendar', {
        enabled: true,
        calendar_id: 'calendar',
      }),
    ).rejects.toThrow('Connect your Zoho account');
    await service.save('actor', 'calendar', {
      enabled: false,
      calendar_id: 'calendar',
    });
    expect(reminders.saveSettings).toHaveBeenLastCalledWith(
      'actor',
      'calendar',
      { enabled: false, calendar_id: 'calendar' },
    );
  });

  it('reports only the current person’s connection status', async () => {
    expect(await service.status('actor', 'calendar')).toEqual({
      direction: 'local_to_zoho',
      connected: true,
    });
    expect(auth.isConnected).toHaveBeenCalledWith('actor');
    expect(reminders.status).toHaveBeenCalledWith('actor', 'calendar');
  });

  it('uses app permissions and cannot select another owner through a request body', async () => {
    for (const [Controller, kind, resource] of [
      [TaskZohoSyncController, 'tasks', 'tasks'],
      [CalendarZohoSyncController, 'calendar', 'calendar-events'],
    ] as const) {
      const controller = new Controller(service, reminders);
      expect(
        Reflect.getMetadata(PERMISSION_KEY, Controller.prototype.status),
      ).toBe(`${resource}:read`);
      expect(
        Reflect.getMetadata(PERMISSION_KEY, Controller.prototype.push),
      ).toBe(`${resource}:update`);
      expect(
        Reflect.getMetadata(PERMISSION_KEY, Controller.prototype.authorize),
      ).toBe(`${resource}:update`);
      await controller.push({ id: 'actor' }, {
        entity_id: 'local-task',
        user_id: 'other',
      } as any);
      expect(reminders.sync).toHaveBeenLastCalledWith(
        'actor',
        kind,
        expect.any(Object),
      );
      await controller.reconcile({ id: 'actor' }, 'local-task', {
        remote_id: 'remote',
        user_id: 'other',
      } as any);
      expect(reminders.reconcile).toHaveBeenLastCalledWith(
        'actor',
        kind,
        'local-task',
        'remote',
      );
    }
  });
});
