import { Injectable } from '@nestjs/common';
import { ProjectShortlistService } from './project-shortlist.service';
import { ShortlistType } from '@/common/enums/shortlist.enums';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

/**
 * Generates downloadable Excel that mirrors the original
 * "VENDOR SHORTLIST VF.xlsx" layout.
 *
 * Frontend can also call the grid endpoint and build Excel client-side;
 * this service is useful when you want a server-generated file.
 */
@Injectable()
export class ShortlistExportService {
  constructor(
    private readonly projectShortlistService: ProjectShortlistService,
  ) {}

  async exportToExcel(
    projectShortlistId: string,
    res?: Response,
  ): Promise<ExcelJS.Buffer> {
    const data =
      await this.projectShortlistService.getGridView(projectShortlistId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Shortlist Module';
    workbook.created = new Date();

    const sheetName =
      data.shortlist_type === ShortlistType.VENDOR
        ? 'VENDOR SHORTLIST'
        : 'MATERIAL SHORTLIST';

    const worksheet = workbook.addWorksheet(sheetName);

    // Title row
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PROJECT';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'left' };

    // Optional project name / title
    if (data.title) {
      worksheet.getCell('A2').value = data.title;
    }

    // Header row (row 3)
    const headers = [
      'S.NO',
      'TRADE',
      'WORKING TYPE',
      'NAME OF VENDOR',
      'ESTIMATE',
      'QUOTATION',
    ];
    const headerRow = worksheet.getRow(3);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Data rows
    let currentRow = 4;
    for (const tradeBlock of data.grid) {
      tradeBlock.rows.forEach((row, idx) => {
        const excelRow = worksheet.getRow(currentRow);

        // S.NO only on first working-type of the trade
        if (idx === 0) {
          excelRow.getCell(1).value = tradeBlock.s_no;
          excelRow.getCell(2).value = tradeBlock.trade;
        }

        excelRow.getCell(3).value = row.working_type;
        excelRow.getCell(4).value = row.name_of_vendor ?? '';
        excelRow.getCell(5).value =
          row.estimate_value != null ? Number(row.estimate_value) : '';
        excelRow.getCell(6).value =
          row.quotation_value != null ? Number(row.quotation_value) : '';

        // Light borders
        for (let c = 1; c <= 6; c++) {
          excelRow.getCell(c).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        }

        // Number format for money columns
        excelRow.getCell(5).numFmt = '#,##0.00';
        excelRow.getCell(6).numFmt = '#,##0.00';

        currentRow++;
      });
    }

    // Column widths
    worksheet.getColumn(1).width = 8;
    worksheet.getColumn(2).width = 14;
    worksheet.getColumn(3).width = 14;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 14;
    worksheet.getColumn(6).width = 14;

    const buffer = await workbook.xlsx.writeBuffer();

    if (res) {
      const filename = `${sheetName.replace(/\s+/g, '_')}_${data.project_id}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send(Buffer.from(buffer));
    }

    return buffer as unknown as ExcelJS.Buffer;
  }

  /**
   * Export both VENDOR and MATERIAL shortlists of a project into one workbook
   * (two sheets) – closest to the original template file.
   */
  async exportBothForProject(
    projectId: string,
    res?: Response,
  ): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Shortlist Module';
    workbook.created = new Date();

    for (const type of [ShortlistType.VENDOR, ShortlistType.MATERIAL]) {
      try {
        const shortlist =
          await this.projectShortlistService.findByProjectAndType(
            projectId,
            type,
          );
        const data = await this.projectShortlistService.getGridView(
          shortlist.id,
        );

        const sheetName =
          type === ShortlistType.VENDOR
            ? 'VENDOR SHORTLIST'
            : 'MATERIAL SHORTLIST';
        const worksheet = workbook.addWorksheet(sheetName);

        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').value = 'PROJECT';
        worksheet.getCell('A1').font = { bold: true, size: 14 };

        if (data.title) {
          worksheet.getCell('A2').value = data.title;
        }

        const headers = [
          'S.NO',
          'TRADE',
          'WORKING TYPE',
          'NAME OF VENDOR',
          'ESTIMATE',
          'QUOTATION',
        ];
        const headerRow = worksheet.getRow(3);
        headers.forEach((h, i) => {
          const cell = headerRow.getCell(i + 1);
          cell.value = h;
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
          };
        });

        let currentRow = 4;
        for (const tradeBlock of data.grid) {
          tradeBlock.rows.forEach((row, idx) => {
            const excelRow = worksheet.getRow(currentRow);
            if (idx === 0) {
              excelRow.getCell(1).value = tradeBlock.s_no;
              excelRow.getCell(2).value = tradeBlock.trade;
            }
            excelRow.getCell(3).value = row.working_type;
            excelRow.getCell(4).value = row.name_of_vendor ?? '';
            excelRow.getCell(5).value =
              row.estimate_value != null ? Number(row.estimate_value) : '';
            excelRow.getCell(6).value =
              row.quotation_value != null ? Number(row.quotation_value) : '';
            excelRow.getCell(5).numFmt = '#,##0.00';
            excelRow.getCell(6).numFmt = '#,##0.00';
            currentRow++;
          });
        }

        worksheet.getColumn(1).width = 8;
        worksheet.getColumn(2).width = 14;
        worksheet.getColumn(3).width = 14;
        worksheet.getColumn(4).width = 30;
        worksheet.getColumn(5).width = 14;
        worksheet.getColumn(6).width = 14;
      } catch {
        // Skip if shortlist of that type does not exist yet
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();

    if (res) {
      const filename = `SHORTLIST_${projectId}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send(Buffer.from(buffer));
    }

    return buffer as unknown as ExcelJS.Buffer;
  }
}
