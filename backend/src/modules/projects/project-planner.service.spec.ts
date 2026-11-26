import ExcelJS from 'exceljs';
import { ProjectPlannerService } from './project-planner.service';
import { WORKBOOK_TEMPLATE } from './planner-workbook-template';
import {
  PlannerItemStatus,
  ProjectPlannerType,
} from '@/common/enums/project-planner.enum';

describe('unified project planner', () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const record = (values: any) => ({
    ...values,
    update: jest.fn(async function (this: any, patch: any) {
      Object.assign(this, patch);
      return this;
    }),
    destroy: jest.fn(),
    restore: jest.fn(),
  });
  function service(models: any = {}) {
    return Object.assign(Object.create(ProjectPlannerService.prototype), {
      sequelize: { transaction: (callback: any) => callback(transaction) },
      projectModel: {
        findByPk: jest
          .fn()
          .mockResolvedValue({ id: 'project', name: 'Residence' }),
      },
      ...models,
    }) as ProjectPlannerService;
  }

  it('consolidates legacy tasks and procurement into one planner, retaining record IDs', async () => {
    const consultancy = record({ id: 'design', type: 'CONSULTANCY' });
    const pmc = record({ id: 'site', type: 'PMC' });
    const vendor = record({ id: 'vendor', type: 'VENDOR_PROCUREMENT' });
    const plannerItemModel = { update: jest.fn() };
    const procurementItemModel = { update: jest.fn() };
    const instance = service({
      plannerModel: {
        findAll: jest.fn().mockResolvedValue([consultancy, pmc, vendor]),
      },
      plannerItemModel,
      procurementItemModel,
    });
    const result = await instance.initializeProjectPlanners('project');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('design');
    expect(result[0].type).toBe(ProjectPlannerType.PROJECT);
    expect(plannerItemModel.update).toHaveBeenCalledWith(
      { planner_id: 'design' },
      expect.objectContaining({
        where: { planner_id: 'site' },
        paranoid: false,
      }),
    );
    expect(procurementItemModel.update).toHaveBeenCalledWith(
      { planner_id: 'design' },
      expect.objectContaining({ where: { planner_id: 'vendor' } }),
    );
    expect(pmc.destroy).toHaveBeenCalled();
    expect(vendor.destroy).toHaveBeenCalled();
  });
  it('inherits brief dates and recce rooms when initializing an empty location list', async () => {
    const planner = record({ id: 'planner', type: 'PROJECT' });
    const locationModel = {
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'floor' }),
    };
    const instance = service({
      plannerModel: { findAll: jest.fn().mockResolvedValue([planner]) },
      locationModel,
      sharedProjectData: {
        prefill: jest.fn().mockResolvedValue({
          documents: {
            'client-brief': {
              desiredStartDate: '2026-10-10',
              targetCompletionDate: '2026-12-10',
            },
            'site-recce': {
              unit_floor_no: '1',
              rooms: [{ room_name: 'Kitchen' }, { room_name: 'kitchen' }],
            },
          },
        }),
      },
    });
    await instance.initializeProjectPlanners('project');
    expect(planner.planned_start_date).toBe('2026-10-10');
    expect(planner.planned_end_date).toBe('2026-12-10');
    expect(locationModel.create).toHaveBeenCalledTimes(2);
    expect(locationModel.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: 'Kitchen',
        type: 'ROOM',
        parent_id: 'floor',
      }),
      { transaction },
    );
  });

  it('syncs an edited template row without duplicating it or resetting progress', async () => {
    const planner = record({
      id: 'planner',
      project_id: 'project',
      type: 'PROJECT',
    });
    const edited = {
      id: 'task',
      phase_id: 'phase',
      task_template_id: 'template',
      work_name: 'Edited layout',
      progress_pct: 100,
    };
    const instance = service({
      plannerModel: { findByPk: jest.fn().mockResolvedValue(planner) },
      plannerTaskTemplateModel: {
        findAll: jest.fn().mockResolvedValue([
          {
            id: 'template',
            phase_id: 'phase',
            work_name: 'Original layout',
            applies_to_locations: true,
          },
        ]),
      },
      plannerItemModel: {
        findAll: jest.fn().mockResolvedValue([edited]),
        create: jest.fn(),
      },
      locationModel: {
        findAll: jest.fn().mockResolvedValue([{ id: 'new-room' }]),
      },
      itemLocationModel: { bulkCreate: jest.fn(), findOrCreate: jest.fn() },
      procurementItemModel: {
        findOne: jest.fn().mockResolvedValue(record({})),
        create: jest.fn(),
      },
    });
    (instance as any).ensureWorkbookTemplates = jest.fn();
    instance.getPlannerById = jest.fn().mockResolvedValue(planner);
    const result = await instance.generatePlannerFromTemplate('planner');
    expect(result.created_items).toBe(0);
    expect((instance as any).plannerItemModel.create).not.toHaveBeenCalled();
    expect(edited.progress_pct).toBe(100);
    expect(
      (instance as any).procurementItemModel.create,
    ).not.toHaveBeenCalled();
  });

  it('exports all four sheets with floor/room headers, all default rows and typed dates', async () => {
    const items = WORKBOOK_TEMPLATE.tasks.map((row, i) => ({
      ...row,
      id: `task-${i}`,
      phase_id: `${row.module}:${row.phase}`,
      phase: { title: row.phase, module: row.module, sort_order: 0 },
      locations: [
        { location_id: 'room', status: PlannerItemStatus.COMPLETED },
        { location_id: 'floor', status: PlannerItemStatus.IN_PROGRESS },
      ],
    }));
    const procurement = WORKBOOK_TEMPLATE.procurement.map((row, i) => ({
      ...row,
      id: `vendor-${i}`,
      purchase_date: i === 0 ? '2026-09-03' : null,
    }));
    const instance = service();
    instance.getProjectPlannerOverview = jest.fn().mockResolvedValue({
      project: { name: 'Residence' },
      planners: [{ items, procurement_items: procurement }],
      locations: [
        {
          id: 'floor',
          name: 'Stilt',
          type: 'FLOOR',
          children: [{ id: 'room', name: 'Kitchen' }],
        },
      ],
    });
    const { buffer: data } = await instance.exportProjectWorkbook('project');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(data as any);
    // Sheets, titles and headings of PROJECT PLANNER TEMPLATE.xlsx.
    expect(workbook.worksheets.map((s) => s.name)).toEqual([
      'EXECUTION PLANNER',
      'CONSULTANCY PLANNER',
      'PROCUREMENT PLANNER',
      'PROCUREMENT SCHEDULE',
    ]);
    const exec = workbook.getWorksheet('EXECUTION PLANNER')!;
    expect(exec.getCell('A1').value).toBe('PROJECT TIMELINE');
    expect(exec.getCell('B2').value).toBe('Residence');
    expect(exec.getCell('D4').value).toBe('Activity');
    expect(exec.getCell('O4').value).toBe('Location Status');
    expect(exec.getCell('A5').value).toBe('A');
    expect(exec.getCell('A6').value).toBe(1);
    expect((exec.getCell('G6').value as any).formula).toBe(
      'IF(OR(E6="",F6=""),"",F6+E6-1)',
    );
    expect(exec.getCell('O6').value as string).toContain('Kitchen: Done');
    // Every PMC task is written once under its phase section; rows end there.
    const pmcCount = items.filter((i) => i.module === 'PMC').length;
    let numbered = 0;
    let r = 5;
    for (; exec.getCell(r, 1).value !== null; r++)
      if (typeof exec.getCell(r, 1).value === 'number') numbered++;
    expect(numbered).toBe(pmcCount);
    expect(exec.getCell(r, 4).value).toBeNull();
    const drawings = workbook.getWorksheet('CONSULTANCY PLANNER')!;
    expect(drawings.getCell('A1').value).toBe('DRAWING LIST');
    expect(drawings.getCell('B4').value).toBe('Drawing Title');
    const schedule = workbook.getWorksheet('PROCUREMENT SCHEDULE')!;
    expect(schedule.getCell('A1').value).toBe('MATERIAL PROCUREMENT LIST');
    const materials = procurement.filter((p) => p.item_type !== 'LABOUR');
    const first = materials.findIndex((p) => p.purchase_date);
    if (first >= 0)
      expect(schedule.getCell(6 + first, 4).value).toBeInstanceOf(Date);
    expect(schedule.getCell(6, 2).value).toBe(materials[0].category_name);
    expect(
      workbook.getWorksheet('PROCUREMENT PLANNER')!.getCell('A1').value,
    ).toBe('TENDER TRACKER');
  });
});
