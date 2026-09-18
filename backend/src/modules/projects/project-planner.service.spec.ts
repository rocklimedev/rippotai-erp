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
        findAll: jest
          .fn()
          .mockResolvedValue([
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
    instance.getProjectPlannerOverview = jest
      .fn()
      .mockResolvedValue({
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
    const data = await instance.exportProjectWorkbook('project');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(data);
    expect(workbook.worksheets.map((s) => s.name)).toEqual([
      'Overview',
      'Consultancy',
      'Vendor & Procurement',
      'PMC',
    ]);
    expect(workbook.getWorksheet('Overview')!.getCell('E4').value).toBe(
      'Stilt',
    );
    expect(workbook.getWorksheet('Overview')!.getCell('E5').value).toBe(
      'Kitchen',
    );
    expect(workbook.getWorksheet('Consultancy')!.rowCount).toBe(44);
    expect(workbook.getWorksheet('PMC')!.rowCount).toBe(43);
    expect(
      workbook.getWorksheet('Vendor & Procurement')!.getCell('I5').value,
    ).toBeInstanceOf(Date);
    expect(workbook.getWorksheet('Vendor & Procurement')!.rowCount).toBe(26);
  });
});
