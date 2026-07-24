import { Injectable } from '@nestjs/common';
import {
  BoqService,
  BoqJSON,
  BoqItemJSON,
  BoqCategoryJSON,
} from './boq.service';
import * as puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';

export type PdfVariant =
  | 'internal'
  | 'client'
  | 'quantity_only'
  | 'vendor_enquiry';

interface CompanyProfile {
  name: string;
  logoUrl: string | null;
}

// Extended interface to fix type issues
interface BoqProjectJSON {
  name?: string;
  site_location?: string;
}

@Injectable()
export class BoqExportService {
  constructor(private readonly boqService: BoqService) {}

  async toExcel(boqId: string): Promise<{ buffer: Buffer; filename: string }> {
    const boq = await this.boqService.findOne(boqId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Rippotai ERP';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('BOQ');

    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 10 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Location', key: 'location', width: 25 },
      { header: 'Unit', key: 'unit', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Rate', key: 'rate', width: 15 },
      { header: 'Amount', key: 'amount', width: 20 },
    ];

    sheet.addRow([this.formatValue(boq.title)]);
    sheet.addRow([`BOQ Number: ${this.formatValue(boq.boq_number)}`]);
    sheet.addRow([`Version: ${this.formatValue(boq.version)}`]);
    sheet.addRow([]);

    const headerRow = sheet.getRow(5);
    headerRow.font = { bold: true };

    const items = boq.items ?? [];
    items.forEach((item, index) => {
      sheet.addRow({
        sno: index + 1,
        description: this.formatValue(this.itemLabel(item)),
        location: this.formatValue(item.location),
        unit: this.formatValue(item.unit),
        quantity: this.formatValue(item.quantity),
        rate: this.formatValue(item.rate),
        amount: this.formatValue(item.amount),
      });
    });

    sheet.addRow([]);
    sheet.addRow({
      description: 'Total Value',
      amount: this.formatValue(boq.total_value),
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      buffer: Buffer.from(buffer),
      filename: `${this.formatValue(boq.boq_number || boq.id)}.xlsx`,
    };
  }

  async toPdf(
    boqId: string,
    variant: PdfVariant,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const boq = await this.boqService.findOne(boqId);
    const html = this.generatePdfHtml(boq, variant);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
      });

      return {
        buffer: Buffer.from(pdf),
        filename: `${this.formatValue(boq.boq_number || boq.id)}-${variant}.pdf`,
      };
    } finally {
      await browser.close();
    }
  }

  async pageOneThumbnail(boqId: string, variant: PdfVariant): Promise<Buffer> {
    const { buffer } = await this.toPdf(boqId, variant);
    return buffer;
  }

  // ---------- HTML template ----------

  private generatePdfHtml(boq: BoqJSON, variant: PdfVariant): string {
    const hidePrice =
      variant === 'quantity_only' || variant === 'vendor_enquiry';
    const company = this.getCompanyProfile();

    const categories = this.categoriesForVariant(boq, variant);
    const date = boq.date
      ? this.formatValue(boq.date)
      : new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

    const project = boq.project as BoqProjectJSON | undefined;
    const projectName = project?.name || boq.title;
    const projectLocation = boq.location || project?.site_location;

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    color: #333333;
    margin: 0;
  }
  .section { padding: 0 4mm; }
  .page-break { page-break-before: always; }

  /* ---- Cover: logo / title / meta ---- */
  .cover-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 10px;
  }
