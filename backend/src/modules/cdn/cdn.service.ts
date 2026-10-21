import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import SftpClient from 'ssh2-sftp-client';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { NasService } from './nas.service';
import { NasStagingService } from './nas-staging.service';
import {
  FileScope,
  fileScope,
  privateRoot,
  validateStorageKey,
  cdnBaseUrl,
  privateFileUrl,
} from './file-access';

export interface CdnUploadResult {
  filename: string;
  url: string;
}

@Injectable()
export class CdnService {
  constructor(
    @Optional() private readonly nas: NasService = new NasService(),
    @Optional()
    private readonly staging: NasStagingService = new NasStagingService(),
  ) {}
  private readonly logger = new Logger(CdnService.name);

  private publicRoot() {
    return process.env.CDN_UPLOAD_PATH || '/tmp/inos-cdn';
  }

  private async connect(): Promise<SftpClient> {
    const sftp = new SftpClient();
    await sftp.connect({
      host: process.env.CDN_HOST!,
      port: Number(process.env.CDN_PORT ?? 22),
      username: process.env.CDN_USERNAME!,
      password: process.env.CDN_PASSWORD!,
    });
    return sftp;
  }

  private async put(
    buffer: Buffer,
    filename: string,
    root: string,
    confidential: boolean,
  ) {
    if (process.env.CDN_HOST && !path.posix.isAbsolute(root)) {
      throw new ServiceUnavailableException(
        'CDN_UPLOAD_PATH must be the absolute directory on the CDN server',
      );
    }
    if (
      process.env.CDN_HOST &&
      confidential &&
      process.env.CDN_PRIVATE_PROXY_ENABLED !== 'true'
    ) {
      throw new ServiceUnavailableException(
        'Configure the CDN signed-file proxy before enabling private uploads (CDN_PRIVATE_PROXY_ENABLED=true)',
      );
    }
    if (!process.env.CDN_HOST) {
      await fs.mkdir(root, { recursive: true, mode: 0o700 });
      await fs.writeFile(path.join(root, filename), buffer, {
        mode: confidential ? 0o600 : 0o644,
      });
      return;
    }
    const sftp = await this.connect();
    try {
      await sftp.mkdir(root, true);
      await sftp.put(buffer, `${root}/${filename}`);
      if (confidential) await sftp.chmod(`${root}/${filename}`, '600');
    } finally {
      await sftp.end().catch(() => {});
    }
  }

  async uploadPublicFile(file: Express.Multer.File): Promise<CdnUploadResult> {
    const extensions = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    const ext = extensions[file.mimetype];
    if (!ext)
      throw new BadRequestException('Public CDN accepts profile images only');
    const filename = `${randomUUID()}${ext}`;
    await this.put(file.buffer, filename, this.publicRoot(), false);
    const base = cdnBaseUrl();
    return { filename, url: `${base}/${filename}` };
  }

  async uploadFile(
    file: Express.Multer.File,
    scope: FileScope = 'documents',
  ): Promise<CdnUploadResult> {
    return this.uploadBuffer(file.buffer, file.originalname, scope);
  }

  async uploadBuffer(
    buffer: Buffer,
    originalname: string,
    scope: FileScope = 'documents',
  ): Promise<CdnUploadResult> {
    const ext = path.extname(originalname);
    const safeExt = /^\.[a-zA-Z0-9]{1,16}$/.test(ext) ? ext : '';
    const useNas = this.nas.shouldStore(buffer.length);
    if (
      useNas &&
      process.env.CDN_HOST &&
      process.env.CDN_PRIVATE_PROXY_ENABLED !== 'true'
    ) {
      throw new ServiceUnavailableException(
        'Configure the CDN signed-file proxy before enabling NAS uploads',
      );
    }
    const filename = `private-${scope}-${useNas ? 'nas-' : ''}${randomUUID()}${safeExt}`;
    if (useNas) {
      if (this.staging.alwaysStage())
        await this.staging.stage(filename, buffer);
      else {
        try {
          await this.nas.put(filename, buffer);
        } catch (error) {
          if (!this.staging.enabled()) throw error;
          await this.staging.stage(filename, buffer);
          this.logger.warn('NAS upload staged on CDN for later transfer');
        }
      }
    } else await this.put(buffer, filename, privateRoot(), true);
    return { filename, url: privateFileUrl(filename) };
  }

  async downloadFile(storageFilename: string): Promise<Buffer> {
    validateStorageKey(storageFilename);
    if (fileScope(storageFilename) && storageFilename.includes('-nas-')) {
      const staged = await this.staging.read(storageFilename);
      return staged ?? this.nas.get(storageFilename);
    }
    const root = fileScope(storageFilename) ? privateRoot() : this.publicRoot();
    if (!process.env.CDN_HOST)
      return fs.readFile(path.join(root, storageFilename));
    const sftp = await this.connect();
    try {
      const data = await sftp.get(`${root}/${storageFilename}`);
      if (Buffer.isBuffer(data)) return data;
      if (typeof data === 'string' || data instanceof Uint8Array)
        return Buffer.from(data);
      throw new Error('Unsupported file response type');
    } finally {
      await sftp.end().catch(() => {});
    }
  }

  async deleteFile(storageFilename: string): Promise<void> {
    validateStorageKey(storageFilename);
    if (fileScope(storageFilename) && storageFilename.includes('-nas-')) {
      if (this.staging.configured())
        return this.staging.requestDelete(storageFilename);
      return this.nas.delete(storageFilename);
    }
    const root = fileScope(storageFilename) ? privateRoot() : this.publicRoot();
    if (!process.env.CDN_HOST) {
      await fs
        .unlink(path.join(root, storageFilename))
        .catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
        });
      return;
    }
    const sftp = await this.connect();
    try {
      await sftp.delete(`${root}/${storageFilename}`);
    } catch (error) {
      this.logger.warn(`Could not delete ${storageFilename}: ${String(error)}`);
      throw error;
    } finally {
      await sftp.end().catch(() => {});
    }
  }
}
