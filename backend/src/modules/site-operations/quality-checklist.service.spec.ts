import fs from 'node:fs';
import path from 'node:path';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QualityChecklistService } from './quality-checklist.service';
import { QualityChecklistController } from './quality-checklist.controller';
import {
  FilterQualityChecklistDto,
  CreateQualityChecklistFromTemplateDto,
} from './dto/quality-checklist.dto';
import { Project } from '../projects/models/projects.model';
import { WorkHead } from '@/common/enums/quality-checklist.enums';
import { ItemStatus } from './models/quality-checklist-item.model';

const source = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'constants/quality-checklist-template.source.json'),
    'utf8',
  ),
);
describe('quality checklist template and workflow', () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  function setup() {
    const parent: any = {
      id: 'checklist',
      project_id: 'project',
      checklist_name: 'Plumbing',
      checklist_items: [],
      update: jest.fn(),
    };
    const checklists = {
      create: jest.fn().mockResolvedValue(parent),
      findByPk: jest.fn().mockResolvedValue(parent),
      findAndCountAll: jest.fn().mockResolvedValue({ count: 2, rows: [] }),
      update: jest.fn(),
    };
    const items = {
      bulkCreate: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByPk: jest.fn(),
    };
    const templates = {
      findByPk: jest.fn(async (key: string) =>
        source.find((template: any) => template.work_head === key),
      ),
      findAll: jest.fn().mockResolvedValue(source),
    };
    const database = {
      transaction: jest.fn((callback: any) => callback(transaction)),
    };
    const service = new QualityChecklistService(
      checklists as any,
      items as any,
      templates as any,
      database as any,
      {} as any,
    );
    return { service, parent, checklists, items, templates, database };
  }
  afterEach(() => jest.restoreAllMocks());
  it('contains all 17 source work heads and 165 detailed checkpoints, preserving duplicates', () => {
    expect(source).toHaveLength(17);
    expect(
      source.reduce(
        (count: number, template: any) => count + template.checkpoints.length,
        0,
      ),
    ).toBe(165);
    const electrical = source.find(
      (template: any) => template.work_head === 'ELECTRICAL_LIGHTING',
    );
    expect(electrical.checkpoints).toHaveLength(13);
    expect(electrical.checkpoints[11].checkpoint_name).toBe(
      electrical.checkpoints[12].checkpoint_name,
    );
    expect(
      source.find((template: any) => template.work_head === 'DOORS').label,
    ).toBe('Doors & Fixed furniture');
  });
  it('returns heads without detailed source sheets instead of inventing checks', async () => {
    const { service } = setup();
    const templates = await service.listWorkHeadTemplates();
    expect(templates.filter((template) => !template.has_template)).toHaveLength(
      5,
    );
    await expect(
      service.createFromWorkHead('project', WorkHead.EXCAVATION, 'user'),
    ).rejects.toThrow('No detailed checklist');
  });
  it('creates source-exact checkpoint snapshots with durable work-head identity in a transaction', async () => {
    jest.spyOn(Project, 'findByPk').mockResolvedValue({ id: 'project' } as any);
    const { service, items, checklists } = setup();
    await service.createFromWorkHead(
      'project',
      WorkHead.ELECTRICAL_LIGHTING,
      'user',
    );
    expect(checklists.create).toHaveBeenCalledWith(
      expect.objectContaining({
        work_head: 'ELECTRICAL_LIGHTING',
        template_version: '20261003',
      }),
      { transaction },
    );
    expect(items.bulkCreate.mock.calls[0][0]).toHaveLength(13);
    expect(items.bulkCreate.mock.calls[0][0][0].checkpoint_name).toBe(
      'Check fixture positions and heights against approved drawings.',
    );
    expect(items.bulkCreate.mock.calls[0][1]).toEqual({ transaction });
  });
  it.each([
    { rows: [] },
    { rows: [{ is_accepted: null }] },
    { rows: [{ is_accepted: false }] },
  ])('refuses to pass empty or unaccepted lists (%j)', async ({ rows }) => {
    const { service, items, parent } = setup();
    items.findAll.mockResolvedValue(rows as any);
    await expect(service.completeChecklist('checklist')).rejects.toThrow(
      'pending items',
    );
    expect(parent.update).not.toHaveBeenCalled();
  });
  it('passes only when every checkpoint is accepted', async () => {
    const { service, items, parent } = setup();
    items.findAll.mockResolvedValue([{ is_accepted: true }] as any);
    await service.completeChecklist('checklist');
    expect(parent.update).toHaveBeenCalledWith({
      status: 'PASSED',
      completion_percentage: 100,
    });
  });
  it('separates inspection completion from acceptance and rejection', async () => {
    const { service, items } = setup();
    items.findAll.mockResolvedValue([
      { status: ItemStatus.ACCEPTED, is_accepted: true },
      { status: ItemStatus.REJECTED, is_accepted: false },
      { status: ItemStatus.NOT_STARTED, is_accepted: null },
    ] as any);
    const result = await service.getChecklistSummary('checklist');
    expect(result).toMatchObject({
      total_items: 3,
      accepted_items: 1,
      rejected_items: 1,
      completion_percentage: 66.67,
      acceptance_percentage: 33.33,
    });
  });
  it('paginates parent checklists without joins multiplying the count or truncating items', async () => {
    const { service, checklists } = setup();
    await service.getChecklistsByProject('project', { page: 2, limit: 12 });
    expect(checklists.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 12,
        include: [
          expect.objectContaining({
            separate: true,
            order: [['serial_number', 'ASC']],
          }),
        ],
      }),
    );
  });
  it('accepts numeric URL query parameters and rejects invalid template identities', async () => {
    const query = plainToInstance(FilterQualityChecklistDto, {
      page: '2',
      limit: '12',
    });
    expect(await validate(query)).toEqual([]);
    expect(query.page).toBe(2);
    expect(
      (
        await validate(
          plainToInstance(CreateQualityChecklistFromTemplateDto, {
            project_id: 'bad',
            work_head: 'bad',
          }),
        )
      ).length,
    ).toBe(2);
  });
  it('registers bulk updates before the dynamic item route', () => {
    const routes = Object.getOwnPropertyNames(
      QualityChecklistController.prototype,
    );
    expect(routes.indexOf('bulkUpdateChecklistItems')).toBeLessThan(
      routes.indexOf('updateChecklistItem'),
    );
  });
  it('validates all bulk targets before writing any results', async () => {
    const { service, items } = setup();
    const update = jest.fn();
    items.findByPk
      .mockResolvedValueOnce({ id: 'first', checklist_id: 'checklist', update })
      .mockResolvedValueOnce(null);
    await expect(
      service.bulkUpdateChecklistItems(
        { items: [{ id: 'first', remarks: 'Changed' }, { id: 'missing' }] },
        'user',
      ),
    ).rejects.toThrow('not found');
    expect(update).not.toHaveBeenCalled();
  });

  it('exports saved checklist JSON with project name and the source sheet identity', async () => {
    jest
      .spyOn(Project, 'findByPk')
      .mockResolvedValue({ id: 'project', name: 'Residence' } as any);
    const { service, parent } = setup();
    Object.assign(parent, {
      work_head: 'PLUMBING',
      template_version: '20261003',
      template_title: 'INTERIOR WORKS- PLUMBING',
      template_sheet_name: 'Plumbing',
      checklist_items: [
        {
          serial_number: 1,
          checkpoint_name: 'Source check',
          phase: 'BEFORE_EXECUTION',
          status: 'REJECTED',
          is_accepted: false,
          remarks: 'Repair',
        },
      ],
    });
    const data = await service.exportChecklistData('checklist');
    expect(data.project).toEqual({ id: 'project', name: 'Residence' });
    expect(data.checklist).toMatchObject({
      work_head: 'PLUMBING',
      title: 'INTERIOR WORKS- PLUMBING',
      sheet_name: 'Plumbing',
    });
    expect(data.items[0]).toMatchObject({
      is_accepted: false,
      remarks: 'Repair',
    });
  });
});
