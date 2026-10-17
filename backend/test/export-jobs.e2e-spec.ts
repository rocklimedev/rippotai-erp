import {
  Body,
  Controller,
  Get,
  Module,
  Post,
  Req,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { RequirePermission } from '../src/common/decorator/require-permission.decorator';
import { HttpSecurityModule } from '../src/common/security/http-security.module';
import { ExportJobsModule } from '../src/modules/exports/export-jobs.module';
import { ExportJobsService } from '../src/modules/exports/export-jobs.service';
import { AsyncExport } from '../src/modules/exports/async-export.decorator';
import { startExportWorker } from '../src/modules/exports/export-worker';
import { runExportProcess } from '../src/modules/exports/export-process';
import { StripSecretsInterceptor } from '../src/common/interceptors/strip-secrets.interceptor';

class ExportInput {
  @IsOptional() @IsInt() @Min(0) @Max(3000) busyMs?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) failTimes?: number;
  @IsOptional() @IsBoolean() hang?: boolean;
  @IsOptional() @IsBoolean() permanent?: boolean;
  @IsOptional() @IsIn(['file', 'json']) result?: string;
}
@Controller('export-test')
class TestController {
  @AsyncExport('fixture')
  @RequirePermission('fixture:export')
  @Post()
  generate(@Body() _input: ExportInput, @Req() _req: any, @Res() _res: any) {
    throw new Error('Renderer ran in the API process');
  }

  @AsyncExport('fixture')
  @RequirePermission('fixture:export')
  @Post('save')
  save(@Body() _input: ExportInput) {
    throw new Error('Renderer ran in the API process');
  }

  @RequirePermission('fixture:read')
  @Get('normal')
  normal() {
    return { responsive: true };
  }
}
@Module({
  imports: [
    ConfigModule.forRoot({ ignoreEnvFile: true }),
    HttpSecurityModule,
    ExportJobsModule,
  ],
  controllers: [TestController],
})
class ExportTestModule {}

