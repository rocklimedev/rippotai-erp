import { BadRequestException } from '@nestjs/common';
import { ProjectBriefsController } from './brief.controller';
import { ProjectBriefsService } from './brief.service';
import { CdnService } from '../cdn/cdn.service';

jest.mock('../cdn/cdn.service', () => ({ CdnService: class {} }));

describe('Brief reference image uploads', () => {
  const uploadFile = jest.fn().mockResolvedValue({ url: 'https://cdn.test/image.jpg' });
  const controller = new ProjectBriefsController({} as ProjectBriefsService, { uploadFile } as unknown as CdnService);
  beforeEach(() => uploadFile.mockClear());
  it('rejects missing files and non-image uploads', () => {
    expect(() => controller.uploadReferenceImage()).toThrow(BadRequestException);
    expect(() => controller.uploadReferenceImage({ mimetype: 'image/svg+xml' } as Express.Multer.File)).toThrow(BadRequestException);
    expect(uploadFile).not.toHaveBeenCalled();
  });
  it('uploads supported images with a canonical image extension', async () => {
    const buffer = Buffer.from('image');
    await expect(controller.uploadReferenceImage({ mimetype: 'image/jpeg', originalname: 'client.html', buffer } as Express.Multer.File)).resolves.toEqual({ url: 'https://cdn.test/image.jpg' });
    expect(uploadFile).toHaveBeenCalledWith(expect.objectContaining({ originalname: 'reference.jpg', buffer }));
  });
});
