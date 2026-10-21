import { NasService } from './nas.service';
import { CdnService } from './cdn.service';
import {
  fileScope,
  privateFileUrl,
  signFileReference,
  verifyFileAccess,
} from './file-access';

const client = {
  connect: jest.fn().mockResolvedValue(undefined),
  end: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ isDirectory: true }),
  put: jest.fn().mockResolvedValue(undefined),
  chmod: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  posixRename: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
};
jest.mock('ssh2-sftp-client', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => client),
}));

describe('NAS storage integration', () => {
  const env = { ...process.env };
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(process.env, {
      NAS_ENABLED: 'true',
      NAS_HOST: 'nas.internal',
      NAS_PORT: '22',
      NAS_USERNAME: 'erp',
      NAS_PASSWORD: 'test-password',
      NAS_UPLOAD_PATH: '/volume1/erp',
      NAS_HOST_KEY_SHA256: 'a'.repeat(64),
      NAS_MIN_FILE_SIZE_MB: '1',
      CDN_HOST: '',
      CDN_BASE_URL: 'https://cdn.example',
      FILE_ACCESS_SECRET: 's'.repeat(32),
      NAS_STAGING_ENABLED: 'false',
      NAS_CDN_STAGING_PATH: '',
    });
    client.connect.mockResolvedValue(undefined);
    client.stat.mockResolvedValue({ isDirectory: true });
  });
  afterEach(() => {
    process.env = { ...env };
  });

  it('distinguishes disabled, invalid, connected and unavailable without exposing errors', async () => {
    const nas = new NasService();
    process.env.NAS_ENABLED = 'false';
    expect((await nas.status()).status).toBe('disabled');
    expect(client.connect).not.toHaveBeenCalled();
    process.env.NAS_ENABLED = 'true';
    process.env.NAS_UPLOAD_PATH = 'Z:\\erp';
    expect((await nas.status()).status).toBe('not_configured');
    process.env.NAS_UPLOAD_PATH = '/volume1/erp';
    expect((await nas.status()).connected).toBe(true);
    expect(client.stat).toHaveBeenCalledWith('/volume1/erp');
    const options = client.connect.mock.calls[0][0];
    expect(options.hostVerifier('a'.repeat(64))).toBe(true);
    expect(options.hostVerifier('b'.repeat(64))).toBe(false);
    client.connect.mockRejectedValue(new Error('password or internal address'));
    const result = await nas.status();
    expect(result.status).toBe('unavailable');
    expect(JSON.stringify(result)).not.toContain('password');
    expect(client.end).toHaveBeenCalled();
  });

  it('uses the inclusive size threshold and fails closed on invalid configuration', () => {
    const nas = new NasService();
    expect(nas.shouldStore(1024 * 1024 - 1)).toBe(false);
    expect(nas.shouldStore(1024 * 1024)).toBe(true);
    process.env.NAS_MIN_FILE_SIZE_MB = 'invalid';
    expect(() => nas.shouldStore(2 * 1024 * 1024)).toThrow();
    process.env.NAS_ENABLED = 'false';
    expect(nas.shouldStore(2 * 1024 * 1024)).toBe(false);
  });

  it('routes uploads, reads and deletes by persisted NAS key, preserving signed scope checks', async () => {
    const nas = new NasService();
    const put = jest.spyOn(nas, 'put').mockResolvedValue(undefined);
    const get = jest
      .spyOn(nas, 'get')
      .mockResolvedValue(Buffer.from('original'));
    const remove = jest.spyOn(nas, 'delete').mockResolvedValue(undefined);
    const storage = new CdnService(nas);
    const uploaded = await storage.uploadBuffer(
      Buffer.alloc(1024 * 1024),
      'drawing.pdf',
      'drawings',
    );
    expect(uploaded.filename).toMatch(/^private-drawings-nas-/);
    expect(put).toHaveBeenCalled();
    expect(fileScope(uploaded.filename)).toBe('drawings');
    const signed = new URL(
      signFileReference(privateFileUrl(uploaded.filename)),
    );
    expect(() =>
      verifyFileAccess(
        uploaded.filename,
        signed.searchParams.get('expires')!,
        signed.searchParams.get('signature')!,
      ),
    ).not.toThrow();
    process.env.NAS_ENABLED = 'false';
    expect(await storage.downloadFile(uploaded.filename)).toEqual(
      Buffer.from('original'),
    );
    await storage.deleteFile(uploaded.filename);
    expect(get).toHaveBeenCalledWith(uploaded.filename);
    expect(remove).toHaveBeenCalledWith(uploaded.filename);
  });

  it('does not fall back to CDN when NAS upload fails', async () => {
    const nas = new NasService();
    jest.spyOn(nas, 'put').mockRejectedValue(new Error('NAS unavailable'));
    await expect(
      new CdnService(nas).uploadBuffer(Buffer.alloc(1024 * 1024), 'large.pdf'),
    ).rejects.toThrow('NAS unavailable');
  });

  it('verifies contents before publishing an atomic NAS key and rejects corrupted transfers', async () => {
    const nas = new NasService();
    const key = 'private-drawings-nas-12345678-1234-1234-1234-123456789abc.pdf';
    client.get.mockResolvedValueOnce(Buffer.from('corrupted'));
    await expect(nas.put(key, Buffer.from('original'))).rejects.toThrow(
      'verification failed',
    );
    expect(client.posixRename).not.toHaveBeenCalled();
    client.get.mockResolvedValueOnce(Buffer.from('original'));
    await nas.put(key, Buffer.from('original'));
    expect(client.posixRename).toHaveBeenCalledWith(
      expect.stringMatching(/^\/volume1\/erp\/\.upload-/),
      `/volume1/erp/${key}`,
    );
  });
});
