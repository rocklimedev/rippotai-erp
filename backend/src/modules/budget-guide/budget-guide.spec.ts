import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { calculateGuide } from './budget-guide-calculation';
import { budgetGuideTemplate } from './budget-guide-template';
import {
  CreateBudgetGuideDto,
  ListBudgetGuidesDto,
  UpdateBudgetGuideDto,
} from './dto/budget-guide.dto';
import { BudgetGuideService } from './budget-guide.service';

const actor = { id: 'actor', permissions: ['projects:read'] };
const tx: any = { LOCK: { UPDATE: 'UPDATE' } };
function store(data: any) {
  const row: any = {
    ...JSON.parse(JSON.stringify(data)),
    id: 'guide',
    revision: 1,
    toJSON() {
      return Object.fromEntries(
        Object.entries(this).filter(([, value]) => typeof value !== 'function'),
      );
    },
    update: jest.fn(async function (this: any, patch: any) {
      Object.assign(this, patch);
      return this;
    }),
    destroy: jest.fn(),
  };
  const models: any = {
    create: jest.fn(async (input: any) => store(input).row),
    findByPk: jest.fn(async () => row),
    findAndCountAll: jest.fn(async () => ({ rows: [], count: 0 })),
  };
  const projects: any = { findByPk: jest.fn(async () => ({ id: 'project' })) };
  const sequelize: any = { transaction: jest.fn(async (fn: any) => fn(tx)) };
  return {
    row,
    models,
    projects,
    sequelize,
    service: new BudgetGuideService(models, projects, sequelize),
  };
}

