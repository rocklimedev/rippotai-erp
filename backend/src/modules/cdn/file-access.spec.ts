import { CdnService } from './cdn.service';
import {
  cdnBaseUrl,
  privateRoot,
  privateFileKey,
  normalizeFileLink,
  signFileReference,
  verifyFileAccess,
} from './file-access';
import { resolveFileLinks } from './file-links.interceptor';
import { localPrivateCdn } from './local-private-cdn';

const mockSftp = {
  connect: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  put: jest.fn().mockResolvedValue(undefined),
  chmod: jest.fn().mockResolvedValue(undefined),
  end: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(Buffer.from('private')),
  delete: jest.fn().mockResolvedValue(undefined),
};
jest.mock('ssh2-sftp-client', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockSftp),
}));

describe('Absolute CDN URLs and original remote directory', () => {
  const originalEnv = { ...process.env };
  const base = 'https://media-buildcon.rippotaiarchitecture.com';
  const key = 'private-documents-12345678-1234-1234-1234-123456789abc.pdf';
  const reference = `${base}/${key}`;
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(process.env, {
      CDN_BASE_URL: base,
      CDN_HOST: 'sftp.example',
      CDN_UPLOAD_PATH: '/home/account/public_html/media',
      PRIVATE_FILE_PATH: 'C:/local/private',
      CDN_PRIVATE_PROXY_ENABLED: 'true',
      FILE_ACCESS_SECRET: 'a-random-test-secret-containing-at-least-32-bytes',
      FILE_ACCESS_BASE_URL: 'https://api.example/api/v1',
    });
  });
  afterEach(() => {
    process.env = { ...originalEnv };
    jest.useRealTimers();
  });

  it('uploads to the configured CDN directory and stores an absolute CDN URL', async () => {
    const file = await new CdnService().uploadBuffer(
      Buffer.from('contract'),
      'contract.pdf',
    );
    expect(file.url).toBe(`${base}/${file.filename}`);
    expect(file.url).not.toContain('private-file://');
    expect(file.url).not.toContain('api.example');
    expect(mockSftp.put).toHaveBeenCalledWith(
      Buffer.from('contract'),
      `/home/account/public_html/media/${file.filename}`,
    );
    expect(privateRoot()).toBe('/home/account/public_html/media');
  });

  it('reads and deletes confidential files in the same original CDN directory', async () => {
    const storage = new CdnService();
    await expect(storage.downloadFile(key)).resolves.toEqual(
      Buffer.from('private'),
    );
    await storage.deleteFile(key);
    expect(mockSftp.get).toHaveBeenCalledWith(
      `/home/account/public_html/media/${key}`,
    );
    expect(mockSftp.delete).toHaveBeenCalledWith(
      `/home/account/public_html/media/${key}`,
    );
  });

  it('keeps public asset URLs on the CDN without requiring the private proxy', async () => {
    delete process.env.CDN_PRIVATE_PROXY_ENABLED;
    const uploaded = await new CdnService().uploadPublicFile({
      buffer: Buffer.from('avatar'),
      originalname: 'avatar.png',
      mimetype: 'image/png',
    } as Express.Multer.File);
    expect(uploaded.url).toBe(`${base}/${uploaded.filename}`);
    expect(uploaded.url).not.toContain('signature=');
    expect(normalizeFileLink(uploaded.url)).toBe(uploaded.url);
  });

  it('fails closed until the CDN protects confidential filenames', async () => {
    delete process.env.CDN_PRIVATE_PROXY_ENABLED;
    await expect(
      new CdnService().uploadBuffer(Buffer.from('contract'), 'contract.pdf'),
    ).rejects.toThrow('CDN signed-file proxy');
    expect(mockSftp.put).not.toHaveBeenCalled();
  });

  it('does not reinterpret a Windows folder or HTTPS URL as a remote SFTP directory', () => {
    for (const value of ['C:/local/cdn', base]) {
      process.env.CDN_UPLOAD_PATH = value;
      expect(() => privateRoot()).toThrow(
        'absolute directory on the CDN server',
      );
    }
  });

  it('signs CDN URLs and restores their unsigned absolute form for persistence', () => {
    const url = signFileReference(reference);
    expect(url.startsWith(`${reference}?expires=`)).toBe(true);
    expect(normalizeFileLink(url)).toBe(reference);
    const parsed = new URL(url);
    verifyFileAccess(
      key,
      parsed.searchParams.get('expires')!,
      parsed.searchParams.get('signature')!,
    );
    parsed.searchParams.set('signature', '0'.repeat(64));
    expect(() => normalizeFileLink(parsed.toString())).toThrow(
      'Invalid file reference',
    );
  });

  it('retains compatibility with old references and enforces scope grants', () => {
    expect(privateFileKey(reference)).toBe(key);
    expect(normalizeFileLink(`private-file://${key}`)).toBe(reference);
    const links = resolveFileLinks(
      { url: reference, legacy: `private-file://${key}` },
      ['documents:read'],
    ) as any;
    expect(links.url.startsWith(reference + '?')).toBe(true);
    expect(links.legacy.startsWith(reference + '?')).toBe(true);
    expect(resolveFileLinks({ url: reference }, [])).toEqual({ url: null });
    expect(cdnBaseUrl()).toBe(base);
  });

  it('still denies the same leaked CDN capability after expiration', () => {
    const signed = new URL(signFileReference(reference));
    jest.useFakeTimers();
    jest.setSystemTime(Date.now() + 301000);
    expect(() =>
      verifyFileAccess(
        key,
        signed.searchParams.get('expires')!,
        signed.searchParams.get('signature')!,
      ),
    ).toThrow('expired');
  });

  it('checks local CDN signatures before serving bytes', async () => {
    const storage = {
      downloadFile: jest.fn().mockResolvedValue(Buffer.from('private')),
    } as unknown as CdnService;
    const response: any = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    const handler = localPrivateCdn(storage);
    const next = jest.fn();
    await handler({ path: '/' + key, query: {} } as any, response, next);
    expect(response.status).toHaveBeenCalledWith(403);
    expect(storage.downloadFile).not.toHaveBeenCalled();
    const url = new URL(signFileReference(reference));
    await handler(
      { path: '/' + key, query: Object.fromEntries(url.searchParams) } as any,
      response,
      next,
    );
    expect(response.send).toHaveBeenCalledWith(Buffer.from('private'));
    expect(next).not.toHaveBeenCalled();
  });
});
