import { Injectable, Logger } from '@nestjs/common';
import SftpClient from 'ssh2-sftp-client';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Local-disk fallback: when no SFTP host is configured (local/dev setups),
 * files are written to CDN_UPLOAD_PATH and served by main.ts at /cdn.
 */
const isLocalCdn = () => !process.env.CDN_HOST;
const localDir = () => process.env.CDN_UPLOAD_PATH || '/tmp/inos-cdn';
const localBaseUrl = () =>
  process.env.CDN_BASE_URL ||
  `http://localhost:${process.env.PORT || 5000}/cdn`;

export interface CdnUploadResult {
  filename: string;
  url: string;
}

@Injectable()
export class CdnService {
  private readonly logger = new Logger(CdnService.name);

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

  private async localPut(
    buffer: Buffer,
    originalname: string,
  ): Promise<CdnUploadResult> {
    const ext = path.extname(originalname || '') || '';
    const filename = `${uuidv4()}${ext}`;
    await fs.mkdir(localDir(), { recursive: true });
    await fs.writeFile(path.join(localDir(), filename), buffer);
    return { filename, url: `${localBaseUrl()}/${filename}` };
  }

  async uploadFile(file: Express.Multer.File): Promise<CdnUploadResult> {
    if (isLocalCdn()) return this.localPut(file.buffer, file.originalname);
    const sftp = await this.connect();

    try {
      const ext = path.extname(file.originalname);

      const filename = `${uuidv4()}${ext}`;

      const remotePath = `${process.env.CDN_UPLOAD_PATH}/${filename}`;

      await sftp.put(file.buffer, remotePath);

      const url = `${process.env.CDN_BASE_URL}/${filename}`;

      return {
        filename,
        url,
      };
    } finally {
      await sftp.end().catch(() => {});
    }
  }

  /**
   * Upload raw buffer
   * Used for generated PDFs and base64 uploads
   */
  async uploadBuffer(
    buffer: Buffer,
    originalname: string,
  ): Promise<CdnUploadResult> {
    if (isLocalCdn()) return this.localPut(buffer, originalname);
    const sftp = await this.connect();

    try {
      const ext = path.extname(originalname) || '';

      const filename = `${uuidv4()}${ext}`;

      const remotePath = `${process.env.CDN_UPLOAD_PATH}/${filename}`;

      await sftp.put(buffer, remotePath);

      const url = `${process.env.CDN_BASE_URL}/${filename}`;

      return {
        filename,
        url,
      };
    } finally {
      await sftp.end().catch(() => {});
    }
  }

  /**
   * Download file from CDN storage
   */
  async downloadFile(storageFilename: string): Promise<Buffer> {
    if (isLocalCdn()) {
      return fs.readFile(path.join(localDir(), path.basename(storageFilename)));
    }
    const sftp = await this.connect();

    try {
      const remotePath = `${process.env.CDN_UPLOAD_PATH}/${storageFilename}`;

      const data = await sftp.get(remotePath);

      if (Buffer.isBuffer(data)) {
        return data;
      }

      if (typeof data === 'string') {
        return Buffer.from(data);
      }

      if (data instanceof Uint8Array) {
        return Buffer.from(data);
      }

      throw new Error(
        `Unsupported CDN response type for file: ${storageFilename}`,
      );
    } finally {
      await sftp.end().catch(() => {});
    }
  }

  /**
   * Delete file from CDN storage
   */
  async deleteFile(storageFilename: string): Promise<void> {
    if (isLocalCdn()) {
      await fs
        .unlink(path.join(localDir(), path.basename(storageFilename)))
        .catch(() => undefined);
      return;
    }
    const sftp = await this.connect();

    try {
      const remotePath = `${process.env.CDN_UPLOAD_PATH}/${storageFilename}`;

      await sftp.delete(remotePath);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown CDN delete error';

      this.logger.warn(`Could not delete ${storageFilename}: ${message}`);
    } finally {
      await sftp.end().catch(() => {});
    }
  }
}
