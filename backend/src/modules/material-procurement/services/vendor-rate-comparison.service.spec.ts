import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { VendorRateComparisonService } from './vendor-rate-comparison.service';

describe('Saved vendor rate comparison sheets', () => {
  let sheets: any;
  let projects: any;
  let boqs: any;
  let service: VendorRateComparisonService;
  const snapshot = () => ({
    schema_version: 1,
    boq: { id: 'boq-1', project_id: 'project-1', categories: [] },
    vendors: [{ id: 'vendor-1', name: 'Vendor A' }],
    selected_vendor_ids: ['vendor-1'],
    vendor_rates: { 'item-1__vendor-1': '125.50' },
    vendor_names: { 'vendor-1': 'Vendor A' },
    rows: [],
    summary: { l1Total: 251 },
  });
  const body = () => ({
    title: '  Finishes comparison  ',
    project_id: 'project-1',
    boq_id: 'boq-1',
    notes: 'First round',
    snapshot: snapshot(),
  });

  beforeEach(() => {
    sheets = {
      create: jest.fn(async (data) => ({ id: 'sheet-1', ...data })),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(async () => [1]),
    };
    projects = { findByPk: jest.fn(async () => ({ id: 'project-1' })) };
    boqs = {
      findByPk: jest.fn(async () => ({ id: 'boq-1', project_id: 'project-1' })),
    };
    service = new VendorRateComparisonService(sheets, projects, boqs);
  });

  it('persists a named project/BOQ snapshot and restores it by ID', async () => {
    const saved = await service.create(body(), 'user-1');
    expect(saved.title).toBe('Finishes comparison');
    expect(saved.revision).toBe(1);
    expect(saved.created_by).toBe('user-1');
    sheets.findByPk.mockResolvedValue(saved);
    expect((await service.get(saved.id)).snapshot.vendor_rates).toEqual({
      'item-1__vendor-1': '125.50',
    });
    expect((await service.get(saved.id)).snapshot.summary.l1Total).toBe(251);
  });

  it('rejects a BOQ from another project', async () => {
    boqs.findByPk.mockResolvedValue({ project_id: 'project-2' });
    await expect(service.create(body(), 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(sheets.create).not.toHaveBeenCalled();
  });

  it('rejects a missing project', async () => {
    projects.findByPk.mockResolvedValue(null);
    await expect(service.create(body(), 'user-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects mismatched snapshot identity and invalid rates', async () => {
    const input = body();
    input.snapshot.boq.id = 'another-boq';
    await expect(service.create(input, 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    const negative = body();
    negative.snapshot.vendor_rates['item-1__vendor-1'] = '-1';
    await expect(service.create(negative, 'user-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('updates the same sheet using an atomic revision check', async () => {
    sheets.findByPk.mockResolvedValue({
      id: 'sheet-1',
      project_id: 'project-1',
      boq_id: 'boq-1',
      snapshot: snapshot(),
      revision: 3,
    });
    const input = { ...body(), revision: 3 };
    input.snapshot.vendor_rates['item-1__vendor-1'] = '130';
    await service.update('sheet-1', input);
    expect(sheets.update).toHaveBeenCalledWith(
      expect.objectContaining({ revision: 4, snapshot: input.snapshot }),
      { where: { id: 'sheet-1', revision: 3 } },
    );
    expect(sheets.create).not.toHaveBeenCalled();
  });

  it('blocks stale revisions and writes racing with another save', async () => {
    sheets.findByPk.mockResolvedValue({
      project_id: 'project-1',
      boq_id: 'boq-1',
      snapshot: snapshot(),
      revision: 3,
    });
    await expect(
      service.update('sheet-1', { ...body(), revision: 2 }),
    ).rejects.toThrow(ConflictException);
    expect(sheets.update).not.toHaveBeenCalled();
    sheets.update.mockResolvedValue([0]);
    await expect(
      service.update('sheet-1', { ...body(), revision: 3 }),
    ).rejects.toThrow(ConflictException);
  });

  it('keeps saved project and BOQ links stable', async () => {
    sheets.findByPk.mockResolvedValue({
      project_id: 'project-2',
      boq_id: 'boq-1',
      snapshot: snapshot(),
      revision: 1,
    });
    await expect(
      service.update('sheet-1', { ...body(), revision: 1 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('preserves the frozen BOQ baseline when vendor rates are edited', async () => {
    sheets.findByPk.mockResolvedValue({
      project_id: 'project-1',
      boq_id: 'boq-1',
      snapshot: snapshot(),
      revision: 1,
    });
    const input = { ...body(), revision: 1 };
    input.snapshot.boq.categories = [{ id: 'new-category', items: [] }] as any;
    await expect(service.update('sheet-1', input)).rejects.toThrow(
      BadRequestException,
    );
    expect(sheets.update).not.toHaveBeenCalled();
  });

  it('lists project sheets without loading their potentially large snapshots', async () => {
    await service.list('project-1');
    expect(sheets.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { project_id: 'project-1' },
        attributes: { exclude: ['snapshot'] },
      }),
    );
  });

  it('reports a missing sheet', async () => {
    sheets.findByPk.mockResolvedValue(null);
    await expect(service.get('missing')).rejects.toThrow(NotFoundException);
  });
});
