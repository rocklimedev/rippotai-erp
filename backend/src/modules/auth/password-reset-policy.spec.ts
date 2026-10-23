import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ForgotPasswordService } from './forgot-password.service';
import { ConfigService } from '@nestjs/config';

jest.mock('@/modules/cdn/cdn.service', () => ({ CdnService: class {} }));
jest.mock('@/common/mail/mail.service', () => ({ MailService: class {} }));

describe('Password write and reset security', () => {
  const password = 'uncommon new passphrase';
  const raw = 'a'.repeat(64);
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const priorSecret = process.env.JWT_SECRET;
  let user: any;
  let token: any;
  let queue: Promise<any>;
  let fetchMock: jest.SpyInstance;
  const sessions = { create: jest.fn(), revokeAllForUser: jest.fn() };
  const users: any = {
    scope: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    sequelize: {
      transaction: jest.fn((callback) => {
        const result = queue.then(() => callback(transaction));
        queue = result.catch(() => undefined);
        return result;
      }),
    },
  };
  const resets = {
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    create: jest.fn(),
  };
  const auth = new AuthService(
    users,
    resets as any,
    sessions as any,
    { assertAllowed: jest.fn(), recordFailure: jest.fn(), recordSuccess: jest.fn() } as any,
  );
  const adminUsers = new UsersService(
    users,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const admin = { id: 'admin', roleName: 'ADMIN', permissions: ['users:create', 'users:update'] };
  beforeAll(() => {
    process.env.JWT_SECRET = 'password-policy-test-secret';
  });
  afterAll(() => {
    if (priorSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = priorSecret;
  });
  beforeEach(() => {
    jest.clearAllMocks();
    queue = Promise.resolve();
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      status: 200,
      text: async () => `${'0'.repeat(35)}:0`,
    } as Response);
    user = {
      id: 'user',
      email: 'person@example.com',
      is_active: true,
      password_hash: bcrypt.hashSync('old', 4),
      email_verified_at: new Date(),
      email_verified_address: 'person@example.com',
      update: jest.fn(async (patch) => Object.assign(user, patch)),
    };
    token = {
      user_id: user.id,
      used_at: null,
      expires_at: new Date(Date.now() + 60_000),
    };
    users.scope.mockReturnValue(users);
    users.findOne.mockImplementation(async () => user);
    users.findByPk.mockImplementation(async () => user);
    resets.findOne.mockImplementation(async () => token);
    resets.update.mockImplementation(async (patch) => {
      Object.assign(token, patch);
      return [1];
    });
  });
  afterEach(() => fetchMock.mockRestore());

  it('keeps legacy short passwords usable at login without screening', async () => {
    expect((await auth.login(user.email, 'old')).token).toEqual(
      expect.any(String),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(user.password_hash).toBeDefined();
  });
  it('rejects short new passwords on reset, change, provisioning and admin edit before writes', async () => {
    await expect(auth.resetPassword(raw, 'short')).rejects.toThrow(
      '12 characters',
    );
    await expect(auth.changePassword(user.id, 'old', 'short')).rejects.toThrow(
      '12 characters',
    );
    await expect(
      adminUsers.create(
        { name: 'New', email: 'new@example.com', password: 'short' },
        admin,
      ),
    ).rejects.toThrow('12 characters');
    await expect(
      adminUsers.update(user.id, { password: 'short' }, admin),
    ).rejects.toThrow('12 characters');
    expect(users.create).not.toHaveBeenCalled();
    expect(user.update).not.toHaveBeenCalled();
    expect(resets.update).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rejects breached resets without consuming the link or changing a password', async () => {
    const suffix = createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase()
      .slice(5);
    fetchMock.mockResolvedValue({
      status: 200,
      text: async () => `${suffix}:2`,
    });
    await expect(auth.resetPassword(raw, password)).rejects.toThrow(
      'data breach',
    );
    expect(user.update).not.toHaveBeenCalled();
    expect(resets.update).not.toHaveBeenCalled();
  });
  it('preserves the reset link when screening is unavailable', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'));
    await expect(auth.resetPassword(raw, password)).rejects.toThrow(
      'safety check is unavailable',
    );
    expect(token.used_at).toBeNull();
    expect(sessions.revokeAllForUser).not.toHaveBeenCalled();
  });
  it('atomically resets the password, consumes tokens and revokes sessions without issuing one', async () => {
    await auth.resetPassword(raw, password);
    expect(await bcrypt.compare(password, user.password_hash)).toBe(true);
    expect(user.update).toHaveBeenCalledWith(
      { password_hash: expect.any(String) },
      { transaction },
    );
    expect(resets.update).toHaveBeenCalledWith(
      { used_at: expect.any(Date) },
      { where: { user_id: user.id, used_at: null }, transaction },
    );
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith(
      user.id,
      transaction,
    );
    expect(sessions.create).not.toHaveBeenCalled();
    await expect(auth.resetPassword(raw, password)).rejects.toThrow(
      'already been used',
    );
  });
  it('allows only one concurrent reset using the same token', async () => {
    const results = await Promise.allSettled([
      auth.resetPassword(raw, password),
      auth.resetPassword(raw, password),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    expect(user.update).toHaveBeenCalledTimes(1);
  });
  it.each(['expired', 'used', 'missing'])(
    'rejects %s reset links without screening',
    async (state) => {
      if (state === 'expired') token.expires_at = new Date(0);
      if (state === 'used') token.used_at = new Date();
      if (state === 'missing') token = null;
      await expect(auth.resetPassword(raw, password)).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(user.update).not.toHaveBeenCalled();
    },
  );
  it('keeps forgot-password responses generic and stores only hashed reset tokens', async () => {
    const mail = { sendPasswordResetEmail: jest.fn() };
    const forgot = new ForgotPasswordService(
      users,
      resets as any,
      mail as any,
      new ConfigService({ FRONTEND_URL: 'https://erp.example' }),
    );
    const known = await forgot.forgotPassword({ email: user.email });
    const link = new URL(mail.sendPasswordResetEmail.mock.calls[0][2]);
    expect(resets.create.mock.calls[0][0].token_hash).toBe(
      createHash('sha256')
        .update(link.searchParams.get('token')!)
        .digest('hex'),
    );
    users.findOne.mockResolvedValue(null);
    expect(
      await forgot.forgotPassword({ email: 'missing@example.com' }),
    ).toEqual(known);
    expect(resets.create).toHaveBeenCalledTimes(1);
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('keeps the response generic when reset email delivery fails', async () => {
    const mail = {
      sendPasswordResetEmail: jest
        .fn()
        .mockRejectedValue(new Error('mail unavailable')),
    };
    const forgot = new ForgotPasswordService(
      users,
      resets as any,
      mail as any,
      new ConfigService({ FRONTEND_URL: 'https://erp.example' }),
    );
    const known = await forgot.forgotPassword({ email: user.email });
    users.findOne.mockResolvedValue(null);
    expect(
      await forgot.forgotPassword({ email: 'missing@example.com' }),
    ).toEqual(known);
  });

  it('rechecks token expiry after breach screening before changing the password', async () => {
    fetchMock.mockImplementation(async () => {
      token.expires_at = new Date(0);
      return {
        status: 200,
        text: async () => `${'0'.repeat(35)}:0`,
      } as Response;
    });
    await expect(auth.resetPassword(raw, password)).rejects.toThrow(
      'invalid, expired, or already used',
    );
    expect(user.update).not.toHaveBeenCalled();
  });
});
