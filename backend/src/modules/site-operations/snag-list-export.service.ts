import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { join } from 'path';

@Injectable()
export class SnagListExportService {
  async build(document: {
    title: string;
    project_name: string;
    document_date: string;
    revision: number;
    items: any[];
  }) {
    const workbook = new Workbook();
    await workbook.xlsx.readFile(
      join(__dirname, 'templates', 'snag-list.xlsx'),
    );
    const sheet = workbook.worksheets.find(
      (s) => s.name.trim().toLowerCase() === 'snag list',
    )!;
    for (const other of [...workbook.worksheets])
      if (other.id !== sheet.id) workbook.removeWorksheet(other.id);
    sheet.name = 'Snag list';
    sheet.getCell('A1').value = document.title;
    sheet.getCell('A2').value =
      `${document.project_name} | ${document.document_date} | Revision ${document.revision}`;
    const headings = [
      'S. No.',
      'Floor',
      'Room',
      'Category',
      'Observation',
      'Photo',
      'Scope',
      'Status',
      'Remarks',
    ];
    const widths = [9, 16, 22, 22, 55, 45, 24, 20, 40];
    headings.forEach((heading, index) => {
      sheet.getColumn(index + 1).width = widths[index];
      const cell = sheet.getCell(3, index + 1);
      cell.value = heading;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF263746' },
      };
    });
    for (
      let r = 4;
      r <= Math.max(sheet.rowCount, document.items.length + 3);
      r++
    )
      for (let c = 1; c <= 9; c++) sheet.getCell(r, c).value = null;
    document.items.forEach((item, index) => {
      const row = sheet.getRow(index + 4);
      row.height = Math.min(
        409,
        Math.max(
          75,
          ...[
            item.observation || '',
            item.remarks || '',
            (item.photos || []).join('\n'),
          ].map(
            (text) =>
              Math.ceil(text.length / 50 + text.split('\n').length) * 15,
          ),
        ),
      );
      [
        index + 1,
        item.floor,
        item.room,
        item.category,
        item.observation,
        (item.photos || []).join('\n'),
        item.scope,
        item.status,
        item.remarks,
      ].forEach((value, column) => {
        const cell = row.getCell(column + 1);
        cell.value = value || null;
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        };
      });
      if (item.photos?.length === 1)
        row.getCell(6).value = {
          text: item.photos[0],
          hyperlink: item.photos[0],
        };
      row.getCell(8).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"Open,In Progress,Rectified,Closed"'],
      };
    });
    sheet.views = [{ state: 'frozen', ySplit: 3 }];
    sheet.autoFilter = `A3:I${Math.max(4, document.items.length + 3)}`;
    sheet.pageSetup = {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printArea: `A1:I${Math.max(4, document.items.length + 3)}`,
      printTitlesRow: '1:3',
    };
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
