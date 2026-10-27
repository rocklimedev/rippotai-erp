import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import SftpClient from 'ssh2-sftp-client';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import type { Writable } from 'stream';
import { streamSftpFile } from './sftp-stream';
import { fileScope, validateStorageKey } from './file-access';

const missingFile = (error: unknown) => {
  const code = (error as { code?: string | number })?.code;
  return code === 'ENOENT' || code === 2;
};

interface StagingStore {
  read(name: string): Promise<Buffer | undefined>;
  write(name: string, data: Buffer | string): Promise<void>;
  stream(name: string, destination: Writable): Promise<boolean>;
  remove(name: string): Promise<void>;
  list(): Promise<{ name: string; modifiedAt: number }[]>;
  lock(key: string): Promise<() => Promise<void>>;
}

/** The private CDN spool is also the durable transfer queue. No in-memory jobs. */
@Injectable()
export class NasStagingService {
  enabled() {
    return process.env.NAS_STAGING_ENABLED === 'true';
  }
  configured() {
    return Boolean(process.env.NAS_CDN_STAGING_PATH);
  }
  alwaysStage() {
    return this.enabled() && process.env.NAS_STAGE_ALL_UPLOADS === 'true';
  }

  private root() {
    const root = process.env.NAS_CDN_STAGING_PATH || '';
    const remote = Boolean(process.env.CDN_HOST);
    const paths = remote ? path.posix : path;
    const publicRoot = paths.resolve(
      process.env.CDN_UPLOAD_PATH || '/tmp/inos-cdn',
    );
    const relative = paths.relative(publicRoot, paths.resolve(root));
    const publicRelative = paths.relative(paths.resolve(root), publicRoot);
    if (
      !paths.isAbsolute(root) ||
      root.split(/[\\/]/).includes('..') ||
      paths.parse(root).root === root ||
      !relative ||
      !publicRelative ||
      !(
        publicRelative === '..' ||
        publicRelative.startsWith(`..${paths.sep}`) ||
        paths.isAbsolute(publicRelative)
      ) ||
      !(
        relative === '..' ||
        relative.startsWith(`..${paths.sep}`) ||
        paths.isAbsolute(relative)
      )
    ) {
      throw new ServiceUnavailableException(
        'NAS_CDN_STAGING_PATH must be an absolute private directory outside the public CDN directory',
      );
    }
    return paths.normalize(root);
  }

