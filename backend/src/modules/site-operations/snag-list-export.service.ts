import { Injectable } from '@nestjs/common';
import type { Worksheet } from 'exceljs';
import { COMPANY_NAME } from '../../common/brand/brand-assets';
import {
  cloneSheet,
  fillTable,
  loadXlsxTemplate,
  wrappedHeight,
  writeXlsx,
} from '../../common/xlsx-template/xlsx-template';

/** First sheet of SNAG LIST TEMPLATE.xlsx is the prototype for every category. */
const PROTOTYPE = '1. Brickwork';
const FIRST_ROW = 5;
/** INOS fields the template lacks, appended after "Remarks" in its header style. */
const EXTRA = [
  ['Location', 22],
  ['Scope', 16],
  ['Status', 12],
  ['Photo', 14],
] as const;
const LAST_COL = 5 + EXTRA.length;
const STATUS_LIST = '"Open,In Progress,Rectified,Closed"';

const sheetTitle = (index: number, category: string) =>
  `${index}. ${category}`
    .replace(/[\\/*?:[\]]/g, ' ')
    .slice(0, 31)
    .trim();

const copyCellStyle = (ws: Worksheet, row: number, from: number, to: number) =>
  (ws.getCell(row, to).style = JSON.parse(
    JSON.stringify(ws.getCell(row, from).style),
  ));

@Injectable()
export class SnagListExportService {
  /**
   * Reproduces SNAG LIST TEMPLATE.xlsx: one sheet per category in the
   * "1. Brickwork" layout (green title bar, No. / Checkpoint / Yes / No / NA /
   * Remarks table, cream input cells, Yes/No/NA dropdown with its colour rules),
   * checkpoints numbered 1.1, 1.2 … holding the snag observations.
   */
  async build(document: {
    title: string;
    project_name: string;
    document_date: string;
    revision: number;
    items: any[];
  }) {
    const workbook = await loadXlsxTemplate('snag-list.xlsx');
    workbook.creator = COMPANY_NAME;
    workbook.created = new Date();
    const proto = workbook.getWorksheet(PROTOTYPE)!;
    for (const ws of [...workbook.worksheets])
      if (ws.id !== proto.id) workbook.removeWorksheet(ws.id);
    // Template checkpoints are replaced by the project's snags; add the INOS
    // columns to the prototype before it is cloned for each category.
    for (let r = FIRST_ROW; r <= FIRST_ROW + 1; r++)
      for (let c = 2; c <= 5; c++) proto.getCell(r, c).value = null;
    EXTRA.forEach(([label, width], k) => {
      const col = 6 + k;
      proto.getColumn(col).width = width;
      copyCellStyle(proto, 4, 5, col);
      proto.getCell(4, col).value = label;
      for (let r = FIRST_ROW; r <= FIRST_ROW + 1; r++) {
        copyCellStyle(proto, r, 5, col);
        if (label === 'Status')
          proto.getCell(r, col).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [STATUS_LIST],
          };
      }
    });

    // The green title bar spans the whole (wider) table.
    proto.unMergeCells('B2:E2');
    for (let c = 6; c <= LAST_COL; c++) copyCellStyle(proto, 2, 5, c);
    proto.mergeCells(2, 2, 2, LAST_COL);

    const groups = new Map<string, any[]>();
    for (const item of document.items) {
      const key = String(item.category || '').trim() || 'General';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    if (!groups.size) groups.set('General', []);

    const sheets = [...groups.keys()].map((_, i) =>
      i === 0 ? proto : cloneSheet(workbook, proto, `snag-${i}`),
    );
    const used = new Set<string>();
    [...groups.entries()].forEach(([category, items], i) => {
      const ws = sheets[i];
      const n = i + 1;
      let name = sheetTitle(n, category);
      for (let k = 2; used.has(name.toLowerCase()); k++)
        name = `${sheetTitle(n, category).slice(0, 26)} (${k})`;
      used.add(name.toLowerCase());
      ws.name = name;
      ws.getCell('B2').value = `${n}. ${category.toUpperCase()}`;
      // Document identity (not in the template) as a quiet line under the title.
      ws.getCell('B3').value = [
        document.project_name,
        document.title,
        document.document_date,
        `Revision ${document.revision}`,
      ]
        .filter(Boolean)
        .join('  ·  ');
      ws.getCell('B3').font = {
        name: 'Lato',
        size: 9,
        italic: true,
        color: { argb: 'FF3F5C52' },
      };
      ws.getCell('B3').alignment = { vertical: 'middle', horizontal: 'left' };

      fillTable(ws, {
        startRow: FIRST_ROW,
        templateRows: 2,
        lastCol: LAST_COL,
        rows: items.map((item, k) => {
          const photos: string[] = item.photos || [];
          return [
            null,
            `${n}.${k + 1}`,
            item.observation || null,
            null,
            item.remarks || null,
            [item.floor, item.room].filter(Boolean).join(' / ') || null,
            item.scope || null,
            item.status || null,
            photos.length === 1
              ? { text: 'View photo', hyperlink: photos[0] }
              : photos.join('\n') || null,
          ];
        }),
      });
      items.forEach((item, k) => {
        ws.getRow(FIRST_ROW + k).height = wrappedHeight(
          [
            [item.observation, 58],
            [item.remarks, 33],
            [(item.photos || []).length > 1 ? item.photos.join('\n') : '', 12],
          ],
          { min: 32, line: 14, pad: 6 },
        );
        if ((item.photos || []).length === 1)
          ws.getCell(FIRST_ROW + k, LAST_COL).font = {
            ...ws.getCell(FIRST_ROW + k, LAST_COL).font,
            underline: true,
            color: { argb: 'FF0D3D2F' },
          };
      });
    });
    return writeXlsx(workbook);
  }
}
