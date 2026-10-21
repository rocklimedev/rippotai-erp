import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { NasService } from './nas.service';
import { NasStagingService } from './nas-staging.service';
import { NasTransferService } from './nas-transfer.service';
import { CdnService } from './cdn.service';
import { privateFileUrl } from './file-access';

describe('Durable CDN staging and NAS transfers', () => {
  const originalEnv = { ...process.env };
  let directory: string;
  let staging: NasStagingService;
  let nas: NasService;
  let worker: NasTransferService;
  let storage: CdnService;
  const data = Buffer.from('large project drawing');
  const key = () => `private-drawings-nas-${randomUUID()}.pdf`;
  const age = async (name: string) => {
    const old = new Date(Date.now() - 10 * 60 * 1000);
    await fs.utimes(path.join(directory, 'staging', name), old, old);
  };

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'inos-nas-transfer-'));
    Object.assign(process.env, {
      NAS_ENABLED: 'true',
      NAS_HOST: 'nas.internal',
      NAS_PORT: '22',
      NAS_USERNAME: 'test',
      NAS_PASSWORD: 'test',
      NAS_UPLOAD_PATH: '/volume1/test',
      NAS_HOST_KEY_SHA256: 'a'.repeat(64),
      NAS_MIN_FILE_SIZE_MB: '0.000001',
      NAS_STAGING_ENABLED: 'true',
      NAS_STAGE_ALL_UPLOADS: 'false',
      NAS_CDN_STAGING_PATH: path.join(directory, 'staging'),
      NAS_TRANSFER_WORKER_ENABLED: 'true',
      NAS_STAGING_MIN_AGE_MINUTES: '5',
      NAS_TRANSFER_INTERVAL_MINUTES: '5',
      CDN_HOST: '',
      CDN_UPLOAD_PATH: path.join(directory, 'public'),
      CDN_BASE_URL: 'https://cdn.example',
    });
    staging = new NasStagingService();
    nas = new NasService();
    jest.spyOn(nas, 'put').mockRejectedValue(new Error('NAS unreachable'));
    jest.spyOn(nas, 'get').mockResolvedValue(data);
    jest.spyOn(nas, 'delete').mockResolvedValue(undefined);
    worker = new NasTransferService(nas, staging);
    storage = new CdnService(nas, staging);
  });

  afterEach(async () => {
    await worker.onModuleDestroy();
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
    await fs.rm(directory, { recursive: true, force: true });
  });

  it('accepts offline NAS uploads and keeps them readable across restart until a verified transfer succeeds', async () => {
    const uploaded = await storage.uploadBuffer(
      data,
      'drawing.pdf',
      'drawings',
    );
    expect(uploaded.url).toBe(privateFileUrl(uploaded.filename));
    expect(
      await new CdnService(nas, new NasStagingService()).downloadFile(
        uploaded.filename,
      ),
    ).toEqual(data);
    expect(nas.get).not.toHaveBeenCalled();
    expect((await staging.status()).pendingUploads).toBe(1);
    await age(uploaded.filename);
    await worker.runOnce();
    expect(worker.status().lastResult).toBe('retry_pending');
    expect(await staging.read(uploaded.filename)).toEqual(data);
    jest.mocked(nas.put).mockResolvedValue(undefined);
    await worker.runOnce();
    expect(nas.put).toHaveBeenLastCalledWith(uploaded.filename, data);
    expect(await staging.read(uploaded.filename)).toBeUndefined();
    expect(await storage.downloadFile(uploaded.filename)).toEqual(data);
    expect(nas.get).toHaveBeenCalledWith(uploaded.filename);
    expect(uploaded.url).toBe(privateFileUrl(uploaded.filename));
    expect((await staging.status()).pendingUploads).toBe(0);
  });

  it('can always stage outside-network ingress without contacting NAS, while respecting minimum age', async () => {
    process.env.NAS_STAGE_ALL_UPLOADS = 'true';
    const uploaded = await storage.uploadBuffer(data, 'drawing.pdf');
    expect(nas.put).not.toHaveBeenCalled();
    await worker.runOnce();
    expect(nas.put).not.toHaveBeenCalled();
    expect(await staging.read(uploaded.filename)).toEqual(data);
  });

  it('keeps a copy if cleanup fails and retries without changing the key', async () => {
    const filename = key();
    await staging.stage(filename, data);
    await age(filename);
    jest.mocked(nas.put).mockResolvedValue(undefined);
    const withStore = staging.withStore.bind(staging);
    const cleanup = jest
      .spyOn(staging, 'withStore')
      .mockImplementationOnce((operation) =>
        withStore((store) =>
          operation({
            ...store,
            remove: async () => {
              throw new Error('permission denied');
            },
          }),
        ),
      );
    await worker.runOnce();
    expect(await staging.read(filename)).toEqual(data);
    expect(worker.status().lastResult).toBe('retry_pending');
    cleanup.mockRestore();
    await worker.runOnce();
    expect(await staging.read(filename)).toBeUndefined();
    expect(nas.put).toHaveBeenCalledTimes(2);
  });

  it('persists deletion through outages and never transfers a tombstoned upload', async () => {
    const filename = key();
    await staging.stage(filename, data);
    await storage.deleteFile(filename);
    await expect(storage.downloadFile(filename)).rejects.toThrow(
      'File has been deleted',
    );
    await age(`.delete-${filename}`);
    await age(filename);
    jest.mocked(nas.delete).mockRejectedValueOnce(new Error('offline'));
    await worker.runOnce();
    expect((await staging.status()).pendingDeletes).toBe(1);
    expect(nas.put).not.toHaveBeenCalled();
    await worker.runOnce();
    expect((await staging.status()).pendingDeletes).toBe(0);
    expect((await staging.status()).pendingUploads).toBe(0);
    expect(nas.put).not.toHaveBeenCalled();
  });

  it('shares an exclusive lock across instances and records deletion during transfer', async () => {
    const filename = key();
    await staging.stage(filename, data);
    await age(filename);
    let finish!: () => void;
    let started!: () => void;
    const began = new Promise<void>((resolve) => {
      started = resolve;
    });
    jest.mocked(nas.put).mockImplementationOnce(async () => {
      started();
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
    });
    const firstRun = worker.runOnce();
    await began;
    const other = new NasTransferService(nas, new NasStagingService());
    try {
      await other.runOnce();
      expect(other.status().lastResult).toBe('retry_pending');
      await storage.deleteFile(filename);
      await expect(storage.downloadFile(filename)).rejects.toThrow(
        'File has been deleted',
      );
      expect(nas.put).toHaveBeenCalledTimes(1);
    } finally {
      finish();
      await firstRun;
      await other.onModuleDestroy();
    }
    expect((await staging.status()).pendingDeletes).toBe(1);
    await age(`.delete-${filename}`);
    await worker.runOnce();
    expect(nas.delete).toHaveBeenCalledWith(filename);
    expect((await staging.status()).pendingDeletes).toBe(0);
  });

  it('keeps staged reads available when new staging is disabled and validates private paths', async () => {
    const filename = key();
    await staging.stage(filename, data);
    process.env.NAS_STAGING_ENABLED = 'false';
    expect(await storage.downloadFile(filename)).toEqual(data);
    await worker.runOnce();
    expect(nas.put).not.toHaveBeenCalled();
    process.env.NAS_CDN_STAGING_PATH = path.join(
      directory,
      'public',
      'staging',
    );
    await expect(staging.read(filename)).rejects.toThrow(
      'outside the public CDN directory',
    );
  });

  it('does not create directories as a side effect of checking status', async () => {
    expect((await staging.status()).status).toBe('unavailable');
    await expect(
      fs.stat(path.join(directory, 'staging')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('does not confuse a file extension with a deletion marker', async () => {
    const filename = key().replace('.pdf', '.delete');
    await staging.stage(filename, data);
    await age(filename);
    jest.mocked(nas.put).mockResolvedValue(undefined);
    await worker.runOnce();
    expect(nas.put).toHaveBeenCalledWith(filename, data);
    expect(nas.delete).not.toHaveBeenCalled();
    expect((await staging.status()).pendingUploads).toBe(0);
  });
});
