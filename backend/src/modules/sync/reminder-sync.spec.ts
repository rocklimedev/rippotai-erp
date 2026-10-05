import { BadRequestException } from '@nestjs/common';
import { Op } from 'sequelize';
import { ReminderSyncService } from './reminder-sync.service';
import {
  calendarPayload,
  fingerprint,
  remoteId,
  taskPayload,
} from './reminder-payload';

describe('Zoho reminder mirror', () => {
  const user = 'user-1';
  const config = {
    portal_id: 'portal',
    project_id: 'project',
    assignee_id: 'zoho-user',
    timezone: 'Asia/Kolkata',
  };
  const task = {
    id: 'task-1',
    title: 'Order samples',
    assigned_to: user,
    due_date: new Date('2026-10-05T10:00:00Z'),
    status: 'todo',
    priority: 'high',
  };
  let service: ReminderSyncService;
  let tasks: any;
  let events: any;
  let settings: any;
  let records: any;
  let zohoTasks: any;
  let zohoCalendar: any;
  let mappings: any[];
  let setting: any;
  const model = (data: any) => {
    const record: any = {
      ...data,
      update: jest.fn(async (values) => {
        Object.assign(record, values);
        return record;
      }),
      destroy: jest.fn(async () => {}),
    };
    return record;
  };
  beforeEach(() => {
    mappings = [];
    setting = model({ id: 'setting', config, user_id: user, kind: 'tasks' });
    tasks = { findAll: jest.fn(async () => [task]) };
    events = { findAll: jest.fn(async () => []) };
    settings = {
      findOne: jest.fn(async () => setting),
      findOrCreate: jest.fn(async () => [setting, false]),
      update: jest.fn(async () => [1]),
    };
    records = {
      count: jest.fn(async () => 0),
      update: jest.fn(async (values) => {
        mappings
          .filter(
            (record) => !record.remote_id && record.status !== 'uncertain',
          )
          .forEach((record) => Object.assign(record, values));
        return [mappings.length];
      }),
      findAll: jest.fn(async () => mappings),
      create: jest.fn(async (data) => {
        const record = model(data);
        mappings.push(record);
        return record;
      }),
    };
    zohoTasks = {
      createTask: jest.fn(async () => ({
        tasks: [{ id_string: '170876000006360599' }],
      })),
      updateTask: jest.fn(async () => ({})),
      deleteTask: jest.fn(async () => ({})),
    };
    zohoCalendar = {
      listCalendars: jest.fn(async () => ({
        calendars: [
          { uid: 'calendar-uid', id: '60073600257', name: 'Personal' },
        ],
      })),
      createEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
    };
    service = new ReminderSyncService(
      tasks,
      events,
      settings,
      records,
      zohoTasks,
      zohoCalendar,
    );
  });

  it('pushes new due tasks and scopes selection to the reminder owner', async () => {
    const result = await service.sync(user, 'tasks');
    expect(result).toMatchObject({ success: true, created: 1 });
    const where = tasks.findAll.mock.calls[0][0].where;
    expect(where[Op.or]).toEqual([
      { assigned_to: user },
      { created_by: user, assigned_to: null },
    ]);
    expect(where.due_date[Op.ne]).toBeNull();
    expect(mappings[0]).toMatchObject({
      user_id: user,
      remote_id: '170876000006360599',
      status: 'synced',
    });
  });
  it('lists calendar UIDs rather than numeric account/calendar IDs', async () => {
    expect(await service.calendarDestinations(user)).toEqual([
      { uid: 'calendar-uid', name: 'Personal' },
    ]);
    expect(zohoCalendar.listCalendars).toHaveBeenCalledWith(user, 'own', true);
  });
  it('rejects an invalid calendar before sending any event creation requests', async () => {
    setting.config = { calendar_id: '60073600257' };
    await expect(service.sync(user, 'calendar')).rejects.toThrow(
      'Choose a calendar',
    );
    expect(zohoCalendar.createEvent).not.toHaveBeenCalled();
    expect(records.create).not.toHaveBeenCalled();
  });
  it('allows correcting destinations for definitively failed, uncreated reminders', async () => {
    setting.config = { calendar_id: '60073600257' };
    const record = model({
      local_id: 'event-1',
      remote_id: null,
      status: 'failed',
      destination: setting.config,
    });
    mappings.push(record);
    await service.saveSettings(user, 'calendar', {
      enabled: false,
      calendar_id: 'calendar-uid',
      reminder_minutes: 30,
    });
    expect(record.destination.calendar_id).toBe('calendar-uid');
    expect(record.status).toBe('failed');
    const blockerWhere = records.count.mock.calls[0][0].where;
    expect(blockerWhere[Op.or]).toEqual([
      { remote_id: { [Op.ne]: null } },
      { status: 'uncertain' },
    ]);
    events.findAll.mockResolvedValue([
      { id: 'event-1', title: 'Visit', starts_at: '2026-10-05T12:00:00Z' },
    ]);
    zohoCalendar.createEvent.mockResolvedValue({
      events: [{ uid: 'remote-event' }],
    });
    expect(
      (await service.sync(user, 'calendar', { retry_failed: true })).created,
    ).toBe(1);
    expect(zohoCalendar.createEvent).toHaveBeenCalledWith(
      user,
      'calendar-uid',
      expect.any(Object),
    );
  });
  it('blocks destination changes when a reminder exists or creation is uncertain', async () => {
    setting.config = { calendar_id: 'old-calendar' };
    records.count.mockResolvedValue(1);
    await expect(
      service.saveSettings(user, 'calendar', {
        enabled: false,
        calendar_id: 'calendar-uid',
      }),
    ).rejects.toThrow('Destination cannot change');
    expect(records.update).not.toHaveBeenCalled();
  });
  it('does not count failed reminders as pending as well', async () => {
    mappings.push(
      model({ local_id: task.id, status: 'failed', error: 'Rejected' }),
    );
    const status = await service.status(user, 'tasks');
    expect(status).toMatchObject({ failed: 1, pending: 0 });
  });
  it('does not create duplicates on repeated sync, and pushes a changed title', async () => {
    await service.sync(user, 'tasks');
    expect((await service.sync(user, 'tasks')).skipped).toBe(1);
    tasks.findAll.mockResolvedValue([{ ...task, title: 'Updated title' }]);
    expect((await service.sync(user, 'tasks')).updated).toBe(1);
    expect(zohoTasks.createTask).toHaveBeenCalledTimes(1);
  });
  it('preserves ambiguous creation outcomes instead of blindly retrying', async () => {
    zohoTasks.createTask.mockRejectedValue(new Error('Transport timeout'));
    expect((await service.sync(user, 'tasks')).uncertain).toBe(1);
    expect(mappings[0].status).toBe('uncertain');
    await service.sync(user, 'tasks');
    expect(zohoTasks.createTask).toHaveBeenCalledTimes(1);
  });
  it('retries definitively rejected creations', async () => {
    zohoTasks.createTask.mockRejectedValueOnce(
      new BadRequestException('Invalid assignee'),
    );
    expect((await service.sync(user, 'tasks')).failed).toBe(1);
    expect(
      (await service.sync(user, 'tasks', { retry_failed: true })).created,
    ).toBe(1);
  });
  it('removes only mapped reminders after local deletion', async () => {
    const mapping = model({
      user_id: user,
      local_id: 'deleted-task',
      remote_id: 'remote',
      destination: config,
      status: 'synced',
    });
    mappings.push(mapping);
    tasks.findAll.mockResolvedValue([]);
    expect((await service.sync(user, 'tasks')).deleted).toBe(1);
    expect(zohoTasks.deleteTask).toHaveBeenCalledWith(
      user,
      'portal',
      'project',
      'remote',
    );
    expect(mapping.destroy).toHaveBeenCalled();
  });
  it('rejects pulling and concurrent mirror runs', async () => {
    await expect(
      service.sync(user, 'tasks', { pull_only: true }),
    ).rejects.toThrow('Pull sync is disabled');
    settings.update.mockResolvedValue([0]);
    await expect(service.sync(user, 'tasks')).rejects.toThrow(
      'already running',
    );
    expect(zohoTasks.createTask).not.toHaveBeenCalled();
  });
  it('fingerprints include reminder settings and completion', () => {
    const initial = taskPayload(task, config);
    expect(fingerprint(initial)).not.toBe(
      fingerprint(
        taskPayload(task, { ...config, task_reminder_time: '10:00' }),
      ),
    );
    expect(
      taskPayload({ ...task, status: 'completed' }, config).reminderDate,
    ).toBeUndefined();
  });
  it('continues when MySQL reports no change for a same-second lease renewal', async () => {
    settings.update.mockResolvedValueOnce([1]).mockResolvedValueOnce([0]);
    const result = await service.sync(user, 'tasks');
    expect(result).toMatchObject({ success: true, created: 1 });
    const ownershipCheck = settings.findOne.mock.calls[1][0].where;
    expect(ownershipCheck).toMatchObject({
      id: 'setting',
      lock_token: expect.any(String),
    });
    expect(ownershipCheck.lock_until[Op.gt]).toBeInstanceOf(Date);
  });
  it('stops before calling Zoho when a zero-change renewal has no valid owner', async () => {
    settings.update.mockResolvedValueOnce([1]).mockResolvedValueOnce([0]);
    settings.findOne.mockResolvedValueOnce(setting).mockResolvedValueOnce(null);
    await expect(service.sync(user, 'tasks')).rejects.toThrow(
      'Sync lease expired',
    );
    expect(zohoTasks.createTask).not.toHaveBeenCalled();
    const renewalWhere = settings.update.mock.calls[1][1].where;
    expect(renewalWhere.lock_until[Op.gt]).toBeInstanceOf(Date);
  });
  it('keeps timed events in UTC and all-day dates in the selected timezone', () => {
    const event = {
      title: 'Site visit',
      starts_at: '2026-10-04T18:30:00Z',
      all_day: true,
    };
    expect(calendarPayload(event, config).dateandtime).toMatchObject({
      start: '20261005',
      end: '20261005',
    });
    expect(
      calendarPayload({ ...event, all_day: false }, config).dateandtime,
    ).toMatchObject({ start: '20261004T183000Z', end: '20261004T190000Z' });
    expect(() =>
      calendarPayload({ ...event, starts_at: 'invalid' }, config),
    ).toThrow();
  });
  it('unwraps Zoho IDs without losing numeric precision', () => {
    expect(remoteId({ events: [{ uid: 'event@zoho.com' }] }, 'calendar')).toBe(
      'event@zoho.com',
    );
    expect(() =>
      remoteId({ tasks: [{ id: 170876000006360599 }] }, 'tasks'),
    ).toThrow('safe remote ID');
  });
});
