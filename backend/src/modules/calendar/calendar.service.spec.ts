import { CalendarService } from './calendar.service';

describe('calendar event mutations', () => {
  it('updates standalone events and records activity and notifications', async () => {
    const event = {
      id: 'event',
      update: jest.fn().mockResolvedValue(undefined),
    };
    const model: any = { findByPk: jest.fn().mockResolvedValue(event) };
    const activity: any = { logCalendarEventUpdated: jest.fn() };
    const notifications: any = { notifyCalendarEventUpdated: jest.fn() };
    const service = new CalendarService(model, activity, notifications);
    const user = { id: 'user' };

    await expect(
      service.update('event', { title: 'Changed' }, user),
    ).resolves.toBe(event);
    expect(event.update).toHaveBeenCalledWith({ title: 'Changed' });
    expect(activity.logCalendarEventUpdated).toHaveBeenCalledWith(event, user);
    expect(notifications.notifyCalendarEventUpdated).toHaveBeenCalledWith(
      event,
      user.id,
    );
  });

  it('deletes standalone events and records activity and notifications', async () => {
    const event = { id: 'event', title: 'Meeting', destroy: jest.fn() };
    const model: any = { findByPk: jest.fn().mockResolvedValue(event) };
    const activity: any = { logCalendarEventDeleted: jest.fn() };
    const notifications: any = { notifyCalendarEventDeleted: jest.fn() };
    const service = new CalendarService(model, activity, notifications);
    const user = { id: 'user' };

    await expect(service.remove('event', user)).resolves.toEqual({
      id: 'event',
      deleted: true,
    });
    expect(event.destroy).toHaveBeenCalledTimes(1);
    expect(activity.logCalendarEventDeleted).toHaveBeenCalledWith(
      event.title,
      event.id,
      user,
    );
    expect(notifications.notifyCalendarEventDeleted).toHaveBeenCalledWith(
      event.title,
      user.id,
    );
  });
});
