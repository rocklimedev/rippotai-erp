import { BadRequestException, Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { join } from 'path';
import { AdminDailyReportService } from './admin-daily-report.service';
import { AdminDailyLogService } from './admin-daily-log.service';
import { QueryAdminDailyReportDto } from './dto/admin-daily-report.dto';

@Injectable()
export class AdminDprExportService {
  constructor(
    private readonly reports: AdminDailyReportService,
    private readonly logs: AdminDailyLogService,
  ) {}

  async export(query: QueryAdminDailyReportDto) {
    if (query.from_date && query.to_date && query.from_date > query.to_date) {
      throw new BadRequestException('From date must be on or before to date');
    }
    const [reports, logs] = await Promise.all([
      this.reports.findAll(query, false),
      this.logs.findAll({
        project_id: query.project_id,
        from_date: query.date || query.from_date,
        to_date: query.date || query.to_date,
      }, false),
    ]);
    return this.buildWorkbook(reports.data, logs.data);
  }

  async buildWorkbook(reports: any[], logs: any[]) {
    const workbook = new Workbook();
    await workbook.xlsx.readFile(join(__dirname, 'templates', 'admin-dpr.xlsx'));
    const reportSheet = workbook.getWorksheet('ADMIN DAILY REPORT')!;
    const logSheet = workbook.getWorksheet('Admin Daily Log')!;
    // Keep template branding, widths, styles and dropdown lists. Remove example content.
    for (let row = 6; row <= Math.max(reportSheet.rowCount, reports.length + 5); row++) {
      for (let column = 1; column <= 10; column++) reportSheet.getCell(row, column).value = null;
    }
    logSheet.unMergeCells('A22:G22');
    for (let row = 6; row <= Math.max(logSheet.rowCount, logs.length + 5); row++) {
      for (let column = 1; column <= 7; column++) logSheet.getCell(row, column).value = null;
    }
    const date = (value?: string) => value ? new Date(`${value.slice(0, 10)}T00:00:00.000Z`) : null;
    const populate = (sheet: typeof reportSheet, rows: any[][], statusColumn: number) => {
      rows.forEach((values, index) => {
        const row = sheet.getRow(index + 6);
        row.height = 60;
        values.forEach((value, column) => {
          const cell = row.getCell(column + 1);
          cell.value = value ?? null;
          cell.alignment = { vertical: 'top', wrapText: true };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } } };
          if (value instanceof Date) cell.numFmt = 'dd-mmm-yyyy';
        });
        row.getCell(statusColumn).dataValidation = {
          type: 'list', allowBlank: false, formulae: ["'Lists'!$B$5:$B$8"],
        };
      });
      sheet.views = [{ state: 'frozen', ySplit: 5 }];
      sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: Math.max(6, rows.length + 5), column: valuesWidth(sheet) } };
      sheet.pageSetup.printArea = `A1:${sheet === reportSheet ? 'J' : 'G'}${Math.max(6, rows.length + 5)}`;
    };
    const valuesWidth = (sheet: typeof reportSheet) => sheet === reportSheet ? 10 : 7;
    populate(reportSheet, reports.map(r => [date(r.report_date), r.project?.name, r.work_status,
      r.work_details, r.contractor_working, r.work_planned_tomorrow, r.material_required_tomorrow,
      r.material_sent_from_vendor, r.material_sent_from_inventory, r.issues_blockers]), 3);
    populate(logSheet, logs.map(r => [r.work_type, r.project?.name, r.details, r.status,
      r.pending_with, date(r.due_date), r.remarks]), 4);
    logSheet.state = 'visible';
    workbook.getWorksheet('Lists')!.state = 'hidden';
    return workbook.xlsx.writeBuffer();
  }
}
