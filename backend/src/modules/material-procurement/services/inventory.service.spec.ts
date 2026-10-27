import { validateSync } from 'class-validator';
import {
  AddInventoryDto,
  AdjustInventoryDto,
  CreateInventoryTransactionDto,
  IssueMaterialDto,
  ReturnInventoryDto,
  TransferInventoryDto,
} from '../dto/inventory.dto';
import { RecordInventoryTransactionDto } from '../dto/record-inventory-transaction.dto';
import {
  InventoryDirection,
  InventoryTransactionType,
} from '../models/inventory-transaction.model';
import { InventoryService } from './inventory.service';

describe('Inventory zero-quantity business requirement', () => {
  it.each([0, 2, -3])('allows issues against an available balance of %s through both entry points', async (available) => {
    const records: any[] = [];
    const inventory = {
      create: jest.fn(async (record) => { records.push(record); return record; }),
      findAll: jest.fn(async () => records),
    };
    const material = {
      findByPk: jest.fn(async () => ({ is_active: true, unit_id: 'unit', unit: { code: 'Nos' } })),
    };
    const service = new InventoryService(inventory as any, material as any, {} as any);
    jest.spyOn(service, 'findOne').mockImplementation(async () => records[records.length - 1]);
    const balance = jest.spyOn(service, 'getCurrentStock').mockResolvedValue(available);
    const dto = { project_id: 'project', material_id: 'material', transaction_date: '2026-10-26', quantity: 5 };
    await expect(service.issue(dto)).resolves.toMatchObject({ quantity: 5, direction: InventoryDirection.OUT });
    await expect(service.create({ ...dto, transaction_type: InventoryTransactionType.ISSUE })).resolves.toMatchObject({ quantity: 5, direction: InventoryDirection.OUT });
    expect(inventory.create).toHaveBeenCalledTimes(2);
    expect(balance).not.toHaveBeenCalled();
    balance.mockRestore();
    await expect(service.getCurrentStock('project', undefined, 'material')).resolves.toBe(-10);
  });

  it('still rejects an adjustment out when stock is insufficient', async () => {
    const inventory = { create: jest.fn() };
    const material = { findByPk: jest.fn(async () => ({ is_active: true, unit_id: 'unit', unit: { code: 'Nos' } })) };
    const service = new InventoryService(inventory as any, material as any, {} as any);
    jest.spyOn(service, 'getCurrentStock').mockResolvedValue(0);
    await expect(service.create({ project_id: 'project', material_id: 'material', transaction_date: '2026-10-26', quantity: 5, transaction_type: InventoryTransactionType.ADJUSTMENT_OUT })).rejects.toThrow('Insufficient stock');
    expect(inventory.create).not.toHaveBeenCalled();
  });

  it.each([
    CreateInventoryTransactionDto,
    AddInventoryDto,
    AdjustInventoryDto,
    IssueMaterialDto,
    ReturnInventoryDto,
    TransferInventoryDto,
    RecordInventoryTransactionDto,
  ])(
    '%p accepts zero but rejects missing, negative, and non-finite quantities',
    (Dto) => {
      for (const quantity of [0, 1, undefined, -1, NaN, Infinity]) {
        const dto = Object.assign(new Dto(), { quantity });
        const errors = validateSync(dto).filter(
          (error) => error.property === 'quantity',
        );
        expect(errors.length === 0).toBe(quantity === 0 || quantity === 1);
      }
    },
  );

  it.each([
    [InventoryTransactionType.RECEIPT, InventoryDirection.IN],
    [InventoryTransactionType.ISSUE, InventoryDirection.OUT],
  ])(
    'persists a zero-quantity %s even with zero available stock',
    async (type, direction) => {
      const inventory = {
        create: jest.fn(async (record) => record),
        findAll: jest.fn(async () => []),
      };
      const material = {
        findByPk: jest.fn(async () => ({
          is_active: true,
          unit_id: 'unit',
          unit: { code: 'PCS' },
        })),
      };
      const service = new InventoryService(
        inventory as any,
        material as any,
        {} as any,
      );
      jest
        .spyOn(service, 'findOne')
        .mockImplementation(async () => inventory.create.mock.results[0].value);
      const record = await service.create({
        project_id: 'project',
        material_id: 'material',
        transaction_date: '2026-10-26',
        transaction_type: type,
        quantity: 0,
      });
      expect(inventory.create).toHaveBeenCalledTimes(1);
      expect(record).toMatchObject({ quantity: 0, direction, unit_id: 'unit' });
    },
  );
});
