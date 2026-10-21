import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import SftpClient from 'ssh2-sftp-client';
import * as path from 'path';
import { createHash, randomUUID } from 'crypto';
import { validateStorageKey } from './file-access';

@Injectable()
export class NasService {
  enabled() {
    return process.env.NAS_ENABLED === 'true';
  }

  private config() {
    const root = process.env.NAS_UPLOAD_PATH || '';
    const port = Number(process.env.NAS_PORT || 22);
    const threshold = Number(process.env.NAS_MIN_FILE_SIZE_MB || 50);
    const fingerprint = process.env.NAS_HOST_KEY_SHA256 || '';
    if (
      !process.env.NAS_HOST ||
      !process.env.NAS_USERNAME ||
      !process.env.NAS_PASSWORD ||
      !path.posix.isAbsolute(root) ||
      path.posix.normalize(root) === '/' ||
      root.split('/').includes('..') ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535 ||
      !Number.isFinite(threshold) ||
      threshold <= 0 ||
      !/^[a-fA-F0-9]{64}$/.test(fingerprint)
    ) {
      throw new ServiceUnavailableException(
        'NAS configuration is incomplete or invalid',
      );
    }
    return { root: path.posix.normalize(root), port, threshold, fingerprint };
  }

  shouldStore(size: number) {
    return this.enabled() && size >= this.config().threshold * 1024 * 1024;
  }

  private async withClient<T>(
    operation: (client: SftpClient, root: string) => Promise<T>,
  ) {
    // Reads remain available when new NAS uploads are disabled.
    const config = this.config();
    const client = new SftpClient();
    try {
      await client.connect({
        host: process.env.NAS_HOST!,
        port: config.port,
        username: process.env.NAS_USERNAME!,
        password: process.env.NAS_PASSWORD!,
        readyTimeout: 10000,
        retries: 0,
        hostHash: 'sha256',
        hostVerifier: (hash: string) =>
          hash.toLowerCase() === config.fingerprint.toLowerCase(),
      });
      return await operation(client, config.root);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  async put(key: string, buffer: Buffer) {
    validateStorageKey(key);
    await this.withClient(async (client, root) => {
      // The shared folder must be provisioned by an administrator first.
      const temporary = `${root}/.upload-${randomUUID()}`;
      try {
        await client.put(buffer, temporary);
        await client.chmod(temporary, '600');
        const copy = await client.get(temporary);
        if (
          !Buffer.isBuffer(copy) ||
          createHash('sha256').update(copy).digest('hex') !==
            createHash('sha256').update(buffer).digest('hex')
        ) {
          throw new Error('NAS copy verification failed');
        }
        // Replace atomically on retry; never serve a partially transferred final key.
        await client.posixRename(temporary, `${root}/${key}`);
      } finally {
        await client.delete(temporary).catch(() => undefined);
      }
    });
  }

  async get(key: string): Promise<Buffer> {
    validateStorageKey(key);
    return this.withClient(async (client, root) => {
      const data = await client.get(`${root}/${key}`);
      if (!Buffer.isBuffer(data)) throw new Error('Unsupported NAS response');
      return data;
    });
  }

  async delete(key: string) {
    validateStorageKey(key);
    await this.withClient(async (client, root) => {
      try {
        await client.delete(`${root}/${key}`);
      } catch (error) {
        if (
          (error as { code?: string | number }).code !== 2 &&
          (error as { code?: string | number }).code !== 'ENOENT'
        )
          throw error;
      }
    });
  }

  async status() {
    const checkedAt = new Date().toISOString();
    if (!this.enabled())
      return { connected: false, status: 'disabled', checkedAt };
    try {
      this.config();
    } catch {
      return { connected: false, status: 'not_configured', checkedAt };
    }
    try {
      await this.withClient(async (client, root) => {
        const info = await client.stat(root);
        if (!info.isDirectory) throw new Error('NAS path is not a directory');
      });
      return {
        connected: true,
        status: 'connected',
        checkedAt,
        check: 'directory_access',
      };
    } catch {
      // Do not expose server addresses, account names or library errors.
      return { connected: false, status: 'unavailable', checkedAt };
    }
  }
}