.logo-box {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.logo-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
  .title-block { text-align: right; }
  .title-block h1 {
    font-size: 22px;
    margin: 0;
    line-height: 1.15;
  }
  .title-block .date { font-size: 11px; color: #6B7B7C; margin-top: 4px; }

  .divider-dashed {
    border: none;
    border-top: 1.5px dashed #B5C4B6;
    margin: 10px 0 14px;
  }

  .meta-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 18px;
  }
  .meta-left { flex: 1; }
  .meta-left .line { margin: 2px 0; }
  .meta-left .label { color: #6B7B7C; font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; }
  .meta-divider {
    width: 1px;
    align-self: stretch;
    background: #B5C4B6;
    margin: 0 18px;
  }
  .meta-right { min-width: 140px; text-align: left; }
  .meta-right .label { color: #6B7B7C; font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; }
  .meta-right .value { font-size: 16px; font-weight: bold; margin-top: 3px; }

  /* ---- Table ---- */
  table { width: 100%; border-collapse: collapse; }
  thead th {
    background: #EAEEF0;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: #6B7B7C;
    text-align: left;
    border-bottom: 1.5px solid #B5C4B6;
    padding: 6px 5px;
  }
  td {
    border-bottom: 1px solid #E1E6E2;
    padding: 5px 5px;
    vertical-align: top;
  }
  td.num, th.num { text-align: right; }
  td.center, th.center { text-align: center; }
  tr.cat-row td {
    background: #F4F6F4;
    font-weight: bold;
    padding-top: 9px;
  }
  tr.subtotal-row td {
    border-top: 1px solid #B5C4B6;
    border-bottom: none;
    font-weight: bold;
    color: #1F453B;
  }
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }

  /* ---- Financial / meta summary ---- */
  .summary-box {
    margin-top: 22px;
    border: 1px solid #B5C4B6;
    border-radius: 8px;
    padding: 14px 16px;
    page-break-inside: avoid;
  }
  .summary-box h3 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: #6B7B7C;
    margin: 0 0 10px;
  }
  .summary-line {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
  }
  .summary-line.total {
    border-top: 1.5px solid #333333;
    margin-top: 6px;
    padding-top: 8px;
    font-size: 15px;
    font-weight: bold;
  }

  /* ---- Terms & Conditions (final page) ---- */
  .tc-page h2 {
    font-size: 16px;
    border-bottom: 2px solid #333333;
    padding-bottom: 6px;
    margin-bottom: 14px;
  }
  .tc-body { font-size: 12px; line-height: 1.6; }

  .footer {
    margin-top: 30px;
    font-size: 10px;
    color: #B5C4B6;
    text-align: center;
  }
</style>
</head>
<body>

  <!-- ===== Page 1: cover + meta ===== -->
  <div class="section">
    <div class="cover-header">
      <div class="logo-box">
<img
  src="https://media.cmtradingco.com/rippotai_projects/rippotai_logo.png"
  alt="Company Logo"
/>
      </div>
      <div class="title-block">
<h1 className="text-[calc(100%+12px)]">
  <span className="block">Budget</span>
  <span className="block">Breakdown</span>
</h1>
        <div class="date">${this.formatValue(date)}</div>
      </div>
    </div>

    <hr class="divider-dashed" />

    <div class="meta-row">
      <div class="meta-left">
        <div class="line">${this.formatValue(projectName)}</div>
        <div class="line">${this.formatValue(projectLocation)}</div>
      </div>
      <div class="meta-divider"></div>
      <div class="meta-right">
        <div class="label">Estimate Total</div>
        <div class="value">${this.formatCurrency(boq.final_total)}</div>
      </div>
    </div>

    <!-- ===== Line items table ===== -->
    <table>
      <thead>
        <tr>
          <th class="center" style="width:34px;">S.No</th>
          <th>Description</th>
          <th style="width:90px;">Location</th>
          <th style="width:70px;">Unit</th>
          <th class="num" style="width:60px;">Qty</th>
          ${hidePrice ? '' : '<th class="num" style="width:80px;">Rate</th><th class="num" style="width:95px;">Amount</th>'}
        </tr>
      </thead>
      <tbody>
        ${this.renderCategoryRows(categories, hidePrice)}
      </tbody>
    </table>

    <!-- ===== Financial / meta summary ===== -->
    ${hidePrice ? '' : this.renderSummaryBox(boq)}


  </div>

  <!-- ===== Last page: Terms & Conditions ===== -->
  <div class="section page-break tc-page">
    <h2>Terms &amp; Conditions</h2>
    <div class="tc-body">
      ${
        this.hasContent(boq.terms_html)
          ? boq.terms_html
          : '<p style="color:#B5C4B6;">No terms have been added to this BOQ yet.</p>'
      }
    </div>
  </div>

</body>
</html>
`;
  }

  private renderCategoryRows(
    categories: BoqCategoryJSON[],
    hidePrice: boolean,
  ): string {
    let sno = 0;
    const colspan = hidePrice ? 5 : 7;

    return categories
      .map((cat) => {
        const itemRows = (cat.items ?? [])
          .map((item) => {
            sno += 1;
            return `
              <tr>
                <td class="center">${sno}</td>
                <td>${this.formatValue(this.itemLabel(item))}</td>
                <td>${this.formatValue(item.location)}</td>
                <td>${this.formatValue(item.unit)}</td>
                <td class="num">${this.formatValue(item.quantity)}</td>
                ${
                  hidePrice
                    ? ''
                    : `<td class="num">${this.formatCurrency(item.rate)}</td>
                       <td class="num">${this.formatCurrency(item.amount)}</td>`
                }
              </tr>`;
          })
          .join('');

        const subtotalRow = hidePrice
          ? ''
          : `
              <tr class="subtotal-row">
                <td colspan="${colspan - 1}" style="text-align:right;">Subtotal — ${this.formatValue(cat.name)}</td>
                <td class="num">${this.formatCurrency(cat.subtotal)}</td>
              </tr>`;

        return `
          <tr class="cat-row">
            <td colspan="${colspan}">${this.formatValue(cat.name)}</td>
          </tr>
          ${itemRows}
          ${subtotalRow}
        `;
      })
      .join('');
  }

  private renderSummaryBox(boq: BoqJSON): string {
    const extras: Array<[string, unknown]> = [
      ['Design Amount', boq.design_amount],
      ['Execution Amount', boq.execution_amount],
      ['Supervisor Amount', boq.supervisor_amount],
      ['Additional Total', boq.additional_total],
    ].filter(([, v]) => Number(v || 0) !== 0) as Array<[string, unknown]>;

    return `
  <div class="summary-box">
    <h3>Cost Summary</h3>
    <div class="summary-line"><span>Project Total</span><span>${this.formatCurrency(boq.project_total)}</span></div>
    ${extras
      .map(
        ([label, val]) =>
          `<div class="summary-line"><span>${label}</span><span>${this.formatCurrency(val)}</span></div>`,
      )
      .join('')}

    <!-- <div class="summary-line">
      <span>Miscellaneous (${this.formatValue(boq.misc_pct)}%)</span>
      <span>${this.formatCurrency(boq.misc_amount)}</span>
    </div> -->

    <div class="summary-line total"><span>Final Total</span><span>${this.formatCurrency(boq.final_total)}</span></div>
  </div>
`;
  }

  private categoriesForVariant(
    boq: BoqJSON,
    variant: PdfVariant,
  ): BoqCategoryJSON[] {
    const categories = boq.categories ?? [];
    if (variant !== 'client') return categories;

    return categories
      .map((cat) => ({
        ...cat,
        items: (cat.items ?? []).filter((i) => !i.hidden),
      }))
      .filter((cat) => (cat.items ?? []).length > 0);
  }

  private itemLabel(item: BoqItemJSON): string {
    const name = (item.name as string) || '';
    const notes = (item.notes as string) || '';
    if (name && notes) return `${name} — ${notes}`;
    return name || notes || '';
  }

  private getCompanyProfile(): CompanyProfile {
    return { name: 'Rippotai ERP', logoUrl: null };
  }

  private formatCurrency(value: any): string {
    const n = Number(value ?? 0);
    if (Number.isNaN(n)) return this.formatValue(value);
    return `₹ ${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
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
