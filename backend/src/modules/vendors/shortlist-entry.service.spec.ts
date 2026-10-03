import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ShortlistEntryService } from './shortlist-entry.service';
import { BulkCreateShortlistEntriesDto } from './dto/bulk-create-shortlist-entries.dto';
import { ShortlistEntryStatus, ShortlistType, Trade, WorkingType } from '@/common/enums/shortlist.enums';

describe('shortlist entry regression fixes', () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  function setup() {
    const row: any = { id: 'entry', project_shortlist_id: 'shortlist', trade: Trade.ELECTRICIAN,
      working_type: WorkingType.CONTRACTOR, status: ShortlistEntryStatus.DRAFT, is_selected: false,
      update: jest.fn(async function(this: any, patch: any) { Object.assign(this, patch); return this; }) };
    const entries = { findOne: jest.fn().mockResolvedValue(row), findAll: jest.fn().mockResolvedValue([row]),
      update: jest.fn(), create: jest.fn() };
    const parents = { findByPk: jest.fn().mockResolvedValue({ id: 'shortlist', shortlist_type: ShortlistType.VENDOR, is_locked: false }) };
    const service = new ShortlistEntryService({ transaction: (fn: any) => fn(transaction) } as any, entries as any, parents as any);
    jest.spyOn(service, 'findOne').mockResolvedValue(row);
    return { service, row, entries, parents };
  }
  it('bulk payloads only require the parent shortlist ID once', async () => {
    const dto = plainToInstance(BulkCreateShortlistEntriesDto, {
      project_shortlist_id: '109f8bc2-0e45-4e5c-b6cb-404a3dc673aa',
      entries: [{ trade: Trade.ELECTRICIAN, working_type: WorkingType.CONTRACTOR }],
    });
    expect(await validate(dto)).toEqual([]);
  });
  it('bulk saves populate existing skeletons instead of silently discarding assignments', async () => {
    const { service, row, entries } = setup();
    await service.bulkCreate({ project_shortlist_id: 'shortlist', entries: [{
      trade: Trade.ELECTRICIAN, working_type: WorkingType.CONTRACTOR, vendor_id: 'vendor',
    }] });
    expect(row.update).toHaveBeenCalledWith(expect.objectContaining({ vendor_id: 'vendor' }), { transaction });
    expect(entries.create).not.toHaveBeenCalled();
  });
  it('bulk writes recheck the locked parent inside the transaction', async () => {
    const { service, parents, row } = setup();
    parents.findByPk.mockResolvedValueOnce({ id: 'shortlist', shortlist_type: ShortlistType.VENDOR, is_locked: false })
      .mockResolvedValueOnce({ id: 'shortlist', is_locked: true });
    await expect(service.bulkCreate({ project_shortlist_id: 'shortlist', entries: [{
      trade: Trade.ELECTRICIAN, working_type: WorkingType.CONTRACTOR,
    }] })).rejects.toThrow('locked');
    expect(row.update).not.toHaveBeenCalled();
  });
  it('selected status updates also set the flag and unselect siblings', async () => {
    const { service, row, entries } = setup();
    await service.update('entry', { status: ShortlistEntryStatus.SELECTED });
    expect(row.is_selected).toBe(true);
    expect(entries.update).toHaveBeenCalledWith(expect.objectContaining({ is_selected: false }), expect.anything());
  });
  it('moving away from selected status clears the selected flag', async () => {
    const { service, row } = setup();
    Object.assign(row, { is_selected: true, status: ShortlistEntryStatus.SELECTED });
    await service.update('entry', { status: ShortlistEntryStatus.REJECTED });
    expect(row.is_selected).toBe(false);
    expect(row.status).toBe(ShortlistEntryStatus.REJECTED);
  });
  it('rejects conflicting selection and status', async () => {
    const { service, row } = setup();
    await expect(service.update('entry', { is_selected: false, status: ShortlistEntryStatus.SELECTED })).rejects.toThrow('conflict');
    expect(row.update).not.toHaveBeenCalled();
  });
});