it('creates three editable standalone plans and independent reference templates', () => {
  const blank = budgetGuideTemplate();
  expect(blank.project_id).toBeNull();
  expect(blank.plans).toHaveLength(3);
  expect(blank.plans.map((p) => p.materials.length)).toEqual([0, 0, 0]);
  const first = budgetGuideTemplate(true),
    second = budgetGuideTemplate(true);
  expect(
    validateSync(plainToInstance(CreateBudgetGuideDto, first)),
  ).toHaveLength(0);
  expect(first.plans.map((p) => p.materials.length)).toEqual([11, 17, 16]);
  expect(
    first.plans.map((p) =>
      p.cost_heads.reduce((sum, h) => sum + h.share_percent, 0),
    ),
  ).toEqual([100, 100, 100]);
  first.plans[0].materials[0].rate_low = 1;
  expect(second.plans[0].materials[0].rate_low).toBe(380);
});
it('computes cost shares and project budgets without adding material schedule rates', () => {
  const guide = budgetGuideTemplate(true);
  guide.built_up_area = 1000;
  const result = calculateGuide(guide),
    essential = result.plans[0];
  expect(essential.total_low).toBe(2300000);
  expect(essential.total_high).toBe(3500000);
  expect(essential.cost_heads[1].rate_low).toBe(805);
  expect(essential.cost_heads[1].amount_low).toBe(805000);
  expect(result.warnings).toEqual([]);
  expect(
    calculateGuide({ ...guide, built_up_area: null }).plans[0].total_low,
  ).toBeNull();
});
it('uses item quantities for itemized costing and keeps per-plan items isolated', () => {
  const guide = budgetGuideTemplate(true);
  guide.plans[0].costing_mode = 'itemized';
  guide.plans[0].cost_heads[0].items = [
    {
      name: 'Concrete',
      unit: 'm3',
      quantity: 2.5,
      rate_low: 100.1,
      rate_high: 120.25,
    },
  ];
  const result = calculateGuide(guide);
  expect(result.plans[0].total_low).toBe(250.25);
  expect(result.plans[0].total_high).toBe(300.63);
  expect(result.plans[1].items_total_low).toBe(0);
  expect(result.plans[0].cost_heads[0].items[0].amount_high).toBe(300.63);
});
it('clamps guide validity at month-end and keeps rate validity independent', () => {
  const guide = budgetGuideTemplate(true);
  guide.issue_date = '2026-08-31';
  const result = calculateGuide(guide);
  expect(result.valid_until).toBe('2027-02-28');
  expect(result.rates_valid_until).toBe('2026-09-30');
});
it('allows incomplete drafts but rejects invalid ranges, duplicate plans and incomplete publication', () => {
  const blank = budgetGuideTemplate();
  expect(calculateGuide(blank).warnings).toHaveLength(3);
  expect(() => calculateGuide({ ...blank, status: 'published' })).toThrow(
    'complete',
  );
  blank.plans[1].key = 'essential';
  expect(() => calculateGuide(blank)).toThrow('distinct');
  const ref = budgetGuideTemplate(true);
  ref.plans[0].materials[0].rate_high = 1;
  expect(() => calculateGuide(ref)).toThrow('upper rate');
  const publish = budgetGuideTemplate(true);
  publish.plans[0].cost_heads[0].share_percent = 1;
  expect(() => calculateGuide({ ...publish, status: 'published' })).toThrow(
    '100%',
  );
});
it('validates nested numeric fields and partial updates without accepting client totals', () => {
  const ref: any = budgetGuideTemplate(true);
  ref.plans[0].materials[0].rate_low = -1;
  expect(
    validateSync(plainToInstance(CreateBudgetGuideDto, ref)).length,
  ).toBeGreaterThan(0);
  const good: any = budgetGuideTemplate(true);
  good.plans[0].total_low = 999;
  const dto = plainToInstance(CreateBudgetGuideDto, good);
  expect(validateSync(dto, { whitelist: true })).toEqual([]);
  expect((dto.plans[0] as any).total_low).toBeUndefined();
  expect(
    validateSync(
      plainToInstance(UpdateBudgetGuideDto, {
        title: 'Rename',
        expected_revision: 1,
      }),
    ),
  ).toEqual([]);
  expect(
    validateSync(
      plainToInstance(UpdateBudgetGuideDto, { expected_revision: 0 }),
    ).length,
  ).toBeGreaterThan(0);
  expect(
    validateSync(
      plainToInstance(CreateBudgetGuideDto, {
        ...good,
        issue_date: '2026-02-31',
      }),
    ).length,
  ).toBeGreaterThan(0);
});
it('parses false query flags correctly and bounds pagination', () => {
  expect(
    plainToInstance(ListBudgetGuidesDto, { generic: 'false' }).generic,
  ).toBe(false);
  expect(
    plainToInstance(ListBudgetGuidesDto, { generic: 'true' }).generic,
  ).toBe(true);
  expect(
    validateSync(
      plainToInstance(ListBudgetGuidesDto, {
        generic: 'invalid',
        page: 0,
        limit: 101,
      }),
    ),
  ).toHaveLength(3);
});
it('persists generic guides without requiring a project and stamps the authenticated actor', async () => {
  const s = store(budgetGuideTemplate());
  const created = await s.service.create(budgetGuideTemplate(), {
    id: 'actor',
  });
  expect(s.projects.findByPk).not.toHaveBeenCalled();
  expect(s.models.create).toHaveBeenCalledWith(
    expect.objectContaining({
      project_id: null,
      revision: 1,
      created_by: 'actor',
      updated_by: 'actor',
    }),
  );
  expect(created.calculation.plans).toHaveLength(3);
});
it('requires project read access and rejects missing projects for linking', async () => {
  const s = store(budgetGuideTemplate());
  await expect(
    s.service.create(
      {
        ...budgetGuideTemplate(),
        project_id: '11111111-1111-4111-8111-111111111111',
      },
      { id: 'actor' },
    ),
  ).rejects.toThrow('projects:read');
  expect(s.models.create).not.toHaveBeenCalled();
  s.projects.findByPk.mockResolvedValue(null);
  await expect(
    s.service.create(
      {
        ...budgetGuideTemplate(),
        project_id: '11111111-1111-4111-8111-111111111111',
      },
      actor,
    ),
  ).rejects.toThrow('Project not found');
});
it('locks and checks revisions before updates and deletion, preserving decimal areas from MySQL', async () => {
  const s = store({ ...budgetGuideTemplate(true), built_up_area: '123.5000' });
  const result = await s.service.update(
    'guide',
    { title: 'Updated', expected_revision: 1 },
    actor,
  );
  expect(result.title).toBe('Updated');
  expect(result.revision).toBe(2);
  expect(result.built_up_area).toBe(123.5);
  expect(s.models.findByPk).toHaveBeenCalledWith('guide', {
    transaction: tx,
    lock: 'UPDATE',
  });
  await expect(
    s.service.update('guide', { title: 'Stale', expected_revision: 1 }, actor),
  ).rejects.toThrow('Reload');
  await expect(s.service.remove('guide', 1)).rejects.toThrow('Reload');
  expect(s.row.destroy).not.toHaveBeenCalled();
  await s.service.remove('guide', 2);
  expect(s.row.destroy).toHaveBeenCalledWith({ transaction: tx });
});
it('rejects null plan patches after merging with saved data', async () => {
  const s = store(budgetGuideTemplate());
  await expect(
    s.service.update(
      'guide',
      { plans: null, expected_revision: 1 } as any,
      actor,
    ),
  ).rejects.toThrow('Invalid');
  expect(s.row.update).not.toHaveBeenCalled();
});
it('copies all plans into a project draft without changing the source or retaining its identity', async () => {
  const source = { ...budgetGuideTemplate(true), status: 'published' };
  const s = store(source);
  const projectId = '11111111-1111-4111-8111-111111111111';
  const copy = await s.service.transfer(
    'guide',
    { project_id: projectId, expected_revision: 1, title: 'Project guide' },
    actor,
  );
  expect(s.models.create).toHaveBeenCalledWith(
    expect.objectContaining({
      project_id: projectId,
      source_guide_id: 'guide',
      revision: 1,
      status: 'draft',
      title: 'Project guide',
    }),
    { transaction: tx },
  );
  expect(s.models.create.mock.calls[0][0].id).toBeUndefined();
  expect(s.row.update).not.toHaveBeenCalled();
  expect(s.row.project_id).toBeNull();
  expect(s.row.status).toBe('published');
  expect(copy.plans).toEqual(source.plans);
});
it('filters standalone guides, escapes literal search wildcards and paginates', async () => {
  const s = store(budgetGuideTemplate());
  await s.service.list(
    plainToInstance(ListBudgetGuidesDto, {
      generic: 'true',
      search: '50%',
      page: 2,
    }),
  );
  const options = s.models.findAndCountAll.mock.calls[0][0];
  expect(options.where.project_id).toBeNull();
  expect(options.offset).toBe(30);
  expect(options.limit).toBe(30);
  await expect(
    s.service.list(
      plainToInstance(ListBudgetGuidesDto, {
        generic: 'true',
        project_id: 'project',
      }),
    ),
  ).rejects.toThrow('either');
});
