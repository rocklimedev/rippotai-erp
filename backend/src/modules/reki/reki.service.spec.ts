import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SiteRecceService } from './reki.service';
import { SiteReccePhoto } from './models/site-recce-photo.model';
import { CreateSiteReccePhotoDto } from './dto/create-site-recce-photo.dto';
import { CreateSiteRecceDto } from './dto/create-site-recce.dto';

jest.mock('@/modules/cdn/cdn.service', () => ({ CdnService: jest.fn() }));

describe('Site recce images', () => {
  afterEach(() => jest.restoreAllMocks());

  it('assigns room shot numbers on the server in saved order', async () => {
    jest.spyOn(SiteReccePhoto, 'findOne').mockResolvedValue(null);
    const create = jest.spyOn(SiteReccePhoto, 'create').mockResolvedValue({} as any);
    const service = new SiteRecceService({} as any, {} as any);
    await (service as any).createPhotos('recce', 'room', [
      { photo_url: 'https://example.com/first.jpg', shot_number: 99 },
      { photo_url: 'https://example.com/second.jpg' },
    ], {});
    expect(create.mock.calls.map(([photo]) => photo?.shot_number)).toEqual([1, 2]);
  });

  it('accepts uploaded photos without a frontend shot number', async () => {
    expect(await validate(plainToInstance(CreateSiteReccePhotoDto, {
      photo_url: 'https://example.com/photo.jpg',
    }))).toEqual([]);
  });

  it('accepts multiple site layout URLs and rejects malformed entries', async () => {
    const base = { project_id: 'c938e16d-95de-4f1e-a4be-3ef4f856d6ea', recce_date: '2026-10-09' };
    const valid = await validate(plainToInstance(CreateSiteRecceDto, {
      ...base, existing_site_layouts: ['https://example.com/one.jpg', 'https://example.com/two.jpg'],
    }));
    expect(valid.filter((error) => error.property === 'existing_site_layouts')).toEqual([]);
    const invalid = await validate(plainToInstance(CreateSiteRecceDto, {
      ...base, existing_site_layouts: ['invalid'],
    }));
    expect(invalid.some((error) => error.property === 'existing_site_layouts')).toBe(true);
  });
});
