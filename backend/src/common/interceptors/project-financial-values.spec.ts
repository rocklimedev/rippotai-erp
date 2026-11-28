import { ExecutionContext } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { firstValueFrom, of } from 'rxjs';
import { PERMISSION_KEY } from '../decorator/require-permission.decorator';
import { PROJECT_FINANCIAL_VALUES_PERMISSION } from '../security/project-financial-values';
import { StripSecretsInterceptor } from './strip-secrets.interceptor';

function response(
  data: unknown,
  {
    permissions = [] as string[],
    permission = 'projects:read',
    prefix = 'projects',
    route = '',
  } = {},
) {
  const handler = () => undefined;
  class Controller {}
  Reflect.defineMetadata(PERMISSION_KEY, permission, handler);
  Reflect.defineMetadata(PATH_METADATA, route, handler);
  Reflect.defineMetadata(PATH_METADATA, prefix, Controller);
  const context = {
    getType: () => 'http',
    getClass: () => Controller,
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => ({ user: { permissions, roleName: 'ADMIN' } }),
    }),
  } as unknown as ExecutionContext;
  return firstValueFrom(
    new StripSecretsInterceptor().intercept(context, {
      handle: () => of(data),
    }),
  );
}

describe('project financial values', () => {
  it('omits nested amounts even for an administrator lacking the grant', async () => {
    await expect(
      response({
        name: 'Project',
        approved_value: '5000',
        brief: { initialClientBudget: 4500 },
        milestones: [{ id: 'm1', amount: 200, paid_amount: 50, status: 'due' }],
        progress: { value: 10 },
      }),
    ).resolves.toEqual({
      name: 'Project',
      brief: {},
      milestones: [{ id: 'm1', status: 'due' }],
      progress: { value: 10 },
    });
  });

  it('preserves financial values when explicitly granted and still strips secrets', async () => {
    await expect(
      response(
        { approvedValue: 5500, password_hash: 'secret' },
        {
          permissions: [PROJECT_FINANCIAL_VALUES_PERMISSION],
        },
      ),
    ).resolves.toEqual({ approvedValue: 5500 });
  });

  it.each([
    'boq:read',
    'payment-schedules:read',
    'vendor-rate-comparisons:read',
  ])('preserves authorized document values on %s', async (permission) => {
    await expect(
      response(
        { total_amount: 1100, project: { client_budget: 5000 } },
        {
          permission,
        },
      ),
    ).resolves.toEqual({ total_amount: 1100, project: {} });
  });

  it('removes financial KPI aliases while keeping counts', async () => {
    await expect(
      response(
        { live: 3, value: 5500 },
        {
          permission: 'command-center:read',
          prefix: 'command-center',
          route: 'kpis',
        },
      ),
    ).resolves.toEqual({ live: 3 });
  });

  it('requires the special grant for the shared collections summary', async () => {
    await expect(
      response(
        {
          totals: { total: 1000, balance: 800 },
          rows: [
            { name: 'Project', collected: 200, entries: [{ amount: 200 }] },
          ],
        },
        {
          permission: 'payment-schedules:read',
          prefix: 'client-collections',
          route: 'summary',
        },
      ),
    ).resolves.toEqual({ rows: [{ name: 'Project', entries: [{}] }] });
  });
});
