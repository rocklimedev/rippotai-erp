import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationEventsService } from './notification-events.service';
import { NotificationsGateway } from '@/common/gateway/notification.gateway';
import { NotificationType } from '@/common/enums';
import { NotificationBroadcastService } from './notification-broadcast.service';

describe('In-app notifications', () => {
  it('broadcasts linked records only to active users other than the actor', async () => {
    const users = {
      findAll: jest.fn().mockResolvedValue([{ id: 'recipient' }]),
    };
    const notifications = { createMany: jest.fn() };
    const service = new NotificationBroadcastService(
      users as any,
      notifications as any,
    );
    await service.broadcast({
      excludedUserId: 'actor',
      type: NotificationType.TASK_CREATED,
      title: 'Task',
      message: 'Created',
      entity_type: 'task',
      entity_id: 'task-id',
    });
    expect(users.findAll.mock.calls[0][0].where.is_active).toBe(true);
    expect(users.findAll.mock.calls[0][0].where.id).toBeDefined();
    expect(notifications.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: 'recipient',
        entity_type: 'task',
        entity_id: 'task-id',
      }),
    ]);
  });

  it('does not announce drawing metadata as an upload but does report approval changes', async () => {
    const hooks: Record<string, Function> = {};
    const broadcast = { broadcast: jest.fn() };
    new NotificationEventsService(
      {
        models: {
          Drawing: {
            addHook: (event: string, _name: string, callback: Function) => {
              hooks[event] = callback;
            },
          },
        },
      } as any,
      broadcast as any,
    ).onModuleInit();
    const record = {
      id: 'drawing',
      status: 'Approved',
      changed: (field: string) => field === 'status',
    };
    await hooks.afterCreate(record, {});
    expect(broadcast.broadcast).not.toHaveBeenCalled();
    await hooks.afterUpdate(record, {});
    expect(broadcast.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'drawing',
        entity_id: 'drawing',
        message: 'Drawing is now Approved.',
      }),
    );
  });
  function setup() {
    const model = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn().mockResolvedValue(3),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    };
    const gateway = { emitToUser: jest.fn() };
    const redis = { del: jest.fn().mockResolvedValue(1) };
    const service = new NotificationsService(
      model as any,
      gateway as any,
      redis as any,
    );
    return { model, gateway, redis, service };
  }
  it('scopes reads and deletions to the signed-in owner', async () => {
    const { service, model } = setup();
    model.findOne.mockResolvedValue(null);
    await expect(service.markAsRead('foreign', 'me')).rejects.toThrow(
      'not found',
    );
    await expect(service.remove('foreign', 'me')).rejects.toThrow('not found');
    expect(model.findOne).toHaveBeenCalledWith({
      where: { id: 'foreign', user_id: 'me' },
    });
  });
  it('rejects another user inbox for list, count, read-all and clear-all', () => {
    const { service } = setup();
    const controller = new NotificationsController(service);
    const request = { user: { id: 'me' } };
    expect(() => controller.findAllForUser('other', request)).toThrow(
      'another user',
    );
    expect(() => controller.unreadCount('other', request)).toThrow(
      'another user',
    );
    expect(() => controller.markAllAsRead('other', request)).toThrow(
      'another user',
    );
    expect(() => controller.deleteUserNotifications('other', request)).toThrow(
      'another user',
    );
  });
  it('does not fail persisted notifications when Redis is unavailable', async () => {
    const { service, model, redis, gateway } = setup();
    redis.del.mockRejectedValue(new Error('offline'));
    const record = { id: 'one', toJSON: () => ({ id: 'one' }) };
    model.create.mockResolvedValue(record);
    await expect(
      service.create({
        user_id: 'me',
        type: NotificationType.SYSTEM,
        title: 'Saved',
        message: 'Done',
      }),
    ).resolves.toBe(record);
    expect(gateway.emitToUser).toHaveBeenCalledWith('me', { id: 'one' });
    expect(await service.getUnreadCount('me')).toBe(3);
    expect(model.count).toHaveBeenCalledWith({
      where: { user_id: 'me', is_read: false },
    });
  });
  it('keeps the original read timestamp on repeated reads', async () => {
    const { service, model } = setup();
    const record = { user_id: 'me', is_read: true, update: jest.fn() };
    model.findOne.mockResolvedValue(record);
    await service.markAsRead('one', 'me');
    expect(record.update).not.toHaveBeenCalled();
  });
  it('waits for a committed Site Recce before delivering a linked notification', async () => {
    const hooks: Record<string, Function> = {};
    const model = {
      addHook: (event: string, _name: string, callback: Function) => {
        hooks[event] = callback;
      },
    };
    const broadcast = { broadcast: jest.fn().mockResolvedValue(undefined) };
    new NotificationEventsService(
      { models: { SiteRecce: model } } as any,
      broadcast as any,
    ).onModuleInit();
    const afterCommit = jest.fn();
    await hooks.afterCreate(
      { id: 'recce', project_name: 'Site A', created_by: 'actor' },
      { transaction: { afterCommit } },
    );
    expect(broadcast.broadcast).not.toHaveBeenCalled();
    await afterCommit.mock.calls[0][0]();
    expect(broadcast.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'site_recce',
        entity_id: 'recce',
        excludedUserId: 'actor',
        type: NotificationType.SITE_RECCE_CREATED,
      }),
    );
  });
  it('emits the lead-stage event instead of a generic update', async () => {
    const hooks: Record<string, Function> = {};
    const broadcast = { broadcast: jest.fn() };
    new NotificationEventsService(
      {
        models: {
          Lead: {
            addHook: (event: string, _name: string, callback: Function) => {
              hooks[event] = callback;
            },
          },
        },
      } as any,
      broadcast as any,
    ).onModuleInit();
    await hooks.afterUpdate(
      { id: 'lead', stage: 'disc', changed: (key: string) => key === 'stage' },
      {},
    );
    expect(broadcast.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.LEAD_STAGE_CHANGED,
        entity_id: 'lead',
      }),
    );
  });
  it('authenticates sockets using the token rather than a supplied user ID', async () => {
    const getCurrentUser = jest.fn().mockResolvedValue({ id: 'real-user' });
    const gateway = new NotificationsGateway({
      get: () => ({ getCurrentUser }),
    } as any);
    const socket = {
      handshake: { auth: { token: 'valid', userId: 'victim' } },
      join: jest.fn(),
      disconnect: jest.fn(),
    };
    await gateway.handleConnection(socket as any);
    expect(socket.join).toHaveBeenCalledWith('user:real-user');
    const invalid = {
      handshake: { auth: { userId: 'victim' } },
      join: jest.fn(),
      disconnect: jest.fn(),
    };
    await gateway.handleConnection(invalid as any);
    expect(invalid.join).not.toHaveBeenCalled();
    expect(invalid.disconnect).toHaveBeenCalledWith(true);
    getCurrentUser.mockRejectedValueOnce(new Error('revoked'));
    await gateway.handleConnection(socket as any);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });
});
