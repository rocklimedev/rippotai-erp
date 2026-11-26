import { Injectable } from '@nestjs/common';
import { BoqService, BoqJSON, BoqItemJSON } from './boq.service';
import * as puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';
import { TermsTemplate } from '../metas/models/terms-templates.model';
import { downloadName } from '@/common/download-name';
import {
  COMPANY_NAME,
  brandLogo,
  dataUri,
} from '../../common/brand/brand-assets';
import {
  buildBudgetModel,
  paginateBudget,
  renderBudgetHtml,
} from './boq-budget-layout';
import {
  INR_FORMAT,
  QTY_FORMAT,
  brandPrint,
  freezeAndFilter,
  setWidths,
  styleBodyRow,
  styleGroupRow,
  styleHeaderRow,
  styleTotalsRow,
  writeBrandHeader,
} from '../../common/brand/excel-brand';

export type PdfVariant =
  | 'internal'
  | 'client'
  | 'quantity_only'
  | 'vendor_enquiry';

interface BoqProjectJSON {
  name?: string;
  site_location?: string;
  client?: {
    id?: string;
    name?: string;
  };
}

@Injectable()
export class BoqExportService {
  constructor(private readonly boqService: BoqService) {}

  // ==================================================================== Excel

  async toExcel(boqId: string): Promise<{ buffer: Buffer; filename: string }> {
    const boq = await this.boqService.findOne(boqId);
    const project = boq.project as BoqProjectJSON | undefined;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = COMPANY_NAME;
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('BOQ');

    const LAST = 7;
    const HEADER = 5;
    writeBrandHeader(workbook, sheet, {
      title: this.formatValue(boq.title) || 'Bill of Quantities',
      project: [
        project?.name,
        this.formatValue(boq.location) || project?.site_location,
      ]
        .filter(Boolean)
        .join(' · '),
      meta: [
        boq.boq_number ? `BOQ no. ${this.formatValue(boq.boq_number)}` : '',
        `Version ${this.formatValue(boq.version) || 1}`,
        this.dateText(boq.date),
      ]
        .filter(Boolean)
        .join(' · '),
      lastCol: LAST,
    });
    sheet.getRow(4).height = 8;
    setWidths(sheet, [8, 48, 22, 10, 12, 16, 18]);

    const header = sheet.getRow(HEADER);
    header.values = [
      'S.No',
      'Description',
      'Location',
      'Unit',
      'Quantity',
      'Rate',
      'Amount',
    ];
    styleHeaderRow(header, 1, LAST);
    [5, 6, 7].forEach(
      (c) =>
        (header.getCell(c).alignment = {
          ...header.getCell(c).alignment,
          horizontal: 'right',
        }),
    );

    const money = { 6: INR_FORMAT, 7: INR_FORMAT, 5: QTY_FORMAT };
    let r = HEADER;
    let sno = 0;
    const addItem = (item: BoqItemJSON) => {
      sno += 1;
      const row = sheet.getRow(++r);
      row.values = [
        sno,
        this.itemLabel(item),
        this.formatValue(item.location) || null,
        this.formatValue(item.unit) || null,
        this.num(item.quantity),
        this.num(item.rate),
        this.num(item.amount),
      ];
      styleBodyRow(row, 1, LAST, money);
      row.getCell(1).alignment = { vertical: 'top', horizontal: 'center' };
    };

    const categories = [...(boq.categories ?? [])].sort(
      (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
    );
    const grouped = categories.some((c) => (c.items ?? []).length);
    if (grouped) {
      for (const cat of categories) {
        const items = cat.items ?? [];
        if (!items.length) continue;
        const catRow = sheet.getRow(++r);
        catRow.getCell(2).value = this.formatValue(cat.name);
        styleGroupRow(catRow, 1, LAST);
        items.forEach(addItem);
        const sub = sheet.getRow(++r);
        sub.getCell(2).value = `Subtotal — ${this.formatValue(cat.name)}`;
        sub.getCell(7).value = this.num(
          cat.subtotal ??
            items.reduce((s, i) => s + (this.num(i.amount) ?? 0), 0),
        );
        styleTotalsRow(sub, 1, LAST, { formats: money });
      }
    } else {
      (boq.items ?? []).forEach(addItem);
    }
    const lastItemRow = r;

    // ---- Miscellaneous (free-form named entries, e.g. Contingency) ----
    const miscRows = boq.miscellaneous ?? [];
    r += 1;
    if (miscRows.length) {
      const miscHead = sheet.getRow(++r);
      miscHead.getCell(2).value = 'Miscellaneous';
      styleGroupRow(miscHead, 1, LAST);
      miscRows.forEach((m) => {
        const row = sheet.getRow(++r);
        row.getCell(2).value = this.formatValue(
          m.notes ? `${m.name} (${m.notes})` : m.name,
        );
        row.getCell(7).value = this.num(m.value);
        styleBodyRow(row, 1, LAST, money);
      });
      const miscTotal = sheet.getRow(++r);
      miscTotal.getCell(2).value = 'Miscellaneous Total';
      miscTotal.getCell(7).value = this.num(boq.misc_amount);
      styleTotalsRow(miscTotal, 1, LAST, { formats: money });
      r += 1;
    }

    const total = sheet.getRow(++r);
    total.getCell(2).value = 'Total Value';
    total.getCell(7).value = this.num(boq.total_value);
    styleTotalsRow(total, 1, LAST, { formats: money });
    const final = sheet.getRow(++r);
    final.getCell(2).value = 'Final Total';
    final.getCell(7).value = this.num(boq.final_total);
    styleTotalsRow(final, 1, LAST, { grand: true, formats: money });

    freezeAndFilter(sheet, HEADER, LAST, lastItemRow);
    brandPrint(sheet, {
      orientation: 'portrait',
      repeatRows: `${HEADER}:${HEADER}`,
      lastCol: LAST,
      lastRow: r,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      buffer: Buffer.from(buffer),
      filename: downloadName(
        [project?.name, 'BOQ', this.formatValue(boq.boq_number)],
        'export.xlsx',
        'BOQ',
      ),
    };
  }

  // ==================================================================== PDF
  // "Budget Breakdown" — the user's BOQ template (boq-budget-layout.ts, same code as the app's
  // components/commerce-documents/boqBudgetLayout.js, so server and in-app PDFs are identical).

  async toPdf(
    boqId: string,
    variant: PdfVariant,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const boq = await this.boqService.findOne(boqId);
    const html = this.generatePdfHtml(boq, variant, await this.termsHtml(boq));
    const browser = await this.launch();
    try {
      const page = await browser.newPage();
      await this.layout(page, html);
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });
      return {
        buffer: Buffer.from(pdf),
        filename: downloadName(
          [
            (boq.project as BoqProjectJSON | undefined)?.name,
            'BOQ',
            this.formatValue(boq.boq_number),
            variant,
          ],
          'export.pdf',
          'BOQ',
        ),
      };
    } finally {
      await browser.close();
    }
  }

