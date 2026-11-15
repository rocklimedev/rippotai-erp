import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import JSZip from 'jszip';
import PDFDocument from 'pdfkit';
import { CrucialWorkQueryDto } from './dto/crucial-work.dto';
import { indiaDate } from './crucial-work.service';
import { BRAND, brandLogo } from '../../common/brand/brand-assets';

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

const hex = (c: string) => c.replace('#', '').toUpperCase();
const GREEN = hex(BRAND.green);
const INK = hex(BRAND.ink);
const GREY = hex(BRAND.grey);
const LOGO_W = 936000; // 26 mm (EMU)
const LOGO_H = Math.round((LOGO_W * 1590) / 1260); // official logo aspect

/** Run-level font size (half-points) → brand minimums: labels ≥ 8.5 pt, body 9.5–10 pt. */
const SIZE_MAP: Record<string, string> = {
  '10': '17',
  '11': '17',
  '12': '19',
  '13': '19',
  '14': '20',
  '22': '24',
  '24': '28',
};
const setSize = (rPr: string, size: string) =>
  rPr
    .replace(/<w:sz w:val="\d+"\/>/, `<w:sz w:val="${size}"/>`)
    .replace(/<w:szCs w:val="\d+"\/>/, `<w:szCs w:val="${size}"/>`);
const setColor = (rPr: string, color: string) =>
  /<w:color w:val="\w+"\/>/.test(rPr)
    ? rPr.replace(/<w:color w:val="\w+"\/>/, `<w:color w:val="${color}"/>`)
    : rPr.replace('</w:rPr>', `<w:color w:val="${color}"/></w:rPr>`);
const setBold = (rPr: string) =>
  rPr
    .replace(/<w:b w:val="false"\/>/g, '<w:b/>')
    .replace(/<w:bCs w:val="false"\/>/g, '<w:bCs/>');

/** Brand pass over a run's properties: sizes, colours (no gold text), no italics. */
function brandRun(rPr: string) {
  let out = rPr
    .replace(/<w:i\/>|<w:i w:val="(true|1)"\/>/g, '<w:i w:val="false"/>')
    .replace(/<w:iCs\/>|<w:iCs w:val="(true|1)"\/>/g, '<w:iCs w:val="false"/>')
    .replace(/<w:color w:val="3F5C52"\/>/g, `<w:color w:val="${GREY}"/>`)
    .replace(/<w:color w:val="D9B061"\/>/g, `<w:color w:val="${GREEN}"/>`);
  const size = out.match(/<w:sz w:val="(\d+)"\/>/)?.[1];
  if (size && SIZE_MAP[size]) out = setSize(out, SIZE_MAP[size]);
  return out;
}

/** Green header row with white bold text; body rows in black. */
function brandTable(table: string) {
  const rows = table.match(/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g) || [];
  if (rows.length < 2) return table;
  const header = rows[0]!
    .replace(/<w:shd\b[^>]*\/>/g, '')
    .replace(
      /<w:tcPr>/g,
      `<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="${GREEN}"/>`,
    )
    .replace(/<w:rPr>[\s\S]*?<\/w:rPr>/g, (rPr) =>
      setBold(setColor(setSize(rPr, '17'), 'FFFFFF')),
    );
  const body = rows
    .slice(1)
    .map((row) =>
      row.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/g, (rPr) =>
        setColor(setSize(rPr, '18'), INK),
      ),
    );
  return table.replace(rows.join(''), [header, ...body].join(''));
}

/**
 * Bring the stored Crucial Work template to the brand rules: official full logo on the
 * first page (it carries the wordmark, so the typed RIPPŌTAI line goes), readable sizes,
 * grey/black text, green table headers, no gold text, Calibri as Lato's fallback.
 */
