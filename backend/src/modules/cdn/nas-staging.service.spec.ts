import { NasStagingService } from './nas-staging.service';

const files = new Map<string, Buffer>();
const locks = new Set<string>();
const missing = () => Object.assign(new Error('No such file'), { code: 2 });
const connection = {
  mkdir: jest.fn((name: string, callback: (error?: Error) => void) => {
    if (locks.has(name))
      callback(Object.assign(new Error('Exists'), { code: 4 }));
    else {
      locks.add(name);
      callback();
    }
  }),
};
const client = {
  connect: jest.fn().mockResolvedValue(connection),
  end: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  chmod: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn(async (name: string) => (locks.has(name) ? 'd' : false)),
  rmdir: jest.fn(async (name: string) => {
    locks.delete(name);
  }),
  put: jest.fn(async (data: Buffer, name: string) => {
    files.set(name, data);
  }),
  get: jest.fn(async (name: string) => {
    if (!files.has(name)) throw missing();
    return files.get(name)!;
  }),
  delete: jest.fn(async (name: string) => {
    if (!files.delete(name)) throw missing();
  }),
  rename: jest.fn(async (from: string, to: string) => {
    if (!files.has(from)) throw missing();
    files.set(to, files.get(from)!);
    files.delete(from);
  }),
  list: jest.fn(async (root: string) =>
    [...files.keys()]
      .filter((name) => name.startsWith(`${root}/`))
      .map((name) => ({
        name: name.slice(root.length + 1),
        type: '-',
        modifyTime: Date.now(),
      })),
  ),
};
jest.mock('ssh2-sftp-client', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => client),
}));

describe('Remote private CDN staging', () => {
  const environment = { ...process.env };
  const key = 'private-drawings-nas-12345678-1234-1234-1234-123456789abc.pdf';
  beforeEach(() => {
    jest.clearAllMocks();
    files.clear();
    locks.clear();
    Object.assign(process.env, {
      CDN_HOST: 'cdn.internal',
      CDN_PORT: '22',
      CDN_USERNAME: 'service',
      CDN_PASSWORD: 'secret',
      CDN_UPLOAD_PATH: '/home/account/public_html/media',
      CDN_PRIVATE_PROXY_ENABLED: 'true',
      NAS_CDN_STAGING_PATH: '/home/account/private-staging',
      NAS_STAGING_ENABLED: 'true',
    });
  });
  afterEach(() => {
    process.env = { ...environment };
  });

  it('publishes uploads atomically in the designated private CDN directory', async () => {
    const staging = new NasStagingService();
    await staging.stage(key, Buffer.from('drawing'));
    expect(files.get(`/home/account/private-staging/${key}`)).toEqual(
      Buffer.from('drawing'),
    );
    expect([...files.keys()]).toEqual([`/home/account/private-staging/${key}`]);
    expect(client.rename).toHaveBeenCalledWith(
      expect.stringMatching(/^\/home\/account\/private-staging\/\.upload-/),
      `/home/account/private-staging/${key}`,
    );
    expect(await staging.read(key)).toEqual(Buffer.from('drawing'));
    jest.clearAllMocks();
    expect(await staging.status()).toMatchObject({
      status: 'available',
      pendingUploads: 1,
    });
    expect(client.mkdir).not.toHaveBeenCalled();
    expect(client.chmod).not.toHaveBeenCalled();
  });

  it('uses exclusive raw SFTP mkdir to prevent concurrent workers processing one key', async () => {
    const staging = new NasStagingService();
    await staging.withStore(async (store) => {
      const release = await store.lock(key);
      try {
        await expect(
          new NasStagingService().withStore((other) => other.lock(key)),
        ).rejects.toThrow('File transfer is busy');
      } finally {
        await release();
      }
    });
    expect(locks.size).toBe(0);
    expect(connection.mkdir).toHaveBeenCalledTimes(2);
  });

  it('rejects directories overlapping public storage and requires the private-file proxy', async () => {
    const staging = new NasStagingService();
    for (const root of [
      '/home/account/public_html/media/staging',
      '/home/account',
      '/',
    ]) {
      process.env.NAS_CDN_STAGING_PATH = root;
      await expect(staging.stage(key, Buffer.from('drawing'))).rejects.toThrow(
        'private directory',
      );
    }
    process.env.NAS_CDN_STAGING_PATH = '/home/account/private-staging';
    process.env.CDN_PRIVATE_PROXY_ENABLED = 'false';
    await expect(staging.stage(key, Buffer.from('drawing'))).rejects.toThrow(
      'signed-file proxy',
    );
    expect(client.connect).not.toHaveBeenCalled();
  });
});
