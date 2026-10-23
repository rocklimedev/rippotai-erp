process.env.AUTH_TRACKER_SECRET = 'test-only-shared-tracker-secret';
jest.mock('@/common/security/redis-throttler.storage', () => ({ RedisThrottlerStorage: jest.requireActual('@nestjs/throttler').ThrottlerStorageService }));
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpSecurityModule } from './common/security/http-security.module';

describe('System diagnostics access', () => {
  let app: any;
  let service: AppService;
  const secret = 'system-diagnostics-test-secret';
  const restricted = [
    '',
    '/health',
    '/health/ready',
    '/system/info',
    '/system/modules',
    '/system/summary',
  ];
  const admin = {
    id: 'admin',
    roleName: 'ADMIN',
    is_active: true,
    permissions: ['system:read'],
  };

  beforeAll(async () => {
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
      controllers: [AppController],
      providers: [AppService],
    }).compile();
    service = module.get(AppService);
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    passport.unuse('jwt');
  });

  it.each(restricted)(
    'denies anonymous access to /api/v1%s without leaking diagnostics',
    async (path) => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1${path}`)
        .expect(401);
      expect(JSON.stringify(response.body)).not.toMatch(
        /hostname|nodeVersion|cpuCount|heapUsed|Authentication|elasticsearch|categories/,
      );
    },
  );

  it.each(restricted)(
    'denies non-admin staff even with system:read on /api/v1%s',
    async (path) => {
      await request(app.getHttpServer())
        .get(`/api/v1${path}`)
        .set(
          'Authorization',
          `Bearer ${sign({ ...admin, roleName: 'STAFF' }, secret)}`,
        )
        .expect(403);
    },
  );

  it.each(['ADMIN', 'SUPERADMIN'])(
    'allows %s with explicit system permission',
    async (roleName) => {
      for (const path of restricted) {
        await request(app.getHttpServer())
          .get(`/api/v1${path}`)
          .set(
            'Authorization',
            `Bearer ${sign({ ...admin, roleName }, secret)}`,
          )
          .expect(200);
      }
    },
  );

  it.each([
    { ...admin, permissions: [] },
    { ...admin, is_active: false },
    { ...admin, roleName: 'USER' },
  ])('rejects unauthorized or disabled actors', async (actor) => {
    await request(app.getHttpServer())
      .get('/api/v1/system/info')
      .set('Authorization', `Bearer ${sign(actor, secret)}`)
      .expect(403);
  });

  it('rejects an invalid bearer token before calling diagnostic services', async () => {
    const spy = jest.spyOn(service, 'getSystemSummary');
    await request(app.getHttpServer())
      .get('/api/v1/system/summary')
      .set('Authorization', 'Bearer invalid')
      .expect(401);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('keeps anonymous liveness usable with only a minimal status payload', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200, { status: 'alive' });
    await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set('Authorization', 'Bearer expired-or-invalid')
      .expect(200, { status: 'alive' });
  });
});
