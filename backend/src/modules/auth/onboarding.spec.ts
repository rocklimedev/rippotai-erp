import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { ForgotPasswordService } from './forgot-password.service';
import { VerificationTokenType } from '@/common/enums';
import { UsersService } from '../users/users.service';

jest.mock('@/common/mail/mail.service', () => ({ MailService: class {} }));
jest.mock('@/modules/cdn/cdn.service', () => ({ CdnService: class {} }));
jest.mock('@/common/security/password-policy', () => ({
  PASSWORD_MIN_LENGTH: 12,
  assertNewPassword: jest.fn().mockResolvedValue(undefined),
}));

describe('Closed signup and verified email onboarding', () => {
  let app: any;
  let auth: AuthService;
  let verification: EmailVerificationService;
  let user: any;
  let issued: any[];
  const raw = 'a'.repeat(64);
  const digest = (value: string) =>
    createHash('sha256').update(value).digest('hex');
  const password = 'correct-password';
  const passwordHash = bcrypt.hashSync(password, 4);
  const users = {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    scope: jest.fn(),
    create: jest.fn(),
  };
  const tokens = { create: jest.fn(), findOne: jest.fn() };
  const sessions = {
    create: jest.fn(),
    findByHash: jest.fn(),
    touchLastUsed: jest.fn(),
    update: jest.fn(),
  };
  const mail = { sendVerificationEmail: jest.fn() };
  const transaction: any = { LOCK: { UPDATE: 'UPDATE' } };
  // Serialize transactions as a database row lock would, so concurrent replay
  // exercises the service's consume-after-validation flow.
  let queue: Promise<any>;
  const database = {
    transaction: jest.fn((callback) => {
      const result = queue.then(() => callback(transaction));
      queue = result.catch(() => undefined);
      return result;
    }),
  };
  const priorSecret = process.env.JWT_SECRET;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'onboarding-test-secret';
    auth = new AuthService(
      { findAll: jest.fn() } as any,
      users as any,
      {} as any,
      sessions as any,
    );
    verification = new EmailVerificationService(
      users as any,
      tokens as any,
      database as any,
      mail as any,
      new ConfigService({ FRONTEND_URL: 'https://erp.example' }),
      sessions as any,
    );
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: EmailVerificationService, useValue: verification },
        { provide: ForgotPasswordService, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (priorSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = priorSecret;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    queue = Promise.resolve();
    issued = [];
    user = {
      id: 'provisioned-user',
      email: 'staff@example.com',
      name: 'Staff',
      password_hash: passwordHash,
      is_active: true,
      email_verified_at: null,
      email_verified_address: null,
      role: { name: 'STAFF' },
      role_id: null,
      update: jest.fn(async (patch) => Object.assign(user, patch)),
    };
    users.scope.mockReturnValue(users);
    users.findOne.mockImplementation(async () => user);
    users.findByPk.mockImplementation(async () => user);
    tokens.create.mockImplementation(async (values) => {
      const token = {
        ...values,
        update: jest.fn(async (patch) => Object.assign(token, patch)),
      };
      issued.push(token);
      return token;
    });
    tokens.findOne.mockImplementation(
      async ({ where }) =>
        issued.find(
          (token) => token.token === where.token && token.type === where.type,
        ) || null,
    );
    sessions.findByHash.mockImplementation(async () => ({
      id: 'session',
      user,
      expires_at: new Date(Date.now() + 60_000),
      revoked_at: null,
    }));
    mail.sendVerificationEmail.mockResolvedValue(undefined);
  });

  function verificationToken(patch: any = {}) {
    const token = {
      user_id: user.id,
      email: user.email,
      token: digest(raw),
      type: VerificationTokenType.EMAIL_VERIFICATION,
      expires_at: new Date(Date.now() + 60_000),
      used_at: null,
      ...patch,
      update: jest.fn(async (values) => Object.assign(token, values)),
    };
    issued.push(token);
    return token;
  }

  it('rejects uninvited public signup even with a supplied staff role or verification fields', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'attacker@example.com',
        password,
        name: 'Attacker',
        role_id: 'ADMIN',
        is_active: true,
        email_verified_at: new Date().toISOString(),
      })
      .expect(403);
    expect(users.create).not.toHaveBeenCalled();
    expect(users.findOne).not.toHaveBeenCalled();
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('requires admin provisioning independently of client-supplied creator fields', async () => {
    const service = new UsersService(
      users as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await expect(
      service.create(
        {
          name: 'Attacker',
          email: 'a@example.com',
          password,
          created_by: 'admin',
        },
        { id: 'attacker', roleName: 'STAFF' },
      ),
    ).rejects.toThrow('Only administrators');
    expect(users.create).not.toHaveBeenCalled();
  });

  it('allows an administrator to provision an unverified account without issuing a session', async () => {
    users.create.mockResolvedValue(user);
    const service = new UsersService(
      users as any,
      {} as any,
      {} as any,
      { logUserCreated: jest.fn() } as any,
      { notifyUserCreated: jest.fn() } as any,
    );
    await service.create(
      {
        name: 'Staff',
        email: ' STAFF@EXAMPLE.COM ',
        password,
        created_by: 'spoofed',
        email_verified_at: new Date(),
      } as any,
      { id: 'real-admin', roleName: 'ADMIN' },
    );
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'staff@example.com',
        created_by: 'real-admin',
      }),
    );
    expect(users.create.mock.calls[0][0]).not.toHaveProperty(
      'email_verified_at',
    );
    expect(users.create.mock.calls[0][0]).not.toHaveProperty(
      'email_verified_address',
    );
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('blocks login, delivers a hashed email token, verifies once, then permits a normal login', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password })
      .expect(403);
    expect(sessions.create).not.toHaveBeenCalled();
    const sent = await request(app.getHttpServer())
      .post('/auth/request-email-verification')
      .send({ email: user.email })
      .expect(201);
    expect(sent.body.token).toBeUndefined();
    const url = new URL(mail.sendVerificationEmail.mock.calls[0][2]);
    const secret = new URLSearchParams(url.hash.slice(1)).get('token')!;
    expect(issued[0].token).toBe(digest(secret));
    expect(issued[0].token).not.toBe(secret);
    expect(issued[0].email).toBe(user.email);
    expect(sessions.create).not.toHaveBeenCalled();
    const verified = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: secret })
      .expect(201);
    expect(verified.body.token).toBeUndefined();
    expect(sessions.create).not.toHaveBeenCalled();
    expect(user.email_verified_address).toBe(user.email);
    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({ email_verified_at: expect.any(Date) }),
      { transaction },
    );
    expect(issued[0].update).toHaveBeenCalledWith(
      { used_at: expect.any(Date) },
      { transaction },
    );
    expect(sessions.update).toHaveBeenCalledWith(
      { revoked_at: expect.any(Date) },
      {
        where: { user_id: user.id, revoked_at: null },
        transaction,
      },
    );
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: secret })
      .expect(400);
    const signedIn = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password })
      .expect(201);
    expect(typeof signedIn.body.token).toBe('string');
    expect(sessions.create).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['expired', { expires_at: new Date(0) }],
    ['already consumed', { used_at: new Date() }],
    ['wrong purpose', { type: VerificationTokenType.PASSWORD_RESET }],
    ['changed email', { email: 'previous@example.com' }],
  ])(
    'rejects %s verification without issuing a session',
    async (_name, patch) => {
      verificationToken(patch);
      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: raw })
        .expect(400);
      expect(user.update).not.toHaveBeenCalled();
      expect(sessions.create).not.toHaveBeenCalled();
    },
  );

  it('rejects tampered and malformed verification tokens', async () => {
    verificationToken();
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: 'b'.repeat(64) })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: 'bad' })
      .expect(400);
    expect(user.update).not.toHaveBeenCalled();
  });

  it('only allows one concurrent use of a verification link', async () => {
    verificationToken();
    const results = await Promise.allSettled([
      verification.verify(raw),
      verification.verify(raw),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    expect(user.update).toHaveBeenCalledTimes(1);
    expect(tokens.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ transaction, lock: 'UPDATE' }),
    );
  });

  it('does not activate a disabled account via verification or password login', async () => {
    verificationToken();
    user.is_active = false;
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: raw })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password })
      .expect(401);
    expect(user.update).not.toHaveBeenCalled();
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it.each(['unknown', 'disabled', 'verified'])(
    'returns a generic resend response for %s accounts without creating users',
    async (state) => {
      if (state === 'unknown') user = null;
      if (state === 'disabled') user.is_active = false;
      if (state === 'verified') {
        user.email_verified_at = new Date();
        user.email_verified_address = user.email;
      }
      const response = await request(app.getHttpServer())
        .post('/auth/request-email-verification')
        .send({ email: 'staff@example.com' })
        .expect(201);
      expect(response.body.message).toBe(
        'If an active account needs verification, an email has been sent.',
      );
      expect(tokens.create).not.toHaveBeenCalled();
      expect(mail.sendVerificationEmail).not.toHaveBeenCalled();
      expect(users.create).not.toHaveBeenCalled();
    },
  );

  it('rejects existing sessions for unverified, disabled, or changed-email users', async () => {
    await expect(
      auth.getCurrentUserFromPayload({ jti: 'old-session' }),
    ).rejects.toThrow('verified email required');
    user.email_verified_at = new Date();
    user.email_verified_address = user.email;
    expect(
      (await auth.getCurrentUserFromPayload({ jti: 'old-session' })).id,
    ).toBe(user.id);
    user.email = 'changed@example.com';
    await expect(
      auth.getCurrentUserFromPayload({ jti: 'old-session' }),
    ).rejects.toThrow('verified email required');
    await expect(auth.login(user.email, password)).rejects.toThrow(
      'Verify your email',
    );
    user.email = user.email_verified_address;
    user.is_active = false;
    await expect(
      auth.getCurrentUserFromPayload({ jti: 'old-session' }),
    ).rejects.toThrow('verified email required');
  });
});
