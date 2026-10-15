import { ManualEmailVerificationService } from './manual-email-verification.service';

describe('Manual admin email verification', () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const admin = {
    id: 'admin',
    email: 'admin@example.com',
    roleName: 'ADMIN',
    permissions: ['users:update'],
  };
  let user: any;
  const users = { findByPk: jest.fn() };
  const sessions = { update: jest.fn() };
  const activity = { create: jest.fn() };
  const database = {
    transaction: jest.fn(async (callback) => callback(transaction)),
  };
  const service = new ManualEmailVerificationService(
    users as any,
    sessions as any,
    activity as any,
    database as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    user = {
      id: 'target',
      name: 'Target',
      email: 'target@example.com',
      is_active: false,
      email_verified_at: null,
      email_verified_address: null,
      update: jest.fn(async (patch) => Object.assign(user, patch)),
    };
    users.findByPk.mockResolvedValue(user);
    activity.create.mockResolvedValue({});
  });

  it.each(['ADMIN', 'SUPERADMIN'])(
    'allows %s to verify the current address without activation or session issuance',
    async (roleName) => {
      const result = await service.update(user.id, true, {
        ...admin,
        roleName,
      });
      expect(result.email_verified_at).toBeInstanceOf(Date);
      expect(result.email_verified_address).toBe(user.email);
      expect(user.is_active).toBe(false);
      expect(user.update).toHaveBeenCalledWith(
        {
          email_verified_at: expect.any(Date),
          email_verified_address: user.email,
        },
        { transaction },
      );
      expect(sessions.update).toHaveBeenCalledWith(
        { revoked_at: expect.any(Date) },
        { where: { user_id: user.id, revoked_at: null }, transaction },
      );
      expect(activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: admin.id,
          user_role: roleName,
          entity_id: user.id,
          changes: {
            email_verification: {
              method: 'manual_admin',
              verified: true,
              email: user.email,
              previous: {
                email_verified_at: null,
                email_verified_address: null,
              },
            },
          },
        }),
        { transaction },
      );
    },
  );

  it('allows manual unverification and revokes sessions in the same transaction', async () => {
    user.email_verified_at = new Date();
    user.email_verified_address = user.email;
    const result = await service.update(user.id, false, admin);
    expect(result.email_verified_at).toBeNull();
    expect(result.email_verified_address).toBeNull();
    expect(sessions.update).toHaveBeenCalledTimes(1);
  });

  it.each([
    undefined,
    { ...admin, id: '' },
    { ...admin, roleName: 'STAFF' },
    { ...admin, roleName: 'USER' },
    { ...admin, permissions: [] },
    { ...admin, permissions: 'users:update' },
  ])(
    'denies unauthorized actors before reading or modifying users',
    async (actor) => {
      await expect(service.update('target', true, actor)).rejects.toThrow(
        'Administrator',
      );
      expect(users.findByPk).not.toHaveBeenCalled();
      expect(database.transaction).not.toHaveBeenCalled();
      expect(activity.create).not.toHaveBeenCalled();
    },
  );

  it('rejects missing accounts', async () => {
    users.findByPk.mockResolvedValue(null);
    await expect(service.update('missing', true, admin)).rejects.toThrow(
      'User not found',
    );
    expect(activity.create).not.toHaveBeenCalled();
  });

  it('propagates audit failure so the managed transaction rolls back', async () => {
    activity.create.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(service.update('target', true, admin)).rejects.toThrow(
      'audit unavailable',
    );
    expect(activity.create.mock.calls[0][1]).toEqual({ transaction });
  });
});
