import { Controller, Get, Module, Req, UseGuards } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { Public } from '../src/common/decorator/public.decorator';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth-guard';
import { HttpSecurityModule } from '../src/common/security/http-security.module';
import { configureHttpSecurity } from '../src/common/security/http-security';

@Controller('security-test')
class SecurityTestController {
  // Deliberately has no local guard: global JWT protection must cover it.
  @Get('protected')
  protected(@Req() req: any) {
    return { id: req.user.sub };
  }

  @UseGuards(JwtAuthGuard)
  @Get('existing-guard')
  existingGuard() {
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Get('public')
  public() {
    return { ok: true };
  }

  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Get('failed-auth')
  failedAuth() {
    return { ok: true };
  }
}

@Public()
@Controller('public-security-test')
class PublicSecurityTestController {
  @Get()
  get() {
    return { ok: true };
  }
}

@Module({
  imports: [ConfigModule.forRoot({ ignoreEnvFile: true }), HttpSecurityModule],
  controllers: [SecurityTestController, PublicSecurityTestController],
  providers: [JwtAuthGuard],
})
class SecurityTestModule {}

describe('Global HTTP security', () => {
  let app: NestExpressApplication;
  const secret = 'security-test-secret';
  const token = sign({ sub: 'test-user' }, secret, { expiresIn: '5m' });

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
    app = await NestFactory.create<NestExpressApplication>(SecurityTestModule, {
      logger: false,
    });
    configureHttpSecurity(app);
    app.enableCors({ origin: 'http://localhost:5173', credentials: true });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    passport.unuse('jwt');
  });

  it('requires a valid JWT even without a controller guard', async () => {
    await request(app.getHttpServer())
      .get('/security-test/protected')
      .expect(401);
    await request(app.getHttpServer())
      .get('/security-test/protected')
      .set('Authorization', 'Bearer invalid')
      .expect(401);
    await request(app.getHttpServer())
      .get('/security-test/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200, { id: 'test-user' });
  });

  it('preserves controllers with existing JWT guards', async () => {
    await request(app.getHttpServer())
      .get('/security-test/existing-guard')
      .expect(401);
    await request(app.getHttpServer())
      .get('/security-test/existing-guard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('allows explicit public controllers and adds Helmet headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/public-security-test')
      .expect(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['cross-origin-resource-policy']).toBe(
      'cross-origin',
    );
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('limits public routes and returns Retry-After without trusting spoofed IPs', async () => {
    await request(app.getHttpServer()).get('/security-test/public').expect(200);
    await request(app.getHttpServer()).get('/security-test/public').expect(200);
    const response = await request(app.getHttpServer())
      .get('/security-test/public')
      .set('X-Forwarded-For', '203.0.113.123')
      .expect(429);
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('counts rejected authentication attempts toward the rate limit', async () => {
    await request(app.getHttpServer())
      .get('/security-test/failed-auth')
      .expect(401);
    await request(app.getHttpServer())
      .get('/security-test/failed-auth')
      .expect(401);
    await request(app.getHttpServer())
      .get('/security-test/failed-auth')
      .expect(429);
  });

  it('allows CORS preflight for authenticated browser requests', async () => {
    await request(app.getHttpServer())
      .options('/security-test/protected')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization')
      .expect('Access-Control-Allow-Origin', 'http://localhost:5173')
      .expect(204);
  });
});
