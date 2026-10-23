import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
  CallHandler,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { finalize } from 'rxjs';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const TYPES: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.txt': ['text/plain'],
  '.csv': ['text/csv', 'application/vnd.ms-excel'],
  '.doc': ['application/msword'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  '.ppt': ['application/vnd.ms-powerpoint'],
  '.pptx': [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  '.dwg': ['image/vnd.dwg', 'application/acad', 'application/octet-stream'],
  '.dxf': ['image/vnd.dxf', 'application/dxf', 'application/octet-stream'],
};

export function validateUploadType(
  file: Pick<Express.Multer.File, 'originalname' | 'mimetype'>,
) {
  if (
    !TYPES[extname(file.originalname).toLowerCase()]?.includes(file.mimetype)
  ) {
    throw new BadRequestException('Unsupported file type or extension');
  }
}

const directory = join(tmpdir(), 'inos-upload-spool');
const MulterUpload = FileInterceptor('file', {
  storage: diskStorage({
    destination: (_req, _file, callback) => {
      try {
        mkdirSync(directory, { recursive: true, mode: 0o700 });
        callback(null, directory);
      } catch (error) {
        callback(error as Error, directory);
      }
    },
    filename: (_req, _file, callback) => callback(null, randomUUID()),
  }),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
    fields: 40,
    parts: 41,
    fieldSize: 64 * 1024,
    fieldNameSize: 100,
  },
  fileFilter: (_req, file, callback) => {
    try {
      validateUploadType(file);
      callback(null, true);
    } catch (error) {
      callback(error as Error, false);
    }
  },
});

// Runs after authentication and before multipart parsing. The budget is shared
// across upload routes and sessions for a user, not keyed by a rotating JWT.
@Injectable()
export class UploadRateGuard implements CanActivate {
  private static readonly windows = new Map<
    string,
    { until: number; count: number }
  >();
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const id = req.user?.id;
    if (!id) throw new HttpException('Authentication required', 401);
    const now = Date.now();
    const windows = UploadRateGuard.windows;
    for (const [key, value] of windows)
      if (value.until <= now) windows.delete(key);
    const window = windows.get(id) ?? { until: now + 60_000, count: 0 };
    if (window.count >= 10 || (!windows.has(id) && windows.size >= 10_000)) {
      throw new HttpException(
        'Upload limit exceeded. Retry in one minute.',
        429,
      );
    }
    window.count++;
    windows.set(id, window);
    return true;
  }
}

@Injectable()
export class DiskUploadInterceptor
  extends MulterUpload
  implements NestInterceptor
{
  private static active = 0;
  async intercept(context: ExecutionContext, next: CallHandler) {
    if (DiskUploadInterceptor.active >= 4) {
      throw new HttpException('Upload capacity reached. Retry shortly.', 429);
    }
    DiskUploadInterceptor.active++;
    const request = context.switchToHttp().getRequest();
    const timeout = setTimeout(() => request.destroy(), 120_000);
    timeout.unref();
    const cleanup = () => {
      clearTimeout(timeout);
      DiskUploadInterceptor.active--;
      const file = context.switchToHttp().getRequest().file;
      if (file?.path) void unlink(file.path).catch(() => undefined);
    };
    try {
      const result = await super.intercept(context, next);
      return result.pipe(finalize(cleanup));
    } catch (error) {
      cleanup();
      throw error;
    }
  }
}
