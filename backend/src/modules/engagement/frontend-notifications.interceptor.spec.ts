import { lastValueFrom, of, throwError, from } from 'rxjs';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';
import { FrontendNotificationsInterceptor } from './frontend-notifications.interceptor';
import {
  FRONTEND_NOTIFICATION_SOURCES,
  frontendNotificationSource,
} from './frontend-notification-sources';

function setup(
  controller = 'PurchaseOrderController',
  handler = 'approve',
  request: any = {},
) {
  const broadcast = { broadcast: jest.fn().mockResolvedValue(undefined) };
  const auth = {
    getCurrentUser: jest.fn().mockResolvedValue({ id: 'authenticated-user' }),
  };
  const interceptor = new FrontendNotificationsInterceptor(
    broadcast as any,
    { get: () => auth } as any,
  );
  const context = {
    getType: () => 'http',
    getClass: () => ({ name: controller }),
    getHandler: () => ({ name: handler }),
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        user: { id: 'actor' },
        params: {},
        headers: {},
        ...request,
      }),
    }),
  };
  const run = (result: any) =>
    lastValueFrom(
      interceptor.intercept(context as any, { handle: () => of(result) }),
    );
  return { broadcast, auth, interceptor, context, run };
}

describe('Frontend notification integration', () => {
  it('notifies once after a successful user action and returns its original result', async () => {
    const { run, broadcast } = setup();
    const result = { id: 'po', title: 'Kitchen materials', status: 'APPROVED' };
    expect(await run(result)).toBe(result);
    expect(broadcast.broadcast).toHaveBeenCalledTimes(1);
    expect(broadcast.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        excludedUserId: 'actor',
        entity_type: 'purchase_order',
        entity_id: 'po',
        title: 'Purchase Order approved',
      }),
    );
  });

  it('does not notify before the controller service finishes its transaction', async () => {
    const { interceptor, context, broadcast } = setup();
    let complete!: (value: any) => void;
    const saved = new Promise((resolve) => {
      complete = resolve;
    });
    const pending = lastValueFrom(
      interceptor.intercept(context as any, { handle: () => from(saved) }),
    );
    expect(broadcast.broadcast).not.toHaveBeenCalled();
    complete({ id: 'saved' });
    await pending;
    expect(broadcast.broadcast).toHaveBeenCalledTimes(1);
  });

  it('does not notify for rejected or failed actions', async () => {
    const { interceptor, context, broadcast, run } = setup();
    await expect(
      lastValueFrom(
        interceptor.intercept(context as any, {
          handle: () => throwError(() => new Error('validation failed')),
        }),
      ),
    ).rejects.toThrow('validation failed');
    await run({ success: false });
    expect(broadcast.broadcast).not.toHaveBeenCalled();
  });

  it('does not turn a saved action into a failure if notification delivery fails', async () => {
    const { broadcast, run } = setup();
    broadcast.broadcast.mockRejectedValue(new Error('offline'));
    const result = { id: 'saved' };
    expect(await run(result)).toBe(result);
  });

  it.each([
    ['PurchaseOrderController', 'findAll', 'GET'],
    ['BoqController', 'exportPdf', 'POST'],
    ['DailySiteReportController', 'uploadPhoto', 'POST'],
    ['CommandCenterController', 'refresh', 'POST'],
    ['AutomationController', 'testDraft', 'POST'],
    ['AutomationController', 'runAll', 'POST'],
    ['SyncController', 'sync', 'POST'],
    ['SearchController', 'search', 'POST'],
    ['CdnController', 'upload', 'POST'],
  ])(
    'excludes read, utility and internal endpoints %s.%s',
    async (controller, handler, method) => {
      const { run, broadcast } = setup(controller, handler, { method });
      await run({ id: 'something' });
      expect(broadcast.broadcast).not.toHaveBeenCalled();
    },
  );

  it('skips non-HTTP internal execution contexts', async () => {
    const { interceptor, context, broadcast } = setup();
    context.getType = () => 'rpc';
    await lastValueFrom(
      interceptor.intercept(context as any, {
        handle: () => of({ id: 'something' }),
      }),
    );
    expect(broadcast.broadcast).not.toHaveBeenCalled();
  });

  it('authenticates the bearer token when a controller does not set request.user', async () => {
    const { run, auth, broadcast } = setup('RfiController', 'respond', {
      user: undefined,
      headers: { authorization: 'Bearer session-token' },
      params: { id: '12' },
    });
    await run({ id: 12 });
    expect(auth.getCurrentUser).toHaveBeenCalledWith('session-token');
    expect(broadcast.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        excludedUserId: 'authenticated-user',
        entity_id: '12',
      }),
    );
  });

  it('does not trust a body user ID or an invalid token for notification identity', async () => {
    const { run, auth, broadcast } = setup('RfiController', 'raise', {
      user: undefined,
      body: { userId: 'pretend-user' },
    });
    await run({ id: 12 });
    expect(broadcast.broadcast).not.toHaveBeenCalled();
    const invalid = setup('RfiController', 'raise', {
      user: undefined,
      headers: { authorization: 'Bearer revoked' },
    });
    invalid.auth.getCurrentUser.mockRejectedValue(new Error('revoked'));
    await invalid.run({ id: 12 });
    expect(invalid.broadcast.broadcast).not.toHaveBeenCalled();
    expect(auth.getCurrentUser).not.toHaveBeenCalled();
  });

  it('preserves parent IDs for milestone and BOQ item edits', async () => {
    for (const controller of ['PaymentSchedulesController', 'BoqController']) {
      const handler =
        controller === 'BoqController' ? 'updateItem' : 'updateMilestone';
      const { run, broadcast } = setup(controller, handler, {
        method: 'PATCH',
        params: { id: 'parent', itemId: 'child' },
      });
      await run({ id: 'child' });
      expect(broadcast.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({ entity_id: 'parent' }),
      );
    }
  });

  it('avoids passing child IDs as planner or shortlist IDs', async () => {
    const { run, broadcast } = setup(
      'ProjectPlannerController',
      'updatePlannerItem',
      { method: 'PATCH', params: { itemId: 'child' } },
    );
    await run({ id: 'child', planner_id: 'parent' });
    expect(broadcast.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ entity_id: 'parent' }),
    );
    const unresolved = setup('ShortlistEntryController', 'remove', {
      method: 'DELETE',
      params: { id: 'child' },
    });
    await unresolved.run(undefined);
    expect(unresolved.broadcast.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ entity_id: undefined }),
    );
  });

  it('links deleted records and renamed versions to their registers', async () => {
    const deleted = setup('PurchaseOrderController', 'remove', {
      method: 'DELETE',
      params: { id: 'deleted' },
    });
    await deleted.run(undefined);
    expect(deleted.broadcast.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ entity_id: undefined }),
    );
    const renamed = setup('BoqController', 'renameVersion', {
      method: 'PATCH',
      params: { versionId: 'version' },
    });
    await renamed.run({ id: 'version' });
    expect(renamed.broadcast.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ entity_id: undefined }),
    );
  });

  it('does not expose private notes but does notify for shared notes', async () => {
    const { run, broadcast } = setup('NotesController', 'create');
    await run({
      id: 'private',
      title: 'Private subject',
      body: 'Private text',
      is_shared: false,
    });
    expect(broadcast.broadcast).not.toHaveBeenCalled();
    await run({
      id: 'shared',
      title: 'Site notes',
      body: 'Long note',
      is_shared: true,
    });
    expect(broadcast.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ entity_type: 'note', entity_id: 'shared' }),
    );
    expect(broadcast.broadcast.mock.calls[0][0].message).not.toContain(
      'Long note',
    );
  });

  it('distinguishes BOQ and workflow library controllers with the same class name', () => {
    expect(
      frontendNotificationSource('LibraryController', 'library', 'createItem')
        ?.entity,
    ).toBe('boq_library');
    expect(
      frontendNotificationSource(
        'LibraryController',
        'workflow/library',
        'createPhase',
      )?.entity,
    ).toBe('workflow_library');
    expect(
      frontendNotificationSource('LibraryController', 'library', 'createPhase'),
    ).toBeUndefined();
  });

  it('every enabled handler exists on a real controller and is a write route', () => {
    const controllers: { name: string; path: string; writes: Set<string> }[] =
      [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const file = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(file);
          continue;
        }
        if (!entry.name.endsWith('.controller.ts')) continue;
        const src = ts.createSourceFile(
          file,
          readFileSync(file, 'utf8'),
          ts.ScriptTarget.Latest,
          true,
        );
        for (const c of src.statements.filter(ts.isClassDeclaration)) {
          const decorator = (ts.getDecorators(c) || []).find(
            (d) =>
              ts.isCallExpression(d.expression) &&
              d.expression.expression.getText(src) === 'Controller',
          );
          if (!decorator || !ts.isCallExpression(decorator.expression))
            continue;
          const path =
            (decorator.expression.arguments[0] as ts.StringLiteral)?.text || '';
          const writes = new Set<string>();
          for (const m of c.members.filter(ts.isMethodDeclaration)) {
            if (
              (ts.getDecorators(m) || []).some(
                (d) =>
                  ts.isCallExpression(d.expression) &&
                  ['Post', 'Patch', 'Put', 'Delete'].includes(
                    d.expression.expression.getText(src),
                  ),
              )
            )
              writes.add(m.name.getText(src));
          }
          controllers.push({ name: c.name!.text, path, writes });
        }
      }
    };
    walk(join(__dirname, '..'));
    for (const source of FRONTEND_NOTIFICATION_SOURCES) {
      const controller = controllers.find(
        (c) =>
          c.name === source.controller &&
          (source.path === undefined || source.path === c.path),
      );
      expect(controller).toBeDefined();
      for (const handler of Object.keys(source.actions))
        expect({
          controller: source.controller,
          handler,
          exists: controller!.writes.has(handler),
        }).toEqual({ controller: source.controller, handler, exists: true });
    }
  });
});
