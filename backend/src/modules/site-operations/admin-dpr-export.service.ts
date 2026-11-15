import { BadRequestException, Injectable } from '@nestjs/common';
import { COMPANY_NAME } from '../../common/brand/brand-assets';
import {
  copyRowStyle,
  fillTable,
  loadXlsxTemplate,
  wrappedHeight,
  writeXlsx,
} from '../../common/xlsx-template/xlsx-template';
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
    const { reports, logs } = await this.capture(query);
    return this.buildWorkbook(reports, logs);
  }

  async capture(query: QueryAdminDailyReportDto) {
    if (query.from_date && query.to_date && query.from_date > query.to_date) {
      throw new BadRequestException('From date must be on or before to date');
    }
    const [reports, logs] = await Promise.all([
      this.reports.findAll(query, false),
      this.logs.findAll(
        {
          project_id: query.project_id,
          from_date: query.date || query.from_date,
          to_date: query.date || query.to_date,
        },
        false,
      ),
    ]);
    // Plain snapshots retain all fields and project names independently of future edits.
    const plain = (row: any) => (row.toJSON ? row.toJSON() : row);
    return { reports: reports.data.map(plain), logs: logs.data.map(plain) };
  }

  /** Fills the user's ADMIN DPR TEMPLATE.xlsx (sheets, title block, styles, lists). */
  async buildWorkbook(reports: any[], logs: any[]) {
    const workbook = await loadXlsxTemplate('admin-dpr.xlsx');
    workbook.creator = COMPANY_NAME;
    workbook.created = new Date();
    const report = workbook.getWorksheet('ADMIN DAILY REPORT')!;
    const log = workbook.getWorksheet('Admin Daily Log')!;
    const date = (value?: string) =>
      value ? new Date(`${value.slice(0, 10)}T00:00:00.000Z`) : null;
    const text = (value: unknown) =>
      value === null || value === undefined || value === '' ? null : value;

    // INOS also records "photos attached" — the template already ships its Y/N
    // list (Lists!A5:A6), so it becomes column K in the header style.
    report.getCell('K5').style = JSON.parse(
      JSON.stringify(report.getCell('J5').style),
    );
    report.getCell('K5').value = 'PHOTOS ATTACHED';
    report.getColumn(11).width = 11;
    for (let r = 6; r <= 22; r++)
      report.getCell(r, 11).style = JSON.parse(
        JSON.stringify(report.getCell(7, 10).style),
      );
    fillTable(report, {
      startRow: 6,
      protoRow: 7,
      templateRows: 17,
      lastCol: 11,
      rows: reports.map((r) => [
        date(r.report_date),
        text(r.project?.name),
        text(r.work_status),
        text(r.work_details),
        text(r.contractor_working),
        text(r.work_planned_tomorrow),
        text(r.material_required_tomorrow),
        text(r.material_sent_from_vendor),
        text(r.material_sent_from_inventory),
        text(r.issues_blockers),
        r.photos_attached === undefined ? null : r.photos_attached ? 'Y' : 'N',
      ]),
    });
    reports.forEach((r, i) => {
      const row = report.getRow(6 + i);
      row.getCell(1).numFmt = 'dd-mmm-yyyy';
      row.getCell(11).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['Lists!$A$5:$A$6'],
      };
      row.height = Math.max(
        23,
        wrappedHeight(
          [
            [r.project?.name, 12],
            [r.work_details, 47],
            [r.contractor_working, 32],
            [r.work_planned_tomorrow, 20],
            [r.material_required_tomorrow, 27],
            [r.material_sent_from_vendor, 26],
            [r.material_sent_from_inventory, 30],
            [r.issues_blockers, 20],
          ],
          { line: 13 },
        ),
      );
    });

    // Coordination log: the example row 6 is replaced by real entries.
    for (let c = 1; c <= 7; c++) log.getCell(6, c).value = null;
    copyRowStyle(log, 7, 6, 7);
    const noteRow = fillTable(log, {
      startRow: 6,
      protoRow: 7,
      templateRows: 15,
      lastCol: 7,
      rows: logs.map((r) => [
        text(r.work_type),
        text(r.project?.name),
        text(r.details),
        text(r.status),
        text(r.pending_with),
        date(r.due_date),
        text(r.remarks),
      ]),
    });
    logs.forEach((r, i) => {
      const row = log.getRow(6 + i);
      row.getCell(6).numFmt = 'dd-mmm-yyyy';
      row.height = Math.max(
        22,
        wrappedHeight([
          [r.details, 34],
          [r.remarks, 24],
        ]),
      );
    });
    // The template's footnote describes its example row, which an export replaces.
    const note = log.getCell(noteRow + 1, 1);
    if (typeof note.value === 'string')
      note.value = note.value.replace(/^Row 6 is an example[^.]*\.\s*/, '');
    log.state = logs.length ? 'visible' : 'hidden';
    return writeXlsx(workbook);
  }
}