// Requires a disposable Redis on EXPORT_TEST_REDIS_PORT (default 16379).
describe('Export queue and process isolation', () => {
  let app: any;
  let jobs: ExportJobsService;
  let queue: Queue;
  let temp: string;
  const workers: Awaited<ReturnType<typeof startExportWorker>>[] = [];
  const env = { ...process.env };
  const secret = 'export-integration-jwt-secret';
  const actor = {
    id: 'export-owner',
    roleName: 'STAFF',
    permissions: ['fixture:export', 'fixture:read'],
  };
  const auth = `Bearer ${sign(actor, secret)}`;
  let running = 0,
    peak = 0;
  const pause = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  async function until<T>(
    read: () => Promise<T>,
    done: (value: T) => boolean,
    timeout = 20000,
  ): Promise<T> {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const value = await read();
      if (done(value)) return value;
      await pause(25);
    }
    throw new Error('Timed out waiting for export state');
  }
  const enqueue = async (body = {}, route = '/export-test') =>
    (
      await request(app.getHttpServer())
        .post(route)
        .set('Authorization', auth)
        .send(body)
        .expect(202)
    ).body;
  const complete = (id: string) =>
    until(
      () => jobs.status(id, actor),
      (value) => ['completed', 'failed'].includes(value.state),
    );

  beforeAll(async () => {
    temp = await fs.mkdtemp(path.join(os.tmpdir(), 'erp-export-tests-'));
    Object.assign(process.env, {
      EXPORT_REDIS_HOST: '127.0.0.1',
      EXPORT_REDIS_PORT: process.env.EXPORT_TEST_REDIS_PORT || '16379',
      EXPORT_REDIS_PASSWORD: '',
      EXPORT_QUEUE_PREFIX: `test-exports-${randomUUID()}`,
      EXPORT_WORKER_CONCURRENCY: '2',
      EXPORT_GLOBAL_CONCURRENCY: '2',
      EXPORT_QUEUE_CAPACITY: '3',
      EXPORT_MAX_ATTEMPTS: '2',
      EXPORT_JOB_TIMEOUT_MS: '5000',
      RATE_LIMIT_MAX: '10000',
      PRIVATE_FILE_PATH: path.join(temp, 'private'),
      CDN_UPLOAD_PATH: path.join(temp, 'public'),
    });
    delete process.env.CDN_HOST;
    await fs.mkdir(process.env.PRIVATE_FILE_PATH!, { recursive: true });
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
    app = await NestFactory.create(ExportTestModule, { logger: false });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new StripSecretsInterceptor());
    await app.init();
    jobs = app.get(ExportJobsService);
    queue = jobs.getQueue();
    await queue.waitUntilReady();
  }, 20000);

  afterAll(async () => {
    for (const worker of workers) await worker.close();
    await queue?.obliterate({ force: true });
    if (queue)
      await (
        await queue.getBackend().client
      ).del(`${process.env.EXPORT_QUEUE_PREFIX}:exports:admission`);
    await app?.close();
    passport.unuse('jwt');
    process.env = env;
    if (temp) await fs.rm(temp, { recursive: true, force: true });
  });

  it('validates and authorizes before enqueueing', async () => {
    await request(app.getHttpServer())
      .post('/export-test')
      .send({})
      .expect(401);
    const forbidden = sign({ ...actor, permissions: [] }, secret);
    await request(app.getHttpServer())
      .post('/export-test')
      .set('Authorization', `Bearer ${forbidden}`)
      .send({})
      .expect(403);
    await request(app.getHttpServer())
      .post('/export-test')
      .set('Authorization', auth)
      .send({ busyMs: -1 })
      .expect(400);
    expect(await queue.getWaitingCount()).toBe(0);
  });

  it('bounds queue admission and global concurrency while normal traffic stays responsive', async () => {
    const batch = await Promise.all([
      enqueue({ busyMs: 1200 }),
      enqueue({ busyMs: 1200 }),
      enqueue({ busyMs: 1200 }),
    ]);
    await request(app.getHttpServer())
      .post('/export-test')
      .set('Authorization', auth)
      .send({})
      .expect(503);
    const processor = async (data: any, signal?: AbortSignal) => {
      running++;
      peak = Math.max(peak, running);
      try {
        return await runExportProcess(
          data,
          signal,
          path.join(__dirname, 'fixtures/export-processor.cjs'),
        );
      } finally {
        running--;
      }
    };
    workers.push(
      await startExportWorker({ processor, skipEnv: true, signals: false }),
    );
    workers.push(
      await startExportWorker({ processor, skipEnv: true, signals: false }),
    );
    await until(
      async () => running,
      (value) => value === 2,
    );
    const start = Date.now();
    await request(app.getHttpServer())
      .get('/export-test/normal')
      .set('Authorization', auth)
      .expect(200, { responsive: true });
    expect(Date.now() - start).toBeLessThan(800);
    for (const job of batch)
      expect((await complete(job.jobId)).state).toBe('completed');
    expect(peak).toBe(2);
    const job = await queue.getJob(batch[0].jobId);
    expect(JSON.stringify(job!.data)).not.toContain('Bearer');
    const download = await request(app.getHttpServer())
      .get(batch[0].resultUrl)
      .set('Authorization', auth)
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => done(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(download.body.subarray(0, 2).toString()).toBe('PK');
    expect(download.headers['cache-control']).toContain('no-store');
  }, 25000);

  it('exposes failures, delayed retries, and successful result recovery', async () => {
    const job = await enqueue({ failTimes: 1 });
    const delayed = await until(
      () => jobs.status(job.jobId, actor),
      (value) => value.state === 'delayed',
    );
    expect(
      delayed.history.some((line) =>
        line.includes('Fixture rendering failure'),
      ),
    ).toBe(true);
    const completed = await complete(job.jobId);
    expect(completed.state).toBe('completed');
    expect(completed.attemptsMade).toBe(2);
  });

  it('enforces ownership and the current original permission on status/results/retry', async () => {
    const job = await enqueue({});
    await complete(job.jobId);
    const stranger = `Bearer ${sign({ ...actor, id: 'other-user' }, secret)}`;
    const revoked = `Bearer ${sign({ ...actor, permissions: ['fixture:read'] }, secret)}`;
    for (const suffix of ['', '/result']) {
      await request(app.getHttpServer())
        .get(`/export-jobs/${job.jobId}${suffix}`)
        .expect(401);
      await request(app.getHttpServer())
        .get(`/export-jobs/${job.jobId}${suffix}`)
        .set('Authorization', stranger)
        .expect(404);
      await request(app.getHttpServer())
        .get(`/export-jobs/${job.jobId}${suffix}`)
        .set('Authorization', revoked)
        .expect(403);
    }
    await request(app.getHttpServer())
      .post(`/export-jobs/${job.jobId}/retry`)
      .set('Authorization', stranger)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/export-jobs/${job.jobId}/retry`)
      .set('Authorization', auth)
      .expect(409);
  });

  it('preserves operation IDs across an explicit retry and strips secrets from JSON results', async () => {
    const job = await enqueue(
      { failTimes: 10, result: 'json' },
      '/export-test/save',
    );
    expect((await complete(job.jobId)).state).toBe('failed');
    const original = await queue.getJob(job.jobId);
    await fs.writeFile(
      path.join(temp, 'private', original!.data.operationId + '.attempts'),
      '100',
    );
    const retried = (
      await request(app.getHttpServer())
        .post(`/export-jobs/${job.jobId}/retry`)
        .set('Authorization', auth)
        .expect(202)
    ).body;
    expect((await complete(retried.jobId)).state).toBe('completed');
    const next = await queue.getJob(retried.jobId);
    expect(next!.data.operationId).toBe(original!.data.operationId);
    expect(next!.data.retryOf).toBe(job.jobId);
    const result = await request(app.getHttpServer())
      .get(retried.resultUrl)
      .set('Authorization', auth)
      .expect(200);
    expect(result.body.magic).toBe('PK');
    expect(result.body.pid).not.toBe(process.pid);
    expect(result.body.password_hash).toBeUndefined();
  });

  it('kills hung child processes and records bounded timeout retries', async () => {
    process.env.EXPORT_JOB_TIMEOUT_MS = '150';
    try {
      const job = await enqueue({ hang: true });
      const failed = await complete(job.jobId);
      expect(failed.state).toBe('failed');
      expect(failed.attemptsMade).toBe(2);
      expect(failed.failedReason).toContain('timed out');
    } finally {
      process.env.EXPORT_JOB_TIMEOUT_MS = '5000';
    }
  });

  it('does not retry permanent validation or revision conflicts', async () => {
    const job = await enqueue({ permanent: true });
    const failed = await complete(job.jobId);
    expect(failed.state).toBe('failed');
    expect(failed.attemptsMade).toBe(1);
    expect(failed.retryAvailable).toBe(false);
    await request(app.getHttpServer())
      .post(`/export-jobs/${job.jobId}/retry`)
      .set('Authorization', auth)
      .expect(409);
  });

  it('expires result access and removes private result bytes during retention cleanup', async () => {
    const job = await enqueue({});
    await complete(job.jobId);
    const stored = await queue.getJob(job.jobId);
    const result = stored!.returnvalue;
    expect(result.type).toBe('file');
    await (
      await queue.getBackend().client
    ).hset(queue.toKey(job.jobId), { finishedOn: Date.now() - 86401000 });
    await request(app.getHttpServer())
      .get(job.resultUrl)
      .set('Authorization', auth)
      .expect(404);
    await workers[0].cleanup();
    expect(await queue.getJob(job.jobId)).toBeUndefined();
    await expect(
      fs.stat(path.join(temp, 'private', result.key)),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
