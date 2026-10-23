import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { access, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Writable } from 'stream';
import { randomUUID } from 'crypto';
import { CdnService } from './cdn.service';
import {
  DiskUploadInterceptor,
  MAX_UPLOAD_BYTES,
  UploadRateGuard,
  validateUploadType,
} from './upload-security';

describe('Bounded CDN transfers', () => {
  let app: any;
  let uploadedPath: string;
  const account = randomUUID();

  @Controller('upload')
  class UploadController {
    @Post()
    @UseGuards(UploadRateGuard)
    @UseInterceptors(DiskUploadInterceptor)
    upload(@UploadedFile() file: Express.Multer.File) {
      uploadedPath = file.path;
      expect(file.buffer).toBeUndefined();
      return { size: file.size };
    }
    @Post('fail')
    @UseGuards(UploadRateGuard)
    @UseInterceptors(DiskUploadInterceptor)
    fail(@UploadedFile() file: Express.Multer.File) {
      uploadedPath = file.path;
      throw new Error('Persistence failed');
    }
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UploadController],
    }).compile();
    app = module.createNestApplication();
    app.use((req: any, _res: any, next: any) => {
      req.user = { id: account };
      next();
    });
    await app.init();
  });
  afterAll(async () => app?.close());

  it.each(['', '/fail'])(
    'uses disk and cleans the temporary file after %s',
    async (route) => {
      await request(app.getHttpServer())
        .post(`/upload${route}`)
        .attach('file', Buffer.from('%PDF-test'), {
          filename: 'plan.pdf',
          contentType: 'application/pdf',
        })
        .expect(route ? 500 : 201);
      // Cleanup is asynchronous but must finish after the response has completed.
      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          await access(uploadedPath);
        } catch {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      throw new Error('Temporary upload was not removed');
    },
  );

  it('rejects unsupported file types before persisting them', async () => {
    await request(app.getHttpServer())
      .post('/upload')
      .attach('file', Buffer.from('<script>'), {
        filename: 'attack.html',
        contentType: 'text/html',
      })
      .expect(400);
    expect(() =>
      validateUploadType({ originalname: 'fake.pdf', mimetype: 'text/html' }),
    ).toThrow('Unsupported');
  });

  it('rejects uploads over 25 MB', async () => {
    await request(app.getHttpServer())
      .post('/upload')
      .attach('file', Buffer.alloc(MAX_UPLOAD_BYTES + 1), {
        filename: 'large.pdf',
        contentType: 'application/pdf',
      })
      .expect(413);
  });

  it('shares the upload budget across routes for the authenticated user', () => {
    const id = randomUUID();
    const guard = new UploadRateGuard();
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id } }) }),
    } as any;
    for (let i = 0; i < 10; i++) expect(guard.canActivate(context)).toBe(true);
    expect(() => new UploadRateGuard().canActivate(context)).toThrow(
      'Upload limit exceeded',
    );
  });

  it('streams local downloads in chunks and reports missing files before writing', async () => {
    const previous = { ...process.env };
    const directory = await mkdtemp(join(tmpdir(), 'cdn-stream-test-'));
    try {
      delete process.env.CDN_HOST;
      process.env.CDN_UPLOAD_PATH = join(directory, 'public');
      process.env.PRIVATE_FILE_PATH = directory;
      const key = 'private-documents-12345678-1234-1234-1234-123456789abc.pdf';
      await writeFile(join(directory, key), Buffer.alloc(1024 * 1024, 7));
      let bytes = 0;
      let chunks = 0;
      const sink = new Writable({
        write(chunk, _encoding, callback) {
          bytes += chunk.length;
          chunks++;
          callback();
        },
      });
      await new CdnService().streamFile(key, sink);
      expect(bytes).toBe(1024 * 1024);
      expect(chunks).toBeGreaterThan(1);
      const missingSink = new Writable({
        write: (_chunk, _encoding, cb) => cb(),
      });
      await expect(
        new CdnService().streamFile(key.replace('.pdf', '.png'), missingSink),
      ).rejects.toHaveProperty('code', 'ENOENT');
      expect(missingSink.destroyed).toBe(false);
    } finally {
      process.env = previous;
      await rm(directory, { recursive: true, force: true });
    }
  });
});