export async function brandCrucialTemplate(raw: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(raw);
  const rels = await zip.file('word/_rels/document.xml.rels')!.async('string');
  const media = rels.match(/Target="(media\/[^"]+\.png)"/)?.[1];
  if (media) zip.file(`word/${media}`, brandLogo('logo'));

  let xml = await zip.file('word/document.xml')!.async('string');
  xml = xml
    .replace(/cx="438150" cy="381000"/g, `cx="${LOGO_W}" cy="${LOGO_H}"`)
    .replace(
      /<w:p>(?:(?!<w:p>)[\s\S])*?<w:t xml:space="preserve">RIPPŌTAI<\/w:t><\/w:r><\/w:p>/,
      '',
    )
    // clear space between the logo and the tagline
    .replace(
      '<w:spacing w:after="380" w:before="0"/>',
      '<w:spacing w:after="380" w:before="160"/>',
    )
    .replace(/<w:rPr>[\s\S]*?<\/w:rPr>/g, brandRun)
    .replace(/w:fill="F4F7F6"/g, `w:fill="${hex(BRAND.fill)}"`);
  // Document title (first 14 pt run after the brand pass) a step up, as H1.
  xml = xml.replace(
    /(<w:sz w:val=")28("\/><w:szCs w:val=")28("\/><\/w:rPr><w:t xml:space="preserve">CRUCIAL WORKS LIST)/,
    '$144$244$3',
  );
  const tables = xml.match(/<w:tbl\b[^>]*>[\s\S]*?<\/w:tbl>/g) || [];
  if (tables.length === 4)
    for (const i of [1, 3]) {
      let t = brandTable(tables[i]);
      // Master list: give Status room for "In Progress" at the brand size.
      if (i === 1)
        t = t.replace(
          /(<w:gridCol w:w=")2400("\/>\s*<w:gridCol w:w=")3400("\/>\s*<w:gridCol w:w="1500"\/>\s*<w:gridCol w:w="1200"\/>\s*<w:gridCol w:w=")700/,
          '$12300$23000$31200',
        );
      xml = xml.replace(tables[i], t);
    }
  zip.file('word/document.xml', xml);

  for (const footer of Object.keys(zip.files).filter((n) =>
    /^word\/footer\d*\.xml$/.test(n),
  )) {
    const f = await zip.file(footer)!.async('string');
    zip.file(
      footer,
      f
        .replace(/<w:color w:val="3F5C52"\/>/g, `<w:color w:val="${GREY}"/>`)
        .replace(/<w:sz w:val="12"\/>/g, '<w:sz w:val="17"/>')
        .replace(/<w:szCs w:val="12"\/>/g, '<w:szCs w:val="17"/>'),
    );
  }
  const fonts = zip.file('word/fontTable.xml');
  if (fonts) {
    const f = await fonts.async('string');
    zip.file(
      'word/fontTable.xml',
      /<w:font w:name="Lato">/.test(f)
        ? f.replace(
            /(<w:font w:name="Lato">)(?![\s\S]*?<w:altName)/,
            '$1<w:altName w:val="Calibri"/>',
          )
        : f.replace(
            /<w:fonts([^>]*)\/>\s*$/,
            '<w:fonts$1><w:font w:name="Lato"><w:altName w:val="Calibri"/><w:family w:val="swiss"/></w:font></w:fonts>',
          ),
    );
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

@Injectable()
export class CrucialWorkExportService {
  private readonly templates = join(__dirname, 'templates');

  private branded?: Promise<Buffer>;

  /** The Crucial Work Word template, brand-corrected (also the blank-template download). */
  template() {
    this.branded ??= readFile(join(this.templates, 'crucial-work.docx')).then(
      brandCrucialTemplate,
    );
    return this.branded;
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
      `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Lato" w:hAnsi="Lato"/><w:color w:val="${INK}"/><w:sz w:val="20"/></w:rPr><w:t>${xmlText(metadata)}</w:t></w:r></w:p>${tables[0]}`,
    );
    zip.file('word/document.xml', xml);
    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  }

  async pdf(
    register: CrucialRegister,
    query: CrucialWorkQueryDto,
  ): Promise<Buffer> {
    const M = 50; // side margins (pt) ≈ 17.6 mm
    const TOP = 56;
    const BOTTOM = 56;
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: TOP, bottom: BOTTOM, left: M, right: M },
      bufferPages: true,
      info: { Title: 'Crucial Works List', Author: 'Rippotai Architecture' },
    });
    doc.registerFont('Lato', join(this.templates, 'lato-regular.woff'));
    doc.registerFont('LatoBold', join(this.templates, 'lato-bold.woff'));
    const chunks: Buffer[] = [];
    const result = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
    const { green, ink, grey, ruleSoft, rule, gold } = BRAND;
    const width = doc.page.width - 2 * M;
    const scope = query.project_id
      ? register.tasks[0]?.project?.name || 'Selected project'
      : 'All projects';
    const metadata = `${scope} | ${query.cycle === 'weekly' ? 'Weekly' : 'Daily'} cycle: ${query.cycle_date} to ${register.cycle_end}`;
    const logo = brandLogo('logo');
    const mono = brandLogo('monogram');

    // First page: official full logo centred, document title, scope line.
    const firstHeader = () => {
      const w = 62;
      doc.image(logo, (doc.page.width - w) / 2, 40, { width: w });
      doc.y = 40 + (w * 1590) / 1260 + 18;
      doc
        .moveTo(M, doc.y)
        .lineTo(M + width, doc.y)
        .lineWidth(0.8)
        .stroke(gold);
      doc.y += 16;
      doc.x = M;
      doc
        .font('LatoBold')
        .fontSize(20)
        .fillColor(green)
        .text('CRUCIAL WORKS LIST', M, doc.y, { width, align: 'center' });
      doc
        .moveDown(0.3)
        .font('Lato')
        .fontSize(9)
        .fillColor(grey)
        .text('THE ITEMS THAT CANNOT BE MISSED — TRACKED UNTIL CLOSED', {
          width,
          align: 'center',
        });
      doc
        .moveDown(1.2)
        .fontSize(10)
        .fillColor(ink)
        .text(metadata, M, doc.y, { width });
      doc.moveDown(1);
    };
    // Inner pages: monogram + title · scope, thin rule.
    const pageHeader = () => {
      doc.image(mono, M, 28, { height: 22 });
      doc
        .font('Lato')
        .fontSize(9)
        .fillColor(grey)
        .text(`Crucial Works List · ${scope}`, M + 40, 38, {
          width: width - 40,
          align: 'right',
          lineBreak: false,
        });
      doc
        .moveTo(M, 56)
        .lineTo(M + width, 56)
        .lineWidth(0.6)
        .stroke(rule);
      doc.x = M;
      doc.y = 72;
    };
    const newPage = () => {
      doc.addPage();
      pageHeader();
    };
    firstHeader();
    const section = (no: string, title: string, note: string) => {
      doc
        .font('LatoBold')
        .fontSize(14)
        .fillColor(green)
        .text(`${no}   ${title}`, M, doc.y, { width });
      doc
        .moveDown(0.3)
        .font('Lato')
        .fontSize(9)
        .fillColor(grey)
        .text(note, { width });
      doc.moveDown(0.8);
    };
    const table = (
      headers: string[],
      data: string[][],
      proportions: number[],
    ) => {
      const widths = proportions.map((p) => p * width);
      const bottom = doc.page.height - BOTTOM;
      const lineHeight = 12;
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
          Math.max(...cells.map((c) => c.length), 1) * lineHeight + 10;
        let x = M;
        cells.forEach((cell, i) => {
          if (header) doc.rect(x, y, widths[i], height).fill(green);
          doc
            .rect(x, y, widths[i], height)
            .lineWidth(0.5)
            .stroke(header ? green : ruleSoft);
          doc.fillColor(header ? '#FFFFFF' : ink);
          cell.forEach((line, lineIndex) =>
            doc.text(line, x + 5, y + 5 + lineIndex * lineHeight, {
              lineBreak: false,
            }),
          );
          x += widths[i];
        });
        doc.x = M;
        doc.y = y + height;
      };
      const heading = () => {
        doc.font('LatoBold').fontSize(9);
        draw(
          headers.map((h, i) => lines(h, widths[i])),
          true,
        );
        doc.font('Lato').fontSize(9.5);
      };
      heading();
      for (const row of data.length
        ? data
        : [headers.map((_, i) => (i === 1 ? 'No items for this cycle' : ''))]) {
        const remaining = row.map((cell, i) => lines(cell, widths[i]));
        while (remaining.some((cell) => cell.length)) {
          if (doc.y + 26 > bottom) {
            newPage();
            heading();
          }
          const capacity = Math.max(
            1,
            Math.floor((bottom - doc.y - 10) / lineHeight),
          );
          const count = Math.max(...remaining.map((cell) => cell.length));
          if (
            doc.y > 240 &&
            count > capacity &&
            count * lineHeight + 10 < bottom - 220
          ) {
            newPage();
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
      '01',
      'Master List — Running Register',
      'Every item that cannot be missed, added the moment it is identified. Never deleted — marked Closed and kept for the record.',
    );
    table(
      ['Ref', 'Item', 'Why It’s Crucial', 'Owner', 'Target Date', 'Status'],
      rows.master,
      [0.06, 0.25, 0.29, 0.13, 0.13, 0.14],
    );
    if (doc.y + 30 > doc.page.height - BOTTOM) newPage();
    doc
      .font('Lato')
      .fontSize(8.5)
      .fillColor(grey)
      .text(
        'STATUS KEY   Open — not yet actioned   In Progress — being worked on   Closed — verified complete',
        M,
        doc.y,
        { width },
      );
    newPage();
    section(
      '02',
      'Daily / Weekly Checklist',
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
    // Footer on every page: company line + Page x of y.
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0;
      const y = doc.page.height - 36;
      doc
        .moveTo(M, y - 8)
        .lineTo(M + width, y - 8)
        .lineWidth(0.6)
        .stroke(rule);
      doc
        .font('Lato')
        .fontSize(8.5)
        .fillColor(grey)
        .text('Rippotai Architecture', M, y, { lineBreak: false });
      doc.text(`Page ${i + 1} of ${range.count}`, M, y, {
        width,
        align: 'right',
        lineBreak: false,
      });
    }
    doc.end();
    return result;
  }
}
