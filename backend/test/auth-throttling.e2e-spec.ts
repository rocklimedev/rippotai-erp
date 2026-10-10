import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { HttpSecurityModule } from '../src/common/security/http-security.module';
import { configureHttpSecurity } from '../src/common/security/http-security';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { ForgotPasswordService } from '../src/modules/auth/forgot-password.service';
import { AuthTokensController } from '../src/modules/auth/auth-tokens.controller';
import { AuthTokensService } from '../src/modules/auth/auth-tokens.service';

jest.mock('../src/modules/auth/auth.service', () => ({
  AuthService: class {},
}));
jest.mock('../src/modules/auth/forgot-password.service', () => ({
  ForgotPasswordService: class {},
}));

describe('Auth throttling without persistent account lockout', () => {
  let app: any;
  const envKeys = [
    'AUTH_RATE_LIMIT_MAX',
    'TOKEN_RATE_LIMIT_MAX',
    'AUTH_RATE_LIMIT_TTL_MS',
    'AUTH_IP_RATE_LIMIT_MAX',
    'SECURITY_ALERT_WEBHOOK_URL',
  ];
  const previous = new Map(envKeys.map((key) => [key, process.env[key]]));
  const secret = 'auth-rate-limit-test-secret';
  const token = sign({ id: 'staff' }, secret);
  const auth = {
    login: jest.fn(async (_email, password) => {
      if (password === 'wrong-secret')
        throw new UnauthorizedException('Invalid credentials');
      return { token: 'session' };
    }),
    signup: jest.fn().mockResolvedValue({ token: 'session' }),
    logout: jest.fn().mockResolvedValue(undefined),
    changePassword: jest.fn().mockResolvedValue({ success: true }),
    resetPassword: jest.fn(async (value) => {
      if (value === 'invalid-reset-secret')
        throw new UnauthorizedException('Invalid reset token');
      return { success: true };
    }),
  };
  const forgot = {
    forgotPassword: jest
      .fn()
      .mockResolvedValue({ message: 'Check your email' }),
  };
  const sessions = {
    listSessions: jest.fn().mockResolvedValue([]),
    revokeSession: jest.fn().mockResolvedValue({ id: 'session' }),
  };

  beforeAll(async () => {
    process.env.AUTH_RATE_LIMIT_MAX = '3';
    process.env.TOKEN_RATE_LIMIT_MAX = '2';
    process.env.AUTH_RATE_LIMIT_TTL_MS = '1000';
    process.env.AUTH_IP_RATE_LIMIT_MAX = '6';
    delete process.env.SECURITY_ALERT_WEBHOOK_URL;
    passport.use(
      'jwt',
      new Strategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: secret,
        },
        (payload, done) => done(null, payload),
      ),
    );
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ ignoreEnvFile: true }),
        HttpSecurityModule,
      ],
      controllers: [AuthController, AuthTokensController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ForgotPasswordService, useValue: forgot },
        { provide: AuthTokensService, useValue: sessions },
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    configureHttpSecurity(app);
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
    passport.unuse('jwt');
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('throttles repeated login failures while permitting another account on the same IP', async () => {
    for (let i = 0; i < 3; i++)
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.test', password: 'wrong-secret' })
        .expect(401);
    const blocked = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ' USER@example.test ', password: 'wrong-secret' })
      .expect(429);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    expect(blocked.headers['x-content-type-options']).toBe('nosniff');
    expect(blocked.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(blocked.headers['referrer-policy']).toBe('no-referrer');
    expect(blocked.headers['strict-transport-security']).toContain(
      'includeSubDomains',
    );
    expect(blocked.headers['content-security-policy']).toBeDefined();
    expect(blocked.headers['x-powered-by']).toBeUndefined();
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'other@example.test', password: 'correct' })
      .expect(201);
    expect(auth.login).toHaveBeenCalledTimes(4);
  });

  it('preserves authenticated USER account access while restricting inactive mutations', async () => {
    const account = { id: 'account-user', roleName: 'USER', permissions: [] };
    const bearer = `Bearer ${sign(account, secret)}`;
    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', bearer)
      .expect(200);
    expect(me.body.user).toMatchObject(account);
    await request(app.getHttpServer())
      .patch('/auth/change-password')
      .set('Authorization', bearer)
      .send({
        currentPassword: 'previous-secret',
        newPassword: 'new-secret-password',
      })
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', bearer)
      .expect(201);
    const inactive = `Bearer ${sign({ ...account, is_active: false }, secret)}`;
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', inactive)
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', inactive)
      .expect(201);
    await request(app.getHttpServer())
      .patch('/auth/change-password')
      .set('Authorization', inactive)
      .send({
        currentPassword: 'previous-secret',
        newPassword: 'new-secret-password',
      })
      .expect(403);
  });

  it('protects forgot/reset routes with separate budgets', async () => {
    for (let i = 0; i < 3; i++)
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'reset@example.test' })
        .expect(201);
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'reset@example.test' })
      .expect(429);
    for (let i = 0; i < 3; i++)
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'invalid-reset-secret', password: 'new-password' })
        .expect(401);
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'invalid-reset-secret', password: 'new-password' })
      .expect(429);
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'valid-reset-secret', password: 'new-password' })
      .expect(201);
  });

  it('caps signup traffic when attackers rotate account names and includes standard Retry-After', async () => {
    for (let i = 0; i < 6; i++)
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: `user-${i}@example.test`,
          password: 'secret',
          name: 'User',
        })
        .expect(201);
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'next@example.test', password: 'secret', name: 'User' })
      .expect(429);
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
    expect(auth.signup).toHaveBeenCalledTimes(6);
  });

  it('limits token administration without losing authentication or legitimate session access', async () => {
    await request(app.getHttpServer())
      .get('/auth/tokens/user/staff')
      .expect(401);
    for (let i = 0; i < 2; i++)
      await request(app.getHttpServer())
        .get('/auth/tokens/user/staff')
        .set('Authorization', `Bearer ${token}`)
        .expect(200, []);
    await request(app.getHttpServer())
      .get('/auth/tokens/user/staff')
      .set('Authorization', `Bearer ${token}`)
      .expect(429);
    await request(app.getHttpServer())
      .patch('/auth/tokens/session/revoke')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('allows normal login again after the short rate-limit window expires', async () => {
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.test', password: 'correct' })
      .expect(201);
  });
});
