import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import JSZip from 'jszip';
import PDFDocument from 'pdfkit';
import { CrucialWorkQueryDto } from './dto/crucial-work.dto';
import { indiaDate } from './crucial-work.service';

export interface CrucialRegister {
  tasks: any[];
  checks: any[];
  checklist: any[];
  cycle_end: string;
}

const xmlText = (value: unknown) =>
  String(value ?? '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
export const crucialStatus = (status: string) =>
  status === 'completed'
    ? 'Closed'
    : status === 'todo'
      ? 'Open'
      : 'In Progress';
const checkLabels = {
  checked: 'Yes',
  in_progress: 'In progress',
  not_checked: 'No',
};

export function exportRows(register: CrucialRegister) {
  const item = (t: any) =>
    [t.title, t.project?.name ? `Project: ${t.project.name}` : '']
      .filter(Boolean)
      .join('\n');
  return {
    master: register.tasks.map((t) => [
      String(t.crucial_ref),
      item(t),
      t.crucial_reason || '',
      t.assignee?.name || 'Unassigned',
      t.due_date ? indiaDate(t.due_date) : '',
      crucialStatus(t.status),
    ]),
    checklist: register.checklist.map((t) => {
      const check = register.checks.find((c) => c.task_id === t.id);
      return [
        String(t.crucial_ref),
        item(t),
        check ? checkLabels[check.check_status] || '' : '',
        check?.follow_up || '',
        check?.checker?.name || '',
      ];
    }),
  };
}

// Clone the retained template row and replace only its cell contents. The package's
// styles, page geometry, branding, headers and relationships remain intact.
export function fillTemplateTable(table: string, values: string[][]) {
  const rows = table.match(/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g);
  if (!rows || rows.length < 2)
    throw new Error('Crucial Work template row is missing');
  let header = rows[0];
  if (!header.includes('<w:tblHeader')) {
    header = header.includes('<w:trPr>')
      ? header.replace('<w:trPr>', '<w:trPr><w:tblHeader/>')
      : header.replace(/(<w:tr\b[^>]*>)/, '$1<w:trPr><w:tblHeader/></w:trPr>');
  }
  const sample = rows[1]
    .replace(/<w:trHeight\b[^>]*\/>/g, '')
    .replace(/<w:cantSplit\b[^>]*\/>/g, '');
  const cells = sample.match(/<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g)!;
  const data = (values.length ? values : [cells.map(() => '')])
    .map((row) => {
      let i = 0;
      return sample.replace(/<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g, (cell) => {
        const properties =
          cell.match(/<w:tcPr\b[^>]*>[\s\S]*?<\/w:tcPr>/)?.[0] || '';
        const pPr = (
          cell.match(/<w:pPr\b[^>]*>[\s\S]*?<\/w:pPr>/)?.[0] || ''
        ).replace(/<w:keepNext\b[^>]*\/>/g, '');
        const rPr = cell.match(/<w:rPr\b[^>]*>[\s\S]*?<\/w:rPr>/)?.[0] || '';
        const text = xmlText(row[i++])
          .split('\n')
          .map((line) => `<w:t xml:space="preserve">${line}</w:t>`)
          .join('<w:br/>');
        return `<w:tc>${properties}<w:p>${pPr}<w:r>${rPr}${text}</w:r></w:p></w:tc>`;
      });
    })
    .join('');
  return table.replace(rows.join(''), header + data);
}

@Injectable()
export class CrucialWorkExportService {
  private readonly templates = join(__dirname, 'templates');

  template() {
    return readFile(join(this.templates, 'crucial-work.docx'));
  }

  async word(register: CrucialRegister, query: CrucialWorkQueryDto) {
    const zip = await JSZip.loadAsync(await this.template());
    let xml = await zip.file('word/document.xml')!.async('string');
    const tables = xml.match(/<w:tbl\b[^>]*>[\s\S]*?<\/w:tbl>/g)!;
    if (tables.length !== 4)
      throw new Error('Unexpected Crucial Work template structure');
    const rows = exportRows(register);
    xml = xml.replace(tables[1], fillTemplateTable(tables[1], rows.master));
    xml = xml.replace(tables[3], fillTemplateTable(tables[3], rows.checklist));
    const scope = query.project_id
      ? register.tasks[0]?.project?.name || 'Selected project'
      : 'All projects';
    const metadata = `${scope} | ${query.cycle === 'weekly' ? 'Weekly' : 'Daily'} cycle: ${query.cycle_date} to ${register.cycle_end}`;
    xml = xml.replace(
      tables[0],
      `<w:p><w:r><w:rPr><w:rFonts w:ascii="Lato" w:hAnsi="Lato"/><w:sz w:val="16"/></w:rPr><w:t>${xmlText(metadata)}</w:t></w:r></w:p>${tables[0]}`,
    );
    zip.file('word/document.xml', xml);
    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  }

  async pdf(
    register: CrucialRegister,
    query: CrucialWorkQueryDto,
  ): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 55, right: 55 },
      info: { Title: 'Crucial Works List', Author: 'Rippotai' },
    });
    doc.registerFont('Lato', join(this.templates, 'lato-regular.woff'));
    doc.registerFont('LatoBold', join(this.templates, 'lato-bold.woff'));
    doc.registerFont('BrandBold', join(this.templates, 'brand-bold.ttf'));
    const chunks: Buffer[] = [];
    const result = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
    const green = '#0D3D2F';
    const muted = '#3F5C52';
    const width = doc.page.width - 110;
    const pageHeader = () => {
      doc.font('LatoBold').fontSize(13).fillColor(green);
      const prefixWidth = doc.widthOfString('RIPP');
      doc.text('RIPP', 55, 50, { lineBreak: false });
      doc.font('BrandBold');
      const macronWidth = doc.widthOfString('Ō');
      doc.text('Ō', 55 + prefixWidth, 50, { lineBreak: false });
      doc
        .font('LatoBold')
        .text('TAI', 55 + prefixWidth + macronWidth, 50, { lineBreak: false });
      doc.x = 55;
      doc.y = 67;
      doc
        .font('Lato')
        .fontSize(6)
        .fillColor(muted)
        .text('ARCHITECTURE · INTERIORS · TURNKEY');
      doc
        .moveDown(2)
        .font('LatoBold')
        .fontSize(12)
        .fillColor(green)
        .text('CRUCIAL WORKS LIST');
      doc
        .font('Lato')
        .fontSize(6)
        .fillColor(muted)
        .text('THE ITEMS THAT CANNOT BE MISSED — TRACKED UNTIL CLOSED');
      doc
        .moveDown(1.5)
        .fontSize(8)
        .text(
          `${query.project_id ? register.tasks[0]?.project?.name || 'Selected project' : 'All projects'} | ${query.cycle === 'weekly' ? 'Weekly' : 'Daily'} cycle: ${query.cycle_date} to ${register.cycle_end}`,
          { width },
        );
      doc.moveDown();
    };
    pageHeader();
    const section = (title: string, note: string) => {
      doc.font('LatoBold').fontSize(12).fillColor(green).text(title, { width });
      doc
        .moveDown(0.5)
        .font('Lato')
        .fontSize(8)
        .fillColor(muted)
        .text(note, { width });
      doc.moveDown();
    };
    const table = (
      headers: string[],
      data: string[][],
      proportions: number[],
    ) => {
      const widths = proportions.map((p) => p * width);
      const bottom = doc.page.height - 50;
      const lineHeight = 11;
      const lines = (text: string, cellWidth: number) => {
        const output: string[] = [];
        for (const paragraph of String(text).split('\n')) {
          let line = '';
          for (const word of paragraph.split(/\s+/)) {
            const candidate = line ? `${line} ${word}` : word;
            if (line && doc.widthOfString(candidate) > cellWidth - 10) {
              output.push(line);
              line = '';
            }
            if (doc.widthOfString(word) > cellWidth - 10) {
              for (const char of word) {
                if (line && doc.widthOfString(line + char) > cellWidth - 10) {
                  output.push(line);
                  line = '';
                }
                line += char;
              }
            } else line = line ? `${line} ${word}` : word;
          }
          output.push(line);
        }
        return output;
      };
      const draw = (cells: string[][], header = false) => {
        const y = doc.y;
        const height =
          Math.max(...cells.map((c) => c.length), 1) * lineHeight + 12;
        let x = 55;
        cells.forEach((cell, i) => {
          doc.rect(x, y, widths[i], height).fill(header ? green : '#FFFFFF');
          doc.rect(x, y, widths[i], height).lineWidth(0.4).stroke('#CCD5D0');
          doc.fillColor(header ? '#FFFFFF' : green);
          cell.forEach((line, lineIndex) =>
            doc.text(line, x + 5, y + 6 + lineIndex * lineHeight, {
              lineBreak: false,
            }),
          );
          x += widths[i];
        });
        doc.x = 55;
        doc.y = y + height;
      };
      const heading = () => {
        doc.font('LatoBold').fontSize(8);
        draw(
          headers.map((h, i) => lines(h, widths[i])),
          true,
        );
        doc.font('Lato').fontSize(8);
      };
      heading();
      for (const row of data.length
        ? data
        : [headers.map((_, i) => (i === 1 ? 'No items for this cycle' : ''))]) {
        const remaining = row.map((cell, i) => lines(cell, widths[i]));
        while (remaining.some((cell) => cell.length)) {
          if (doc.y + 24 > bottom) {
            doc.addPage();
            pageHeader();
            heading();
          }
          const capacity = Math.max(
            1,
            Math.floor((bottom - doc.y - 12) / lineHeight),
          );
          const count = Math.max(...remaining.map((cell) => cell.length));
          if (
            doc.y > 240 &&
            count > capacity &&
            count * lineHeight + 12 < bottom - 220
          ) {
            doc.addPage();
            pageHeader();
            heading();
            continue;
          }
          draw(remaining.map((cell) => cell.splice(0, capacity)));
        }
      }
      doc.moveDown();
    };
    const rows = exportRows(register);
    section(
      '01   Master List — Running Register',
      'Every item that cannot be missed, added the moment it is identified. Never deleted — marked Closed and kept for the record.',
    );
    table(
      ['Ref', 'Item', 'Why It’s Crucial', 'Owner', 'Target Date', 'Status'],
      rows.master,
      [0.065, 0.245, 0.32, 0.135, 0.125, 0.11],
    );
    if (doc.y + 30 > doc.page.height - 50) {
      doc.addPage();
      pageHeader();
    }
    doc
      .font('Lato')
      .fontSize(7)
      .fillColor(muted)
      .text(
        'STATUS KEY   Open — not yet actioned   In Progress — being worked on   Closed — verified complete',
        { width },
      );
    doc.addPage();
    pageHeader();
    section(
      '02   Daily / Weekly Checklist',
      'Items due for attention in this cycle, pulled from Part 1. Filled fresh each cycle — checks do not carry over automatically.',
    );
    table(
      [
        'Ref (from Part 1)',
        'Item',
        'Checked Today?',
        'Follow-up Needed',
        'Checked By',
      ],
      rows.checklist,
      [0.12, 0.34, 0.15, 0.23, 0.16],
    );
    doc.end();
    return result;
  }
}
