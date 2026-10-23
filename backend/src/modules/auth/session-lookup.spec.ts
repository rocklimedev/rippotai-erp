import { AuthTokensService } from './auth-tokens.service';
import { Sequelize } from 'sequelize-typescript';
import { AuthToken } from './models/auth-token.model';
import { User } from '../users/models/user.model';
import { Role } from '../rbac/models/role.model';
import { RolePermission } from '../rbac/models/role_permission.model';
import { Permission } from '../rbac/models/permission.model';
import { RoleApp } from '../rbac/models/role-app.model';
import { App } from '../rbac/models/app.model';

describe('Authentication session lookup', () => {
  it('generates one SQL statement joining permissions only for a cold lookup', async () => {
    const sequelize = new Sequelize({
      dialect: 'mysql',
      logging: false,
      models: [AuthToken, User, Role, RolePermission, Permission, RoleApp, App],
    });
    const query = jest.spyOn(sequelize, 'query').mockResolvedValue(null as any);
    try {
      const service = new AuthTokensService(AuthToken);
      await service.findByHash('hash', true);
      expect(query).toHaveBeenCalledTimes(1);
      const sql = query.mock.calls[0][0] as string;
      expect(sql).toContain('JOIN `role_permissions`');
      expect(sql).toContain('JOIN `permissions`');
      expect(sql).not.toContain('password_hash');
      expect(sql).not.toContain('pending_email');
      query.mockClear();
      await service.findByHash('hash', false);
      expect(query).toHaveBeenCalledTimes(1);
      expect(query.mock.calls[0][0]).not.toContain('JOIN `role_permissions`');
    } finally {
      query.mockRestore();
      await sequelize.close();
    }
  });
  it('does not require unrelated profile schema or select password hashes', async () => {
    const session = { id: 'session' };
    const findOne = jest.fn(async (options: any) => {
      const attributes = options.include[0].attributes;
      if (!Array.isArray(attributes) || attributes.includes('pending_email')) {
        throw new Error('Unknown column users.pending_email');
      }
      expect(attributes).not.toContain('password_hash');
      expect(attributes).toEqual(
        expect.arrayContaining([
          'id',
          'email',
          'is_active',
          'email_verified_at',
          'email_verified_address',
          'role_id',
        ]),
      );
      return session;
    });
    const service = new AuthTokensService({ findOne } as any);
    await expect(service.findByHash('session-hash')).resolves.toBe(session);
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { token_hash: 'session-hash' },
      }),
    );
  });
});
