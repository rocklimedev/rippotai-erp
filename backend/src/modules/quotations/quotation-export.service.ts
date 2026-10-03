import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import ExcelJS from 'exceljs';
import { QuotationsService } from './quotations.service';
import { Unit } from '../metas/models/unit.model';

const parse = (v: any) => {
  if (!v) return {};
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return {};
  }
};
const n = (v: any) => (v === null || v === undefined || v === '' ? 0 : Number(v));

/** Excel export of a vendor quotation (procurement → estimates → detail). */
@Injectable()
export class QuotationExportService {
  constructor(
    private readonly quotationsService: QuotationsService,
    @InjectModel(Unit) private readonly unitModel: typeof Unit,
  ) {}

  async toExcel(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const q: any = (await this.quotationsService.findOne(id)) as any;
    const data = typeof q?.toJSON === 'function' ? q.toJSON() : q;
    const project = data.project || parse(data.projectSnapshot);
    const vendor = data.vendor || parse(data.vendorSnapshot);
    const items: any[] = [...(data.items || [])].sort(
      (a, b) => n(a.sno) - n(b.sno),
    );

    const unitIds = [...new Set(items.map((i) => i.unit_id).filter(Boolean))];
    const units = unitIds.length
      ? await this.unitModel.findAll({ where: { id: unitIds } as any })
      : [];
    const unitName = new Map(units.map((u: any) => [u.id, u.code || u.name]));

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Rippotai ERP';
    wb.created = new Date();
    const ws = wb.addWorksheet('Quotation', {
      views: [{ state: 'frozen', ySplit: 8 }],
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    ws.columns = [
      { key: 'sno', width: 7 },
      { key: 'particular', width: 48 },
      { key: 'unit', width: 10 },
      { key: 'quantity', width: 12 },
      { key: 'rate', width: 14 },
      { key: 'amount', width: 16 },
      { key: 'remarks', width: 28 },
    ];
    const green = 'FF1F453B';
    const sage = 'FFE9EFEA';

    ws.mergeCells('A1:G1');
    ws.getCell('A1').value = `Quotation ${data.quotationNumber || ''}`.trim();
    ws.getCell('A1').font = { bold: true, size: 14, color: { argb: green } };

    const meta: [string, any][] = [
      ['Vendor', vendor.company_name || vendor.name || ''],
      ['Project', project.name || ''],
      ['Site', project.site_location || ''],
      ['Date / valid till', [data.quotationDate, data.expiryDate].filter(Boolean).join(' → ')],
      ['Status', String(data.status || '').replace(/_/g, ' ')],
    ];
    meta.forEach(([k, v], i) => {
      const r = ws.getRow(2 + i);
      r.getCell(1).value = k;
      r.getCell(1).font = { color: { argb: 'FF6B7B7C' } };
      ws.mergeCells(2 + i, 2, 2 + i, 7);
      r.getCell(2).value = v;
    });

    const head = ws.getRow(8);
    head.values = ['S.No', 'Particular', 'Unit', 'Qty', 'Rate (₹)', 'Amount (₹)', 'Remarks'];
    head.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: green } };
      c.alignment = { vertical: 'middle' };
    });

    const first = 9;
    items.forEach((it, i) => {
      const r = ws.getRow(first + i);
      r.values = [
        it.sno ?? i + 1,
        it.particular || '',
        unitName.get(it.unit_id) || '',
        n(it.quantity),
        n(it.rate),
        null,
        it.remarks || '',
      ];
      r.getCell(6).value = { formula: `D${first + i}*E${first + i}`, result: n(it.amount) } as any;
      r.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    });
    const last = first + Math.max(items.length, 1) - 1;
    ['D', 'E', 'F'].forEach((col) => {
      for (let r = first; r <= last; r++) ws.getCell(`${col}${r}`).numFmt = col === 'D' ? '#,##0.###' : '#,##,##0.00';
    });

    let row = last + 2;
    const totals: [string, any, boolean?][] = [
      ['Subtotal', { formula: `SUM(F${first}:F${last})`, result: n(data.subtotal) }],
      ['Additional charges', n(data.additionalCharges)],
      ['Discount', -n(data.discount)],
      [`GST @ ${n(data.taxPercent)}%`, n(data.taxAmount)],
      ['Total', n(data.totalAmount), true],
    ];
    totals.forEach(([label, value, grand]) => {
      if (!grand && label !== 'Subtotal' && !Number(value)) return;
      const r = ws.getRow(row++);
      ws.mergeCells(r.number, 1, r.number, 5);
      r.getCell(1).value = label;
      r.getCell(1).alignment = { horizontal: 'right' };
      r.getCell(6).value = value;
      r.getCell(6).numFmt = '#,##,##0.00';
      if (grand) {
        r.font = { bold: true, color: { argb: green } };
        r.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sage } };
      }
    });

    if (data.termsConditions) {
      row += 1;
      ws.getCell(`A${row}`).value = 'Terms & conditions';
      ws.getCell(`A${row}`).font = { bold: true };
      String(data.termsConditions)
        .replace(/<[^>]+>/g, '\n')
        .split(/\n+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => {
          row += 1;
          ws.mergeCells(row, 1, row, 7);
          ws.getCell(`A${row}`).value = t;
          ws.getCell(`A${row}`).alignment = { wrapText: true };
        });
    }

    const buffer = Buffer.from(await wb.xlsx.writeBuffer());
    const safe = String(data.quotationNumber || id).replace(/[^A-Za-z0-9_-]+/g, '-');
    return { buffer, filename: `Quotation_${safe}.xlsx` };
  }
}
