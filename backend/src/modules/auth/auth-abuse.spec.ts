import {
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { ForgotPasswordService } from './forgot-password.service';
import { HttpSecurityModule } from '@/common/security/http-security.module';
import { authTracker } from '@/common/security/auth-throttle.decorator';

jest.mock('@/common/mail/mail.service', () => ({ MailService: class {} }));

describe('Authentication and reset abuse budgets', () => {
  let app: any;
  const env = {
    AUTH_RATE_LIMIT_MAX: '2',
    AUTH_IP_RATE_LIMIT_MAX: '3',
    AUTH_RATE_LIMIT_TTL_MS: '60000',
  };
  const prior = Object.fromEntries(
    Object.keys(env).map((key) => [key, process.env[key]]),
  );
  const auth = {
    login: jest.fn(async () => {
      throw new UnauthorizedException('Invalid credentials');
    }),
    signup: jest.fn(async () => {
      throw new ForbiddenException('Public signup is disabled');
    }),
    resetPassword: jest.fn(async () => {
      throw new BadRequestException('Invalid reset token');
    }),
  };
  const forgot = {
    forgotPassword: jest.fn(async () => ({
      message:
        'If an account exists with that email, a password reset link has been sent.',
    })),
  };

  beforeAll(() => Object.assign(process.env, env));
  afterAll(() => {
    for (const key of Object.keys(env)) {
      if (prior[key] === undefined) delete process.env[key];
      else process.env[key] = prior[key];
    }
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ ignoreEnvFile: true }),
        HttpSecurityModule,
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ForgotPasswordService, useValue: forgot },
        { provide: EmailVerificationService, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterEach(async () => app?.close());

  it.each([
    [
      'login',
      { email: 'person@example.com', password: 'legacy' },
      401,
      'login',
    ],
    [
      'signup',
      {
        email: 'person@example.com',
        password: 'a strong new password',
        name: 'Person',
      },
      403,
      'signup',
    ],
    ['forgot-password', { email: 'person@example.com' }, 201, 'forgotPassword'],
    [
      'reset-password',
      { token: 'a'.repeat(64), password: 'a strong new password' },
      400,
      'resetPassword',
    ],
  ])(
    'throttles repeated /auth/%s attempts before invoking the service',
    async (route, body, status, method) => {
      for (let attempt = 0; attempt < 2; attempt++) {
        await request(app.getHttpServer())
          .post(`/auth/${route}`)
          .send(body)
          .expect(status);
      }
      const response = await request(app.getHttpServer())
        .post(`/auth/${route}`)
        .send(body)
        .expect(429);
      expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
      const mock =
        method === 'forgotPassword' ? forgot.forgotPassword : auth[method];
      expect(mock).toHaveBeenCalledTimes(2);
    },
  );

  it('enforces the IP budget when reset tokens and spoofed forwarded IPs rotate', async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .set('X-Forwarded-For', `203.0.113.${attempt + 1}`)
        .send({
          token: String(attempt).repeat(64),
          password: 'a strong new password',
        })
        .expect(400);
    }
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .set('X-Forwarded-For', '203.0.113.99')
      .send({ token: 'f'.repeat(64), password: 'a strong new password' })
      .expect(429);
    expect(auth.resetPassword).toHaveBeenCalledTimes(3);
  });

  it('does not let a fake email rotate the reset-token identity', () => {
    const req = {
      ip: '127.0.0.1',
      route: { path: '/auth/reset-password' },
      body: { token: 'secret', email: 'a@example.com' },
    };
    const first = authTracker(req);
    req.body.email = 'b@example.com';
    expect(authTracker(req)).toBe(first);
    expect(first).not.toContain('secret');
  });
});