  async withStore<T>(
    operation: (store: StagingStore) => Promise<T>,
    prepare = true,
  ): Promise<T> {
    const root = this.root();
    if (!process.env.CDN_HOST) {
      if (prepare)
        await fs.mkdir(path.join(root, '.locks'), {
          recursive: true,
          mode: 0o700,
        });
      return operation({
        stream: async (name, destination) => {
          let file: fs.FileHandle;
          try {
            file = await fs.open(path.join(root, name), 'r');
          } catch (error) {
            if (missingFile(error)) return false;
            throw error;
          }
          await pipeline(file.createReadStream(), destination);
          return true;
        },
        read: async (name) => {
          try {
            return await fs.readFile(path.join(root, name));
          } catch (error) {
            if (missingFile(error)) return undefined;
            throw error;
          }
        },
        write: async (name, data) => {
          const temporary = path.join(root, `.upload-${randomUUID()}`);
          try {
            if (typeof data === 'string') await fs.copyFile(data, temporary);
            else await fs.writeFile(temporary, data, { mode: 0o600 });
            await fs.chmod(temporary, 0o600);
            await fs.rename(temporary, path.join(root, name));
          } finally {
            await fs.unlink(temporary).catch(() => undefined);
          }
        },
        remove: async (name) => {
          try {
            await fs.unlink(path.join(root, name));
          } catch (error) {
            if (!missingFile(error)) throw error;
          }
        },
        list: async () => {
          const entries = await fs.readdir(root, { withFileTypes: true });
          const files = await Promise.all(
            entries
              .filter((e) => e.isFile())
              .map(async (e) => {
                try {
                  return {
                    name: e.name,
                    modifiedAt: (await fs.stat(path.join(root, e.name)))
                      .mtimeMs,
                  };
                } catch (error) {
                  if (missingFile(error)) return undefined;
                  throw error;
                }
              }),
          );
          return files.filter((e): e is { name: string; modifiedAt: number } =>
            Boolean(e),
          );
        },
        lock: async (key) => {
          const lockPath = path.join(root, '.locks', key);
          try {
            await fs.mkdir(lockPath);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'EEXIST')
              throw new ConflictException(
                'File transfer is busy; retry shortly',
              );
            throw error;
          }
          return async () => {
            await fs.rmdir(lockPath);
          };
        },
      });
    }
    if (process.env.CDN_PRIVATE_PROXY_ENABLED !== 'true')
      throw new ServiceUnavailableException(
        'Configure the CDN signed-file proxy before enabling NAS staging',
      );
    const client = new SftpClient();
    try {
      const connection = await client.connect({
        host: process.env.CDN_HOST,
        port: Number(process.env.CDN_PORT || 22),
        username: process.env.CDN_USERNAME!,
        password: process.env.CDN_PASSWORD!,
        readyTimeout: 10000,
        retries: 0,
      });
      if (prepare) {
        await client.mkdir(`${root}/.locks`, true);
        await client.chmod(root, '700');
      }
      return await operation({
        stream: async (name, destination) => {
          try {
            await client.stat(`${root}/${name}`);
          } catch (error) {
            if (missingFile(error)) return false;
            throw error;
          }
          await streamSftpFile(client, `${root}/${name}`, destination);
          return true;
        },
        read: async (name) => {
          try {
            const data = await client.get(`${root}/${name}`);
            if (!Buffer.isBuffer(data))
              throw new Error('Unsupported staging response');
            return data;
          } catch (error) {
            if (missingFile(error)) return undefined;
            throw error;
          }
        },
        write: async (name, data) => {
          const temporary = `${root}/.upload-${randomUUID()}`;
          try {
            await client.put(data, temporary);
            await client.chmod(temporary, '600');
            await client.rename(temporary, `${root}/${name}`);
          } finally {
            await client.delete(temporary).catch(() => undefined);
          }
        },
        remove: async (name) => {
          try {
            await client.delete(`${root}/${name}`);
          } catch (error) {
            if (!missingFile(error)) throw error;
          }
        },
        list: async () =>
          (await client.list(root))
            .filter((e) => e.type === '-')
            .map((e) => ({ name: e.name, modifiedAt: e.modifyTime })),
        lock: async (key) => {
          const lockPath = `${root}/.locks/${key}`;
          try {
            // The high-level mkdir succeeds for existing directories; use the
            // exclusive SFTP operation so workers and deletes share a real lock.
            await new Promise<void>((resolve, reject) =>
              connection.mkdir(lockPath, (error) =>
                error ? reject(error) : resolve(),
              ),
            );
          } catch (error) {
            if (await client.exists(lockPath))
              throw new ConflictException(
                'File transfer is busy; retry shortly',
              );
            throw error;
          }
          return async () => {
            await client.rmdir(lockPath);
          };
        },
      });
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  private validate(key: string) {
    validateStorageKey(key);
    if (!fileScope(key) || !key.includes('-nas-'))
      throw new Error('Invalid NAS staging key');
  }

  async stage(key: string, data: Buffer | string) {
    this.validate(key);
    if (!this.enabled())
      throw new ServiceUnavailableException('NAS staging is disabled');
    await this.withStore(async (store) => {
      await store.write(key, data);
    });
  }

  async read(key: string) {
    this.validate(key);
    if (!this.configured()) return undefined;
    return this.withStore(async (store) => {
      if (await store.read(`.delete-${key}`))
        throw new NotFoundException('File has been deleted');
      return store.read(key);
    }, false);
  }

  async streamTo(key: string, destination: Writable): Promise<boolean> {
    this.validate(key);
    if (!this.configured()) return false;
    return this.withStore(async (store) => {
      if (await store.read(`.delete-${key}`))
        throw new NotFoundException('File has been deleted');
      return store.stream(key, destination);
    }, false);
  }

  async requestDelete(key: string) {
    this.validate(key);
    await this.withStore(async (store) => {
      // Publish independently of a long-running transfer: record deletion must
      // not fail after its database row has already been removed. The worker
      // never clears a tombstone on the upload path, so concurrent deletion is
      // durable even if the copy currently in flight finishes afterwards.
      if (!(await store.read(`.delete-${key}`))) {
        try {
          await store.write(`.delete-${key}`, Buffer.from('delete'));
        } catch (error) {
          // A concurrent caller may have already published the same marker.
          if (!(await store.read(`.delete-${key}`))) throw error;
        }
      }
    });
  }

  async status() {
    if (!this.configured())
      return {
        enabled: this.enabled(),
        status: this.enabled() ? 'not_configured' : 'disabled',
        pendingUploads: 0,
        pendingDeletes: 0,
      };
    try {
      return await this.withStore(async (store) => {
        const entries = await store.list();
        const uploads = entries.filter(
          (e) => fileScope(e.name) && e.name.includes('-nas-'),
        );
        const deletes = entries.filter(
          (e) =>
            e.name.startsWith('.delete-') &&
            fileScope(e.name.slice(8)) &&
            e.name.includes('-nas-'),
        );
        return {
          enabled: this.enabled(),
          status: 'available',
          pendingUploads: uploads.length,
          pendingDeletes: deletes.length,
        };
      }, false);
    } catch {
      return {
        enabled: this.enabled(),
        status: 'unavailable',
        pendingUploads: null,
        pendingDeletes: null,
      };
    }
  }
}
