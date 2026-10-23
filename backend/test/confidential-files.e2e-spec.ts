process.env.AUTH_TRACKER_SECRET = 'test-only-shared-tracker-secret';
jest.mock('../src/common/security/redis-throttler.storage', () => ({ RedisThrottlerStorage: jest.requireActual('@nestjs/throttler').ThrottlerStorageService }));
import { Module, Controller, Get, Post, Body } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { CdnModule } from '../src/modules/cdn/cdn.module';
import { CdnService } from '../src/modules/cdn/cdn.service';
import { FileLinksInterceptor } from '../src/modules/cdn/file-links.interceptor';
import {
  FILE_LINK_TTL_SECONDS,
  privateRoot,
  signFileReference,
} from '../src/modules/cdn/file-access';
import { HttpSecurityModule } from '../src/common/security/http-security.module';
import { RequirePermission } from '../src/common/decorator/require-permission.decorator';
import { localPrivateCdn } from '../src/modules/cdn/local-private-cdn';

let reference: string;
let savedBody: unknown;
@Controller('files-test')
class FileTestController {
  @RequirePermission('documents:read')
  @Get()
  read() {
    return { url: reference };
  }

  @RequirePermission('documents:read')
  @Post()
  save(@Body() body: unknown) {
    savedBody = body;
    return body;
  }
}
@Module({
  imports: [
    ConfigModule.forRoot({ ignoreEnvFile: true }),
    HttpSecurityModule,
    CdnModule,
  ],
  controllers: [FileTestController],
})
class FileTestModule {}

// Uses real filesystem storage, global JWT/permission guards and signed downloads.
describe('Confidential file access', () => {
  let app: NestExpressApplication;
  let storage: CdnService;
  let temp: string;
  let privateKey: string;
  const originalEnv = { ...process.env };
  const secret = 'file-test-jwt-secret';
  const token = sign(
    { id: 'staff', roleName: 'STAFF', permissions: ['documents:read'] },
    secret,
  );
  const auth = `Bearer ${token}`;
  const makeFile = (name = 'contract.pdf') =>
    ({
      buffer: Buffer.from('confidential contract'),
      originalname: name,
      mimetype: 'application/pdf',
    }) as Express.Multer.File;
  const route = (url: string) => {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  };

  beforeAll(async () => {
    temp = await fs.mkdtemp(path.join(os.tmpdir(), 'erp-files-'));
    delete process.env.CDN_HOST;
    process.env.CDN_UPLOAD_PATH = path.join(temp, 'public');
    process.env.PRIVATE_FILE_PATH = path.join(temp, 'private');
    process.env.CDN_BASE_URL = 'http://files.test/cdn';
    process.env.FILE_ACCESS_BASE_URL = 'http://files.test/api/v1';
    process.env.FILE_ACCESS_SECRET =
      'a-file-signing-secret-with-at-least-32-bytes';
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
    app = await NestFactory.create<NestExpressApplication>(FileTestModule, {
      logger: false,
    });
    app.useGlobalInterceptors(new FileLinksInterceptor());
    await fs.mkdir(process.env.CDN_UPLOAD_PATH, { recursive: true });
    app.use('/cdn', localPrivateCdn(app.get(CdnService)));
    app.use(
      '/cdn',
      express.static(process.env.CDN_UPLOAD_PATH, {
        setHeaders: (res) => res.setHeader('Access-Control-Allow-Origin', '*'),
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
    storage = app.get(CdnService);
    const uploaded = await storage.uploadFile(makeFile());
    privateKey = uploaded.filename;
    reference = uploaded.url;
  });

  afterAll(async () => {
    await app?.close();
    passport.unuse('jwt');
    jest.useRealTimers();
    process.env = originalEnv;
    if (temp) await fs.rm(temp, { recursive: true, force: true });
  });

  it('keeps confidential bytes outside the public static root and denies unsigned URLs', async () => {
    await request(app.getHttpServer()).get(`/cdn/${privateKey}`).expect(403);
    await request(app.getHttpServer())
      .get(`/api/v1/cdn/private/${privateKey}`)
      .expect(403);
    await request(app.getHttpServer()).get('/api/v1/files-test').expect(401);
    const forbidden = sign(
      { id: 'staff', roleName: 'STAFF', permissions: [] },
      secret,
    );
    await request(app.getHttpServer())
      .get('/api/v1/files-test')
      .set('Authorization', `Bearer ${forbidden}`)
      .expect(403);
  });

  it('serves authorized expiring links without caching and rejects tampering', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/v1/files-test')
      .set('Authorization', auth)
      .expect(200);
    expect(result.body.url).toContain('signature=');
    expect(result.body.url).toMatch(/^http:\/\/files\.test\/cdn\/private-/);
    const response = await request(app.getHttpServer())
      .get(route(result.body.url))
      .expect(200);
    expect(response.body.toString()).toBe('confidential contract');
    expect(response.headers['cache-control']).toContain('no-store');
    const tampered = new URL(result.body.url);
    tampered.searchParams.set('signature', '0'.repeat(64));
    await request(app.getHttpServer())
      .get(route(tampered.toString()))
      .expect(403);
    tampered.searchParams.set(
      'expires',
      String(Math.floor(Date.now() / 1000) + 3600),
    );
    await request(app.getHttpServer())
      .get(route(tampered.toString()))
      .expect(403);
    await request(app.getHttpServer())
      .get(
        route(result.body.url).replace(
          privateKey,
          privateKey.replace('documents', 'drawings'),
        ),
      )
      .expect(403);
  });

  it('rejects the same leaked link after expiry', async () => {
    const url = signFileReference(reference);
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(Date.now() + (FILE_LINK_TTL_SECONDS + 1) * 1000);
    await request(app.getHttpServer()).get(route(url)).expect(403);
    jest.useRealTimers();
  });

  it('normalizes preview URLs back to durable references before saving', async () => {
    const body = { url: signFileReference(reference) };
    const result = await request(app.getHttpServer())
      .post('/api/v1/files-test')
      .set('Authorization', auth)
      .send(body)
      .expect(201);
    expect(result.body.url).toContain('signature=');
    expect(savedBody).toEqual({ url: reference });
  });

  it('does not issue links for a different confidential scope', async () => {
    const original = reference;
    reference = (
      await storage.uploadFile(makeFile('signature.png'), 'signatures')
    ).url;
    const result = await request(app.getHttpServer())
      .get('/api/v1/files-test')
      .set('Authorization', auth)
      .expect(200);
    expect(result.body.url).toBeNull();
    reference = original;
  });

  it('keeps explicit public profile images accessible without authentication', async () => {
    const image = await storage.uploadPublicFile({
      ...makeFile('avatar.png'),
      mimetype: 'image/png',
    });
    const result = await request(app.getHttpServer())
      .get(`/cdn/${image.filename}`)
      .expect(200);
    expect(result.headers['access-control-allow-origin']).toBe('*');
    await expect(storage.uploadPublicFile(makeFile())).rejects.toThrow(
      'profile images',
    );
  });

  it('rejects traversal and a private directory inside the public root', async () => {
    await expect(storage.downloadFile('../secret')).rejects.toThrow();
    const original = process.env.PRIVATE_FILE_PATH;
    process.env.PRIVATE_FILE_PATH = path.join(
      process.env.CDN_UPLOAD_PATH!,
      'private',
    );
    expect(() => privateRoot()).toThrow();
    process.env.PRIVATE_FILE_PATH = original;
  });
});
