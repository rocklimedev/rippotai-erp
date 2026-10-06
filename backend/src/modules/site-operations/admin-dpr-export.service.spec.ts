import { Workbook } from 'exceljs';
import { AdminDprExportService } from './admin-dpr-export.service';

describe('Admin DPR Excel export', () => {
  const reports = { findAll: jest.fn() };
  const logs = { findAll: jest.fn() };
  const service = new AdminDprExportService(reports as any, logs as any);

  beforeEach(() => jest.clearAllMocks());

  it('populates both template sheets, preserves branding and clears example data', async () => {
    const buffer = await service.buildWorkbook([{
      report_date: '2026-10-06', project: { name: 'Test project' }, work_status: 'In Progress',
      work_details: 'Ceiling installation', contractor_working: 'Team A',
      work_planned_tomorrow: 'Painting', material_required_tomorrow: 'Paint',
      material_sent_from_vendor: 'Boards', material_sent_from_inventory: 'Tools', issues_blockers: 'Access pending',
    }], [{ work_type: 'PO', project: { name: 'Test project' }, details: 'Purchase order approved',
      status: 'Completed', pending_with: '', due_date: '2026-10-07', remarks: 'Sent to vendor' }]);
    const book = new Workbook();
    await book.xlsx.load(buffer as any);
    const report = book.getWorksheet('ADMIN DAILY REPORT')!;
    const log = book.getWorksheet('Admin Daily Log')!;
    expect(report.getCell('A1').value).toBe('RIPPŌTAI');
    expect(report.getCell('A6').value).toEqual(new Date('2026-10-06T00:00:00Z'));
    expect(report.getCell('A6').numFmt).toBe('dd-mmm-yyyy');
    expect(report.getRow(6).values).toEqual([, new Date('2026-10-06T00:00:00Z'), 'Test project',
      'In Progress', 'Ceiling installation', 'Team A', 'Painting', 'Paint', 'Boards', 'Tools', 'Access pending']);
    expect(log.getCell('A6').value).toBe('PO');
    expect(log.getCell('C6').value).toBe('Purchase order approved');
    expect(log.getCell('F6').value).toEqual(new Date('2026-10-07T00:00:00Z'));
    expect(log.getCell('A22').value).toBeNull();
    expect(log.state).toBe('visible');
    expect(book.getWorksheet('Lists')!.state).toBe('hidden');
    expect(report.getCell('C6').dataValidation.formulae).toEqual(["'Lists'!$B$5:$B$8"]);
  });

  it('exports entries beyond the original template and removes examples for empty results', async () => {
    const book = new Workbook();
    await book.xlsx.load(await service.buildWorkbook([], Array.from({ length: 30 }, (_, i) => ({
      work_type: `Work ${i}`, status: 'Pending', details: `Details ${i}`,
    }))) as any);
    expect(book.getWorksheet('Admin Daily Log')!.getCell('A35').value).toBe('Work 29');
    expect(book.getWorksheet('Admin Daily Log')!.getCell('A22').value).toBe('Work 16');
    expect(book.getWorksheet('ADMIN DAILY REPORT')!.getCell('A6').value).toBeNull();
  });

  it('uses unpaginated queries and the same date/project scope for both sections', async () => {
    reports.findAll.mockResolvedValue({ data: [] });
    logs.findAll.mockResolvedValue({ data: [] });
    const query = { date: '2026-10-06', project_id: 'project-id', page: 2, limit: 20 };
    await service.export(query);
    expect(reports.findAll).toHaveBeenCalledWith(query, false);
    expect(logs.findAll).toHaveBeenCalledWith({ project_id: 'project-id', from_date: '2026-10-06', to_date: '2026-10-06' }, false);
  });

  it('rejects a reversed date range', async () => {
    await expect(service.export({ from_date: '2026-10-07', to_date: '2026-10-06' })).rejects.toThrow('From date');
    expect(reports.findAll).not.toHaveBeenCalled();
  });
});
