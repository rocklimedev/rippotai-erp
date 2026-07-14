import { Injectable, Logger } from '@nestjs/common';
import SftpClient from 'ssh2-sftp-client';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

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

  async uploadFile(file: Express.Multer.File): Promise<CdnUploadResult> {
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
