import { ProjectShortlistService } from './project-shortlist.service';
import { Trade, WorkingType } from '@/common/enums/shortlist.enums';

describe('shortlist grid assignment display', () => {
  const skeleton = { id: 'empty', trade: Trade.ELECTRICIAN, working_type: WorkingType.CONTRACTOR,
    vendor_id: null, name_of_vendor: null, updated_at: new Date('2026-10-03') };
  async function grid(entries: any[]) {
    const service = new ProjectShortlistService({} as any, {} as any);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'shortlist', entries } as any);
    const result = await service.getGridView('shortlist');
    return result.grid.find(block => block.trade === Trade.ELECTRICIAN)!.rows[0];
  }
  it('displays a saved assignment even when an empty duplicate precedes it', async () => {
    const row = await grid([skeleton, { ...skeleton, id: 'assigned', vendor_id: 'vendor',
      name_of_vendor: 'Electrical Co', updated_at: new Date('2026-10-01') }]);
    expect(row.entry_id).toBe('assigned');
    expect(row.name_of_vendor).toBe('Electrical Co');
  });
  it('prefers the most recently updated assignment among duplicates', async () => {
    const row = await grid([{ ...skeleton, id: 'old', vendor_id: 'old-vendor', name_of_vendor: 'Old',
      updated_at: new Date('2026-10-01') }, { ...skeleton, id: 'new', vendor_id: 'new-vendor', name_of_vendor: 'New' }]);
    expect(row.name_of_vendor).toBe('New');
  });
  it('falls back to the linked vendor name when the display name is blank', async () => {
    const row = await grid([{ ...skeleton, vendor_id: 'vendor', name_of_vendor: '  ', vendor: { name: 'Electrical Co' } }]);
    expect(row.name_of_vendor).toBe('Electrical Co');
  });
  it('returns blank-coordinate saved records for explicit recovery instead of silently hiding them', async () => {
    const service = new ProjectShortlistService({} as any, {} as any);
    const unplaced = { ...skeleton, id: 'orphan', trade: '', working_type: '',
      name_of_vendor: 'Saved vendor', vendor_id: 'vendor', estimate_value: 500 };
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'shortlist', entries: [unplaced] } as any);
    const result = await service.getGridView('shortlist');
    expect(result.unplaced_entries).toEqual([unplaced]);
    expect(result.grid.every(block => block.rows.every(row => row.entry_id === null))).toBe(true);
  });
});
