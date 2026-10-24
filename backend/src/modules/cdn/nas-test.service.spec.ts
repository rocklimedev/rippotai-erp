import { NasTestService } from './nas-test.service';
import { NasService } from './nas.service';
import { CdnService } from './cdn.service';
import { signFileReference, privateFileUrl } from './file-access';

describe('NAS test uploads', () => {
  const key = 'private-documents-12345678-1234-1234-1234-123456789abc.pdf';
  let service: NasTestService;
  let put: jest.Mock;
  let streamFile: jest.Mock;
  const original = { ...process.env };
  beforeEach(() => {
    process.env = {
      ...original,
      CDN_HOST: '',
      CDN_BASE_URL: 'https://cdn.example.test',
      FILE_ACCESS_SECRET: 'a'.repeat(32),
    };
    put = jest.fn().mockResolvedValue(undefined);
    streamFile = jest.fn(async (_key, destination) => {
      destination.end(Buffer.from('test file'));
      await new Promise<void>((resolve, reject) => {
        destination.on('finish', resolve);
        destination.on('error', reject);
      });
    });
    service = new NasTestService(
      { enabled: () => true, put } as unknown as NasService,
      { streamFile } as unknown as CdnService,
    );
  });
  afterEach(() => {
    process.env = { ...original };
  });

  it('forces a small file onto NAS with a separate scoped key', async () => {
    const result = await service.upload(
      {
        originalname: 'plan.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('plan'),
        size: 4,
      } as Express.Multer.File,
      'drawings',
    );
    expect(result.filename).toMatch(/^private-drawings-nas-.*\.pdf$/);
    expect(result.verified).toBe(true);
    expect(put).toHaveBeenCalledWith(result.filename, Buffer.from('plan'));
  });

  it('copies an authorized CDN file without changing or deleting its source', async () => {
    const result = await service.copy(signFileReference(privateFileUrl(key)));
    expect(streamFile).toHaveBeenCalledWith(key, expect.anything());
    expect(result.filename).not.toBe(key);
    expect(put).toHaveBeenCalledWith(result.filename, Buffer.from('test file'));
  });

  it('rejects unsigned and external links before reading storage', async () => {
    await expect(service.copy(privateFileUrl(key))).rejects.toThrow();
    await expect(
      service.copy('https://other.example/' + key),
    ).rejects.toThrow();
    expect(streamFile).not.toHaveBeenCalled();
  });

  it('rejects expired signed links', async () => {
    await expect(
      service.copy(signFileReference(privateFileUrl(key), 1)),
    ).rejects.toThrow();
    expect(streamFile).not.toHaveBeenCalled();
  });

  it('rejects oversized CDN copies before writing to NAS', async () => {
    streamFile.mockImplementationOnce(async (_key, destination) => {
      const failure = new Promise((_, reject) =>
        destination.on('error', reject),
      );
      destination.end(Buffer.alloc(25 * 1024 * 1024 + 1));
      await failure;
    });
    await expect(
      service.copy(signFileReference(privateFileUrl(key))),
    ).rejects.toThrow('25 MiB');
    expect(put).not.toHaveBeenCalled();
  });

  it('does not silently stage a failed NAS upload', async () => {
    put.mockRejectedValueOnce(new Error('NAS unavailable'));
    await expect(
      service.upload(
        {
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.from('test'),
          size: 4,
        } as Express.Multer.File,
        'documents',
      ),
    ).rejects.toThrow('NAS unavailable');
  });
});
