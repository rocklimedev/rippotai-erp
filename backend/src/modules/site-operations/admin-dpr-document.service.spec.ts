import { Workbook } from 'exceljs';
import { AdminDprDocumentService } from './admin-dpr-document.service';
import { AdminDprExportService } from './admin-dpr-export.service';

describe('saved Admin DPR documents', () => {
  function setup() {
    const report: any = {
      id: 'entry',
      report_date: '2026-10-07',
      project_id: 'project',
      project: { name: 'Project A' },
      work_details: 'Original work',
      work_status: 'In Progress',
    };
    const log: any = {
      id: 'log',
      log_date: '2026-10-07',
      project_id: null,
      work_type: 'Coordination',
      details: 'Original coordination',
      status: 'Pending',
    };
    const exporter = new AdminDprExportService(
      { findAll: jest.fn().mockResolvedValue({ data: [report] }) } as any,
      { findAll: jest.fn().mockResolvedValue({ data: [log] }) } as any,
    );
    let stored: any;
    const model: any = {
      create: jest.fn(async (values) => {
        stored = {
          id: 'document',
          ...values,
          reports: JSON.parse(JSON.stringify(values.reports)),
          logs: JSON.parse(JSON.stringify(values.logs)),
        };
        return stored;
      }),
      findByPk: jest.fn(async (_id, options) => {
        if (!stored) return null;
        if (Array.isArray(options.attributes))
          return Object.fromEntries(
            options.attributes.map((key: string) => [key, stored[key]]),
          );
        const { excel_data, ...metadata } = stored;
        return metadata;
      }),
      findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 45 }),
      sequelize: { escape: jest.fn((v) => `'${v.replaceAll("'", "''")}'`) },
    };
    return {
      service: new AdminDprDocumentService(model, exporter),
      model,
      exporter,
      report,
      log,
    };
  }
  it('retains both complete sections and the exact Excel after source entries and project names change', async () => {
    const { service, report, log, model } = setup();
    const document = await service.create(
      { from_date: '2026-10-07', to_date: '2026-10-07' },
      { id: 'user', name: 'Admin' },
    );
    expect(document).not.toHaveProperty('excel_data');
    expect(document.report_count).toBe(1);
    expect(document.log_count).toBe(1);
    expect(document.created_by).toBe('user');
    expect(document.project_ids).toEqual(['project']);
    const first = await service.download(document.id);
    report.work_details = 'Changed';
    log.details = 'Changed';
    report.project.name = 'Renamed';
    const saved = await service.findOne(document.id);
    expect(saved.reports[0].work_details).toBe('Original work');
    expect(saved.reports[0].project.name).toBe('Project A');
    expect(saved.logs[0].details).toBe('Original coordination');
    const second = await service.download(document.id);
    expect(second.excel_data.equals(first.excel_data)).toBe(true);
    expect(model.create).toHaveBeenCalledTimes(1);
    const book = new Workbook();
    await book.xlsx.load(second.excel_data as any);
    expect(book.getWorksheet('ADMIN DAILY REPORT')!.getCell('D6').value).toBe(
      'Original work',
    );
    expect(book.getWorksheet('Admin Daily Log')!.getCell('C6').value).toBe(
      'Original coordination',
    );
  });
  it('does not save partial documents on date validation or Excel generation failure', async () => {
    const { service, model, exporter } = setup();
    await expect(
      service.create({ from_date: '2026-10-08', to_date: '2026-10-07' }),
    ).rejects.toThrow('From date');
    jest
      .spyOn(exporter, 'buildWorkbook')
      .mockRejectedValue(new Error('Template unavailable'));
    await expect(service.create({})).rejects.toThrow('Template unavailable');
    expect(model.create).not.toHaveBeenCalled();
  });
  it('lists all projects by default with pagination and omits workbook data and section payloads', async () => {
    const { service, model } = setup();
    const result = await service.list({ page: 2, limit: 20 });
    expect(model.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        offset: 20,
        limit: 20,
        attributes: { exclude: ['excel_data', 'reports', 'logs'] },
      }),
    );
    expect(result.meta.total_pages).toBe(3);
  });
  it('filters by membership in multi-project saved documents', async () => {
    const { service, model } = setup();
    await service.list({ project_id: 'project' });
    expect(model.sequelize.escape).toHaveBeenCalledWith('"project"');
    expect(
      Object.getOwnPropertySymbols(
        model.findAndCountAll.mock.calls[0][0].where,
      ),
    ).toHaveLength(1);
  });
  it('returns not found for missing documents and downloads', async () => {
    const { service } = setup();
    await expect(service.findOne('missing')).rejects.toThrow(
      'Saved DPR not found',
    );
    await expect(service.download('missing')).rejects.toThrow(
      'Saved DPR not found',
    );
  });
});
