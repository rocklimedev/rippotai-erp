import { BadRequestException, ConflictException } from '@nestjs/common';
import { VendorRateComparisonService } from './vendor-rate-comparison.service';

describe('Independent vendor comparisons', () => {
  let sheets: any;
  let projects: any;
  let service: VendorRateComparisonService;
  const body = () => ({
    title: ' Finishes ',
    project_id: 'p1',
    snapshot: {
      schema_version: 2,
      trades: [
        {
          id: 't1',
          name: 'Civil',
          finalised_vendor_id: 'v1',
          vendors: [
            {
              id: 'v1',
              name: 'Vendor A',
              notes: 'Includes labour',
              items: [
                {
                  id: 'i1',
                  description: 'Work',
                  quantity: null as number | null,
                  rate: 130000 as number | null,
                },
                {
                  id: 'i2',
                  description: 'Discount',
                  quantity: null as number | null,
                  rate: -1000 as number | null,
                },
              ],
            },
          ],
        },
      ],
    },
  });
  beforeEach(() => {
    sheets = {
      create: jest.fn(async (data) => ({ id: 's1', ...data })),
      findByPk: jest.fn(),
      findOne: jest.fn(async () => null),
      sequelize: {
        transaction: jest.fn(async (callback) =>
          callback({ id: 'transaction' }),
        ),
      },
      findAll: jest.fn(),
      update: jest.fn(async () => [1]),
    };
    projects = { findByPk: jest.fn(async () => ({ id: 'p1' })) };
    service = new VendorRateComparisonService(sheets, projects);
  });
  it('creates without a BOQ, including lump sums and discounts', async () => {
    expect(await service.create(body(), 'u')).toMatchObject({
      title: 'Finishes',
      boq_id: null,
      revision: 1,
      created_by: 'u',
    });
  });
  it('persists separate vendor notes and rejects invalid notes', async () => {
    const saved = await service.create(body(), 'u');
    expect(saved.snapshot.trades[0].vendors[0].notes).toBe('Includes labour');
    const input = body();
    input.snapshot.trades[0].vendors[0].notes = 'x'.repeat(10001);
    await expect(service.create(input, 'u')).rejects.toThrow(
      BadRequestException,
    );
  });
  it('rejects duplicate trade names including numbered copies', async () => {
    const input = body();
    input.snapshot.trades.push({
      ...input.snapshot.trades[0],
      id: 't2',
      name: 'civil (2)',
    });
    await expect(service.create(input, 'u')).rejects.toThrow(
      'Trade names must be unique',
    );
  });
  it('persists shared scope and rejects differing vendor quantities', async () => {
    const input = body();
    const trade = input.snapshot.trades[0] as any;
    trade.items = trade.vendors[0].items.map(({ rate, ...item }) => item);
    trade.vendor_column_count = 4;
    await expect(service.create(input, 'u')).resolves.toBeDefined();
    trade.vendors[0].items[0].quantity = 2;
    await expect(service.create(input, 'u')).rejects.toThrow(
      'must match the shared item',
    );
  });
  it('rejects missing vendor lines and invalid vendor column counts', async () => {
    const input = body();
    const trade = input.snapshot.trades[0] as any;
    trade.items = trade.vendors[0].items.map(({ rate, ...item }) => item);
    trade.vendor_column_count = 5;
    await expect(service.create(input, 'u')).rejects.toThrow(
      'one and four vendors',
    );
    trade.vendor_column_count = 3;
    trade.vendors[0].items.pop();
    await expect(service.create(input, 'u')).rejects.toThrow(
      'must use the shared comparison items',
    );
  });
  it('rejects another comparison for the same project with the existing sheet ID', async () => {
    sheets.findOne.mockResolvedValue({ id: 'existing-sheet' });
    let error: any;
    try {
      await service.create(body(), 'u');
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getResponse()).toMatchObject({
      comparison_id: 'existing-sheet',
    });
    expect(sheets.create).not.toHaveBeenCalled();
    expect(projects.findByPk).toHaveBeenCalledWith('p1', {
      transaction: { id: 'transaction' },
      lock: 'UPDATE',
    });
    expect(sheets.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { project_id: 'p1' },
        transaction: { id: 'transaction' },
      }),
    );
  });
  it('creates while holding the project transaction lock', async () => {
    await service.create(body(), 'u');
    expect(sheets.create).toHaveBeenCalledWith(
      expect.objectContaining({ project_id: 'p1' }),
      { transaction: { id: 'transaction' } },
    );
  });
  it('rejects renaming a saved comparison without changing its data', async () => {
    sheets.findByPk.mockResolvedValue({
      id: 's1',
      project_id: 'p1',
      title: 'Original title',
      revision: 3,
    });
    await expect(
      service.update('s1', { ...body(), revision: 3 }),
    ).rejects.toThrow('cannot be renamed');
    expect(sheets.update).not.toHaveBeenCalled();
  });
  it('rejects missing projects', async () => {
    projects.findByPk.mockResolvedValue(null);
    await expect(service.create(body(), 'u')).rejects.toThrow(
      BadRequestException,
    );
  });
  it.each(['quantity', 'rate'])('rejects nonfinite %s', async (key) => {
    const input = body();
    input.snapshot.trades[0].vendors[0].items[0][key] = Infinity;
    await expect(service.create(input, 'u')).rejects.toThrow(
      BadRequestException,
    );
  });
  it('rejects negative quantities but accepts explicit zero', async () => {
    const input = body();
    input.snapshot.trades[0].vendors[0].items[0].quantity = -1;
    await expect(service.create(input, 'u')).rejects.toThrow(
      BadRequestException,
    );
    input.snapshot.trades[0].vendors[0].items[0].quantity = 0;
    await expect(service.create(input, 'u')).resolves.toBeDefined();
  });
  it('allows incomplete quotes, finalised or not', async () => {
    const input = body();
    input.snapshot.trades[0].vendors[0].items[0].rate = null;
    await expect(service.create(input, 'u')).resolves.toBeDefined();
    input.snapshot.trades[0].finalised_vendor_id = '';
    await expect(service.create(input, 'u')).resolves.toBeDefined();
  });
  it('rejects unrelated finalised vendors and duplicate trade IDs', async () => {
    const input = body();
    input.snapshot.trades[0].finalised_vendor_id = 'other';
    await expect(service.create(input, 'u')).rejects.toThrow(
      BadRequestException,
    );
    input.snapshot.trades[0].finalised_vendor_id = 'v1';
    input.snapshot.trades.push(input.snapshot.trades[0]);
    await expect(service.create(input, 'u')).rejects.toThrow(
      BadRequestException,
    );
  });
  it('upgrades historical sheets and permits editable trades', async () => {
    sheets.findByPk.mockResolvedValue({
      project_id: 'p1',
      title: 'Finishes',
      boq_id: 'old-boq',
      revision: 3,
      snapshot: { schema_version: 1 },
    });
    await service.update('s1', { ...body(), revision: 3 });
    expect(sheets.update).toHaveBeenCalledWith(
      expect.objectContaining({ revision: 4, snapshot: body().snapshot }),
      { where: { id: 's1', revision: 3 } },
    );
  });
  it('blocks stale revisions and racing writes', async () => {
    sheets.findByPk.mockResolvedValue({
      project_id: 'p1',
      title: 'Finishes',
      revision: 3,
    });
    await expect(
      service.update('s1', { ...body(), revision: 2 }),
    ).rejects.toThrow(ConflictException);
    sheets.update.mockResolvedValue([0]);
    await expect(
      service.update('s1', { ...body(), revision: 3 }),
    ).rejects.toThrow(ConflictException);
  });
  it('keeps original project', async () => {
    sheets.findByPk.mockResolvedValue({ project_id: 'other', revision: 3 });
    await expect(
      service.update('s1', { ...body(), revision: 3 }),
    ).rejects.toThrow(BadRequestException);
  });
  it('lists without loading snapshots or BOQ associations', async () => {
    await service.list('p1');
    expect(sheets.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { project_id: 'p1' },
        attributes: { exclude: ['snapshot'] },
        include: [expect.objectContaining({ attributes: ['id', 'name'] })],
      }),
    );
  });
});