  /** PNG of page one for the pre-export check. */
  async pageOneThumbnail(boqId: string, variant: PdfVariant): Promise<Buffer> {
    const boq = await this.boqService.findOne(boqId);
    const html = this.generatePdfHtml(boq, variant, await this.termsHtml(boq));
    const browser = await this.launch();
    try {
      const page = await browser.newPage();
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1,
      });
      await this.layout(page, html);
      const shot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: 794, height: 1123 },
      });
      return Buffer.from(shot);
    } finally {
      await browser.close();
    }
  }

  /** Load the flow, wait for fonts, then pack it onto A4 sheets in the page. */
  private async layout(page: puppeteer.Page, html: string) {
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate('document.fonts.ready');
    await page.evaluate(
      `(${paginateBudget.toString()})(document.querySelector('.bb-doc'))`,
    );
  }

  private launch() {
    return puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  /** BOQ terms, else the attached terms template (same rule as the in-app BOQ document). */
  private async termsHtml(boq: BoqJSON): Promise<string> {
    if (this.hasContent(boq.terms_html)) return boq.terms_html as string;
    const id = boq.terms_template_id as string | undefined;
    if (!id) return '';
    try {
      const tpl = await TermsTemplate.findByPk(id);
      return this.hasContent(tpl?.content_html) ? tpl!.content_html : '';
    } catch {
      return '';
    }
  }

  /** Unpaginated Budget Breakdown HTML (paginated in the browser by paginateBudget). */
  generatePdfHtml(boq: BoqJSON, variant: PdfVariant, terms = ''): string {
    return renderBudgetHtml(
      buildBudgetModel(boq, {
        variant,
        terms,
        monogramSrc: dataUri(brandLogo('monogram'), 'image/png'),
      }),
    );
  }

  private plainNotes(notes: unknown): string {
    return String((notes as string) || '')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/(?:p|div|li)>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }

  private itemLabel(item: BoqItemJSON): string {
    const name = item.name || '';
    const notes = this.plainNotes(item.notes);
    if (name && notes) return `${name} — ${notes}`;
    return name || notes || '';
  }

  private num(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private dateText(value: unknown): string {
    if (!value) return '';
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    const d =
      value instanceof Date
        ? value
        : new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s);
    if (Number.isNaN(d.getTime())) return this.formatValue(value);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      if (
        typeof value.toString === 'function' &&
        value.toString() !== '[object Object]'
      ) {
        return value.toString();
      }
      return (
        value.value ??
        value.amount ??
        value.total ??
        value.rate ??
        JSON.stringify(value)
      );
    }
    return String(value);
  }

  /** Safe check to avoid TS error on .trim() */
  private hasContent(value: any): boolean {
    if (typeof value !== 'string') return false;
    return value.trim().length > 0;
  }
}
