import { BadRequestException, ConflictException } from '@nestjs/common';
import { UniqueConstraintError } from 'sequelize';
import { VendorTradeService, vendorTradeKey } from './vendor-trade.service';

describe('Vendor trade catalogue', () => {
  let model: any;
  let service: VendorTradeService;
  beforeEach(() => {
    model = {
      findAll: jest.fn(),
      findOne: jest.fn(async () => null),
      create: jest.fn(async (data) => ({ id: 'trade-id', ...data })),
    };
    service = new VendorTradeService(model);
  });
  it('lists database trades in workbook order followed by new names', async () => {
    await service.list();
    expect(model.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [
          ['sort_order', 'ASC'],
          ['name', 'ASC'],
        ],
      }),
    );
  });
  it('creates normalized catalogue records', async () => {
    const result = await service.create({ name: '  Solar   Installation  ' });
    expect(result).toMatchObject({
      id: 'trade-id',
      name: 'Solar Installation',
      normalized_name: 'solar installation',
      sort_order: 1000,
    });
  });
  it('rejects blank names and overly long names', async () => {
    await expect(service.create({ name: '   ' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.create({ name: 'a'.repeat(256) })).rejects.toThrow(
      BadRequestException,
    );
    expect(model.create).not.toHaveBeenCalled();
  });
  it('rejects duplicate case, whitespace and numbered copies', async () => {
    model.findOne.mockResolvedValue({ id: 'existing' });
    await expect(
      service.create({ name: '  Civil   Works (2) ' }),
    ).rejects.toThrow(ConflictException);
    expect(model.findOne).toHaveBeenCalledWith({
      where: { normalized_name: 'civil works' },
    });
    expect(model.create).not.toHaveBeenCalled();
    expect(vendorTradeKey('CIVIL WORKS')).toBe('civil works');
  });
  it('reports duplicate concurrent creates consistently', async () => {
    model.create.mockRejectedValue(new UniqueConstraintError({ errors: [] }));
    await expect(service.create({ name: 'Civil Works' })).rejects.toThrow(
      ConflictException,
    );
  });
  it('propagates database failures', async () => {
    model.create.mockRejectedValue(new Error('Database unavailable'));
    await expect(service.create({ name: 'Solar' })).rejects.toThrow(
      'Database unavailable',
    );
  });
});
