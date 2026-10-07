import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ShortlistEntryService } from './shortlist-entry.service';
import { BulkCreateShortlistEntriesDto } from './dto/bulk-create-shortlist-entries.dto';
import { SaveShortlistWorkspaceRowDto } from './dto/save-shortlist-workspace-row.dto';
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
  it('workspace DTO requires both coordinates even though ordinary update fields are optional', async () => {
    const errors = await validate(plainToInstance(SaveShortlistWorkspaceRowDto, { vendor_id: null }));
    expect(errors.map(error => error.property)).toEqual(expect.arrayContaining(['trade', 'working_type']));
  });
  it('workspace saves reuse the same row for repeated changes', async () => {
    const { service, row, entries, parents } = setup();
    row.reload = jest.fn().mockResolvedValue(row);
    const coordinates = { trade: Trade.ELECTRICIAN, working_type: WorkingType.CONTRACTOR };
    await service.saveWorkspaceRow('shortlist', { ...coordinates, vendor_id: 'vendor' });
    await service.saveWorkspaceRow('shortlist', { ...coordinates, estimate_value: 125 });
    expect(entries.create).not.toHaveBeenCalled();
    expect(row.vendor_id).toBe('vendor');
    expect(row.estimate_value).toBe(125);
    expect(parents.findByPk).toHaveBeenCalledWith('shortlist', { transaction, lock: 'UPDATE' });
  });
  it('legacy create calls reuse the central workspace row rather than creating duplicates', async () => {
    const { service, row, entries } = setup();
    row.reload = jest.fn().mockResolvedValue(row);
    const saved = await service.create({ project_shortlist_id: 'shortlist',
      trade: Trade.ELECTRICIAN, working_type: WorkingType.CONTRACTOR, vendor_id: 'vendor' });
    expect(saved.id).toBe(row.id);
    expect(entries.create).not.toHaveBeenCalled();
    expect(row.vendor_id).toBe('vendor');
  });
  it('workspace selection clears siblings inside the same transaction', async () => {
    const { service, row, entries } = setup();
    row.reload = jest.fn().mockResolvedValue(row);
    await service.saveWorkspaceRow('shortlist', {
      trade: Trade.ELECTRICIAN, working_type: WorkingType.CONTRACTOR, is_selected: true,
    });
    expect(row.is_selected).toBe(true);
    expect(row.status).toBe(ShortlistEntryStatus.SELECTED);
    expect(entries.update).toHaveBeenCalledWith(
      { is_selected: false, status: ShortlistEntryStatus.SHORTLISTED },
      expect.objectContaining({ transaction }),
    );
  });
  it('workspace recovery refuses to overwrite an occupied row', async () => {
    const { service, row, entries } = setup();
    row.vendor_id = 'existing-vendor';
    (entries as any).findByPk = jest.fn().mockResolvedValue({ id: 'orphan', project_shortlist_id: 'shortlist' });
    await expect(service.saveWorkspaceRow('shortlist', {
      entry_id: 'orphan', trade: Trade.ELECTRICIAN, working_type: WorkingType.CONTRACTOR,
    })).rejects.toThrow('already has saved data');
    expect(row.update).not.toHaveBeenCalled();
  });
  it('recovery replaces only an empty skeleton and preserves the orphan assignment and amounts', async () => {
    const { service, row, entries } = setup();
    row.destroy = jest.fn();
    const orphan: any = { ...row, id: 'orphan', trade: '', working_type: '',
      vendor_id: 'saved-vendor', estimate_value: 500,
      update: jest.fn(async function(this: any, patch: any) { Object.assign(this, patch); return this; }) };
    orphan.reload = jest.fn().mockResolvedValue(orphan);
    (entries as any).findByPk = jest.fn().mockResolvedValue(orphan);
    await service.saveWorkspaceRow('shortlist', { entry_id: 'orphan',
      trade: Trade.ELECTRICIAN, working_type: WorkingType.CONTRACTOR });
    expect(row.destroy).toHaveBeenCalledWith({ transaction });
    expect(orphan.vendor_id).toBe('saved-vendor');
    expect(orphan.estimate_value).toBe(500);
    expect(entries.create).not.toHaveBeenCalled();
  });
  it('workspace saves create a fully populated row in one transaction', async () => {
    const { service, row, entries } = setup();
    entries.findOne.mockResolvedValue(null);
    row.reload = jest.fn().mockResolvedValue(row);
    entries.create.mockImplementation(async values => { Object.assign(row, values); return row; });
    await service.saveWorkspaceRow('shortlist', {
      trade: Trade.PLUMBER, working_type: WorkingType.INDIVIDUAL, vendor_id: 'vendor', estimate_value: 0,
    });
    expect(entries.create).toHaveBeenCalledWith(expect.objectContaining({
      project_shortlist_id: 'shortlist', trade: Trade.PLUMBER, working_type: WorkingType.INDIVIDUAL,
      vendor_id: 'vendor', estimate_value: 0,
    }), { transaction });
  });
  it('rejects silent ENUM coercion instead of reporting a successful invisible save', async () => {
    const { service, row } = setup();
    row.reload = jest.fn(async () => { row.trade = ''; return row; });
    await expect(service.saveWorkspaceRow('shortlist', {
      trade: Trade.ELECTRICIAN, working_type: WorkingType.CONTRACTOR, vendor_id: 'vendor',
    })).rejects.toThrow('database schema is outdated');
  });
  it('repairs an explicitly identified unplaced entry without creating another record', async () => {
    const { service, row, entries } = setup();
    row.trade = ''; row.working_type = '';
    row.reload = jest.fn().mockResolvedValue(row);
    entries.findOne.mockResolvedValue(null);
    (entries as any).findByPk = jest.fn().mockResolvedValue(row);
    await service.saveWorkspaceRow('shortlist', {
      entry_id: row.id, trade: Trade.PLUMBER, working_type: WorkingType.CONTRACTOR,
    });
    expect(row.trade).toBe(Trade.PLUMBER);
    expect(row.working_type).toBe(WorkingType.CONTRACTOR);
    expect(entries.create).not.toHaveBeenCalled();
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
