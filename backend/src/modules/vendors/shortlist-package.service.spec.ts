import { ShortlistPackageService } from './shortlist-package.service';
import { ShortlistPackage } from './models/shortlist-package.model';
import { ProjectShortlist } from './models/project-shortlist.model';
import { ShortlistEntry } from './models/shortlist-entry.model';
import { ProjectScopeCategory } from '../scope-of-work/models/project-scope-category.model';
import { MaterialRequirement } from '../material-procurement/models/material-requirement.model';
import { ProjectBriefProcurementCategory } from '../brief/models/project-brief-procurement-category.model';
import { Vendor } from './models/vendors.model';
import { MaterialMaster } from '../material-procurement/models/material-master.model';
import {
  ShortlistEntryStatus,
  ShortlistType,
  Trade,
  WorkingType,
} from '@/common/enums/shortlist.enums';
import { matchesProjectTrade } from './shortlist-package-matching';

describe('shortlist packages', () => {
  const assignment = {
    trade: Trade.ELECTRICIAN,
    working_type: WorkingType.CONTRACTOR,
    vendor_id: 'vendor',
    material_id: null,
    name_of_vendor: 'Electric Co',
    notes: null,
  };
  const target = {
    id: 'target',
    project_id: 'project',
    shortlist_type: ShortlistType.VENDOR,
    is_locked: false,
  };
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  let packages: any;
  let service: ShortlistPackageService;
  beforeEach(() => {
    packages = {
      findByPk: jest
        .fn()
        .mockResolvedValue({
          shortlist_type: ShortlistType.VENDOR,
          entries: [assignment],
        }),
      create: jest.fn(),
    };
    service = new ShortlistPackageService(packages, {
      transaction: (fn: any) => fn(transaction),
    } as any);
    jest
      .spyOn(ProjectShortlist, 'findByPk')
      .mockResolvedValue({ ...target } as any);
    jest
      .spyOn(ProjectScopeCategory, 'findAll')
      .mockResolvedValue([
        { scopeCategory: { name: 'Electrical', slug: 'electrical' } },
      ] as any);
    jest.spyOn(MaterialRequirement, 'findAll').mockResolvedValue([]);
    jest
      .spyOn(ProjectBriefProcurementCategory, 'findAll')
      .mockResolvedValue([]);
    jest.spyOn(ShortlistEntry, 'findAll').mockResolvedValue([]);
    jest.spyOn(ShortlistEntry, 'create').mockResolvedValue({} as any);
    jest.spyOn(Vendor, 'findByPk').mockResolvedValue({} as any);
    jest.spyOn(MaterialMaster, 'findByPk').mockResolvedValue({} as any);
  });
  afterEach(() => jest.restoreAllMocks());

  it('matches explicit category aliases and avoids substring collisions', () => {
    expect(matchesProjectTrade(Trade.AC, ['Facade'])).toBe(false);
    expect(matchesProjectTrade(Trade.AC, ['AC_PIPING_DRAINAGE'])).toBe(true);
    expect(matchesProjectTrade(Trade.CARPENTER, ['Carpentry'])).toBe(true);
  });
  it('previews matches without writing', async () => {
    const result = await service.preview('package', 'target');
    expect(result.applicable).toEqual([assignment]);
    expect(ShortlistEntry.create).not.toHaveBeenCalled();
  });
  it('skips services not marked in the project', async () => {
    (ProjectScopeCategory.findAll as jest.Mock).mockResolvedValue([]);
    expect((await service.apply('package', 'target')).applied).toBe(0);
    expect(ShortlistEntry.create).not.toHaveBeenCalled();
  });
  it('uses marked procurement categories from the brief', async () => {
    (ProjectScopeCategory.findAll as jest.Mock).mockResolvedValue([]);
    (ProjectBriefProcurementCategory.findAll as jest.Mock).mockResolvedValue([
      { category: 'ELECTRICAL' },
    ]);
    expect(
      (await service.preview('package', 'target')).applicable,
    ).toHaveLength(1);
  });
  it('requires an exact target material requirement', async () => {
    packages.findByPk.mockResolvedValue({
      shortlist_type: ShortlistType.MATERIAL,
      entries: [{ ...assignment, vendor_id: null, material_id: 'material' }],
    });
    (ProjectShortlist.findByPk as jest.Mock).mockResolvedValue({
      ...target,
      shortlist_type: ShortlistType.MATERIAL,
    });
    (MaterialRequirement.findAll as jest.Mock).mockResolvedValue([
      { materialId: 'other-material' },
    ]);
    expect(
      (await service.preview('package', 'target')).applicable,
    ).toHaveLength(0);
    (MaterialRequirement.findAll as jest.Mock).mockResolvedValue([
      { materialId: 'material' },
    ]);
    expect(
      (await service.preview('package', 'target')).applicable,
    ).toHaveLength(1);
  });
  it('preserves populated target rows', async () => {
    (ShortlistEntry.findAll as jest.Mock).mockResolvedValue([
      { ...assignment, vendor_id: 'other-vendor' },
    ]);
    const result = await service.apply('package', 'target');
    expect(result.applied).toBe(0);
    expect(result.skipped[0].reason).toContain('already contains');
  });
  it('fills skeleton rows and resets project decisions', async () => {
    const update = jest.fn();
    (ShortlistEntry.findAll as jest.Mock).mockResolvedValue([
      {
        trade: assignment.trade,
        working_type: assignment.working_type,
        status: ShortlistEntryStatus.DRAFT,
        update,
      },
    ]);
    expect((await service.apply('package', 'target')).applied).toBe(1);
    expect(update).toHaveBeenCalledWith(
      { ...assignment, status: 'SHORTLISTED', is_selected: false },
      { transaction },
    );
    expect(ShortlistEntry.create).not.toHaveBeenCalled();
  });
  it('rejects locked targets and incompatible package types', async () => {
    (ProjectShortlist.findByPk as jest.Mock).mockResolvedValue({
      ...target,
      is_locked: true,
    });
    await expect(service.apply('package', 'target')).rejects.toThrow('locked');
    (ProjectShortlist.findByPk as jest.Mock).mockResolvedValue({
      ...target,
      shortlist_type: ShortlistType.MATERIAL,
    });
    await expect(service.apply('package', 'target')).rejects.toThrow(
      'types must match',
    );
  });
  it('skips stale vendor references', async () => {
    (Vendor.findByPk as jest.Mock).mockResolvedValue(null);
    const result = await service.preview('package', 'target');
    expect(result.skipped[0].reason).toContain('no longer exists');
  });
  it('saves reusable assignments without copying prices or quotations', async () => {
    (ProjectShortlist.findByPk as jest.Mock).mockResolvedValue({
      ...target,
      entries: [
        {
          ...assignment,
          status: 'SELECTED',
          estimate_value: 500,
          quotation_id: 'quote',
          is_selected: true,
        },
        { ...assignment, status: 'REJECTED' },
      ],
    });
    await service.create({ name: 'Standard', source_shortlist_id: 'source' });
    expect(packages.create).toHaveBeenCalledWith({
      name: 'Standard',
      shortlist_type: 'VENDOR',
      entries: [assignment],
    });
  });
  it('rejects empty source shortlists and missing packages', async () => {
    (ProjectShortlist.findByPk as jest.Mock).mockResolvedValue({
      ...target,
      entries: [],
    });
    await expect(
      service.create({ name: 'Empty', source_shortlist_id: 'source' }),
    ).rejects.toThrow('Assign vendors');
    packages.findByPk.mockResolvedValue(null);
    await expect(service.preview('missing', 'target')).rejects.toThrow(
      'not found',
    );
  });
});
