import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { ProjectShortlistService } from './project-shortlist.service';
import { ShortlistType } from '@/common/enums/shortlist.enums';

@Injectable()
export class ShortlistExportService {
  constructor(
    private readonly projectShortlistService: ProjectShortlistService,
  ) {}

  // ============================================================
  // BUILD SHEET
  // ============================================================

  private buildWorksheet(
    workbook: ExcelJS.Workbook,
    data: any,
  ): ExcelJS.Worksheet {
    const sheetName =
      data.shortlist_type === ShortlistType.VENDOR
        ? 'VENDOR SHORTLIST'
        : 'MATERIAL SHORTLIST';

    const worksheet = workbook.addWorksheet(sheetName);

    // ----------------------------------------------------------
    // TITLE
    // ----------------------------------------------------------

    worksheet.mergeCells('A1:F1');

    const titleCell = worksheet.getCell('A1');

    titleCell.value = 'PROJECT';

    titleCell.font = {
      bold: true,
      size: 14,
    };

    titleCell.alignment = {
      horizontal: 'left',
    };

    if (data.title) {
      worksheet.getCell('A2').value = data.title;
    }

    // ----------------------------------------------------------
    // HEADERS
    // ----------------------------------------------------------

    const headers = [
      'S.NO',
      'TRADE',
      'WORKING TYPE',

      data.shortlist_type === ShortlistType.VENDOR
        ? 'NAME OF VENDOR'
        : 'MATERIAL',

      'ESTIMATE',
      'QUOTATION',
    ];

    const headerRow = worksheet.getRow(3);

    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);

      cell.value = header;

      cell.font = {
        bold: true,
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: 'FFE0E0E0',
        },
      };

      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // ----------------------------------------------------------
    // DATA
    // ----------------------------------------------------------

    let currentRow = 4;

    for (const tradeBlock of data.grid) {
      for (let index = 0; index < tradeBlock.rows.length; index++) {
        const row = tradeBlock.rows[index];

        const excelRow = worksheet.getRow(currentRow);

        if (index === 0) {
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

        for (let column = 1; column <= 6; column++) {
          excelRow.getCell(column).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        }

        currentRow++;
      }
    }

    // ----------------------------------------------------------
    // WIDTHS
    // ----------------------------------------------------------

    worksheet.getColumn(1).width = 8;
    worksheet.getColumn(2).width = 18;
    worksheet.getColumn(3).width = 18;
    worksheet.getColumn(4).width = 32;
    worksheet.getColumn(5).width = 16;
    worksheet.getColumn(6).width = 16;

    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 3,
      },
    ];

    return worksheet;
  }

  // ============================================================
  // EXPORT ONE
  // ============================================================

  async exportToExcel(
    projectShortlistId: string,
    res?: Response,
  ): Promise<ExcelJS.Buffer> {
    const data =
      await this.projectShortlistService.getGridView(projectShortlistId);

    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Rippotai ERP - Shortlist Module';

    workbook.created = new Date();

    this.buildWorksheet(workbook, data);

    const buffer = await workbook.xlsx.writeBuffer();

    if (res) {
      const sheetName =
        data.shortlist_type === ShortlistType.VENDOR
          ? 'VENDOR_SHORTLIST'
          : 'MATERIAL_SHORTLIST';

      const filename = `${sheetName}_${data.project_id}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      res.send(Buffer.from(buffer));

      return buffer as ExcelJS.Buffer;
    }

    return buffer as ExcelJS.Buffer;
  }

  // ============================================================
  // EXPORT BOTH
  // ============================================================

  async exportBothForProject(
    projectId: string,
    res?: Response,
  ): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Rippotai ERP - Shortlist Module';

    workbook.created = new Date();

    for (const type of [ShortlistType.VENDOR, ShortlistType.MATERIAL]) {
      const shortlist = await this.projectShortlistService.findByProjectAndType(
        projectId,
        type,
      );

      const data = await this.projectShortlistService.getGridView(shortlist.id);

      this.buildWorksheet(workbook, data);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    if (res) {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="SHORTLIST_${projectId}.xlsx"`,
      );

      res.send(Buffer.from(buffer));

      return buffer as ExcelJS.Buffer;
    }

    return buffer as ExcelJS.Buffer;
  }
}
