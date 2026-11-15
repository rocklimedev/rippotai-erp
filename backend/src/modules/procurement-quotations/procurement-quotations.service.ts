import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, Transaction } from 'sequelize';
import { Project } from '../projects/models/projects.model';
import { Vendor } from '../vendors/models/vendors.model';
import { VendorRateComparison } from '../material-procurement/models/vendor-rate-comparison.model';
import { MaterialMaster } from '../material-procurement/models/material-master.model';
import { PurchaseOrder } from '../material-procurement/models/purchase-order.model';
import { WorkOrder } from '../material-procurement/models/work-order.model';
import { Unit } from '../metas/models/unit.model';
import { PurchaseOrderService } from '../material-procurement/services/purchase-order.service';
import { WorkOrdersService } from '../material-procurement/services/work-orders.service';
import { SharedProjectDataService } from '../documents/shared-project-data.service';
import {
  ProcurementQuotation,
  ProcurementQuotationStatus,
  QuotationVendorKind,
} from './models/procurement-quotation.model';
import { ProcurementQuotationItem } from './models/procurement-quotation-item.model';
import { ProcurementQuotationVersion } from './models/procurement-quotation-version.model';
import {
  CreateProcurementQuotationDto,
  QuotationFromComparisonDto,
  QuotationItemDto,
  SaveProcurementQuotationDto,
} from './dto/procurement-quotation.dto';

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const has = (v: unknown) =>
  (typeof v === 'string' && v.trim() !== '') ||
  (typeof v === 'number' && Number.isFinite(v));
const today = () => new Date().toISOString().slice(0, 10);

/** A quotation that is no longer "live" for its project + vendor. */
const CLOSED = [
  ProcurementQuotationStatus.REJECTED,
  ProcurementQuotationStatus.CANCELLED,
];

/** Template default (QUOTATION TEMPLATE: Terms & Conditions, clause 1). */
export const QUOTATION_DEFAULT_TERMS =
  'Final payment will be made after satisfactory completion of work.';

export type QuotationLine = Required<
  Pick<QuotationItemDto, 'item_name' | 'quantity' | 'rate'>
> &
  QuotationItemDto;

/** Lines of one finalised vendor from a comparison snapshot (pure, unit-tested). */
export function linesFromComparison(
  snapshot: Record<string, any>,
  vendorId: string,
  taxPercent = 0,
): QuotationLine[] {
  const finalised: Record<string, string> = snapshot?.finalised_vendors ?? {};
  const rates: Record<string, unknown> = snapshot?.vendor_rates ?? {};
  const rows: any[] = Array.isArray(snapshot?.rows) ? snapshot.rows : [];
  const lines: QuotationLine[] = [];
  for (const category of snapshot?.boq?.categories ?? []) {
    if (String(finalised[category.id] ?? '') !== String(vendorId)) continue;
    for (const item of category.items ?? []) {
      const row = rows.find((r) => String(r.item_id) === String(item.id));
      const quoted = row?.quotes?.find(
        (q: any) => String(q.vendor_id) === String(vendorId),
      )?.rate;
      const stored = rates[`${item.id}__${vendorId}`];
      const rate = Number(
        stored !== undefined && stored !== '' ? stored : (quoted ?? 0),
      );
      if (!(rate > 0)) continue;
      const spec = has(item.specification) && item.specification !== '-';
      lines.push({
        category_name: category.name || undefined,
        item_name: String(item.description || 'Item').slice(0, 500),
        description: spec ? String(item.specification) : undefined,
        unit:
          has(item.unit) && item.unit !== '-' ? String(item.unit) : undefined,
        quantity: Number(item.quantity) || 0,
        rate,
        tax_percent: taxPercent,
        source_item_id: String(item.id).slice(0, 100),
      });
    }
  }
  return lines;
}

/** Amount, tax and totals of a set of lines. */
export function quotationTotals(lines: QuotationItemDto[]) {
  const rows = lines.map((l) => {
    const qty = Number(l.quantity) || 0;
    const amount = round2(qty > 0 ? qty * Number(l.rate) : Number(l.rate));
    const tax = round2((amount * Number(l.tax_percent || 0)) / 100);
    return { amount, tax };
  });
  const subtotal = round2(rows.reduce((s, r) => s + r.amount, 0));
  const tax = round2(rows.reduce((s, r) => s + r.tax, 0));
  return { rows, subtotal, tax, total: round2(subtotal + tax) };
}

const vendorKindOf = (vendor: any): QuotationVendorKind =>
  /contract|labou?r/i.test(
    `${vendor?.vendorCategory?.name ?? ''} ${vendor?.businessType?.name ?? ''}`,
  ) && !/^material/i.test(vendor?.vendorCategory?.name ?? '')
    ? QuotationVendorKind.LABOUR
    : QuotationVendorKind.MATERIAL;

@Injectable()
export class ProcurementQuotationsService {
  constructor(
    @InjectModel(ProcurementQuotation)
    private readonly quotations: typeof ProcurementQuotation,
    @InjectModel(ProcurementQuotationItem)
    private readonly items: typeof ProcurementQuotationItem,
    @InjectModel(ProcurementQuotationVersion)
    private readonly versions: typeof ProcurementQuotationVersion,
    @InjectModel(Project) private readonly projects: typeof Project,
    @InjectModel(Vendor) private readonly vendors: typeof Vendor,
    @InjectModel(VendorRateComparison)
    private readonly comparisons: typeof VendorRateComparison,
    @InjectModel(MaterialMaster)
    private readonly materials: typeof MaterialMaster,
    @InjectModel(Unit) private readonly units: typeof Unit,
    @InjectModel(PurchaseOrder)
    private readonly purchaseOrders: typeof PurchaseOrder,
    @InjectModel(WorkOrder) private readonly workOrders: typeof WorkOrder,
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly workOrdersService: WorkOrdersService,
    private readonly shared: SharedProjectDataService,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  // ------------------------------------------------------------------ read
  list(filter: { projectId?: string; vendorId?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (filter.projectId) where.project_id = filter.projectId;
    if (filter.vendorId) where.vendor_id = filter.vendorId;
    if (filter.status) where.status = filter.status;
    return this.quotations.findAll({
      where,
      attributes: { exclude: ['payment_terms', 'terms', 'notes'] },
      include: [
        { model: Project, attributes: ['id', 'name'] },
        { model: Vendor, attributes: ['id', 'name', 'company_name'] },
      ],
      order: [['updated_at', 'DESC']],
    });
  }

  async get(id: string, transaction?: Transaction) {
    const quotation = await this.quotations.findByPk(id, {
      transaction,
      include: [
        { model: ProcurementQuotationItem, as: 'items' },
        {
          model: Project,
          attributes: ['id', 'name', 'site_location', 'client_id'],
        },
        {
          model: Vendor,
          attributes: ['id', 'name', 'company_name', 'contact_number'],
        },
      ],
      order: [
        [{ model: ProcurementQuotationItem, as: 'items' }, 'sort_order', 'ASC'],
      ],
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    const json = quotation.toJSON();
    const [comparison, po, wo, history] = await Promise.all([
      quotation.comparison_id
        ? this.comparisons.findByPk(quotation.comparison_id, {
            attributes: ['id', 'title'],
            transaction,
          })
        : null,
      quotation.purchase_order_id
        ? this.purchaseOrders.findByPk(quotation.purchase_order_id, {
            attributes: ['id', 'po_number', 'status'],
            transaction,
          })
        : null,
      quotation.work_order_id
        ? this.workOrders.findByPk(quotation.work_order_id, {
            attributes: ['id', 'wo_id', 'status'],
            transaction,
          })
        : null,
      this.versions.findAll({
        where: { quotation_id: id },
        attributes: ['id', 'version', 'created_at', 'created_by'],
        order: [['version', 'DESC']],
        transaction,
      }),
    ]);
    json.comparison = comparison;
    json.purchase_order = po;
    json.work_order = wo;
    json.history = history;
    return json;
  }

  async getVersion(id: string, version: number) {
    const row = await this.versions.findOne({
      where: { quotation_id: id, version },
    });
    if (!row) throw new NotFoundException('Version not found');
    return row;
  }

  // ------------------------------------------------------------ autofill
  /** Vendor + project/site/client facts for a new quotation. */
  private async autofill(projectId: string, vendorId: string) {
    const [project, vendor] = await Promise.all([
      this.projects.findByPk(projectId),
      this.vendors.findByPk(vendorId, {
        include: ['vendorCategory', 'businessType'],
      }),
    ]);
    if (!project) throw new BadRequestException('Project not found');
    if (!vendor) throw new BadRequestException('Vendor not found');
    let facts: Record<string, any> = {};
    try {
      facts = await this.shared.fetch(projectId);
    } catch {
      facts = {};
    }
    const v = vendor as any;
    const kind = vendorKindOf(v);
    return {
      vendor_kind: kind,
      vendor_name: vendor.company_name || vendor.name,
      vendor_type: [
        kind === QuotationVendorKind.LABOUR ? 'Labour' : 'Material',
        v.businessType?.name,
      ]
        .filter(has)
        .join(' · '),
      vendor_phone: vendor.contact_number || null,
      vendor_address:
        [vendor.address, (vendor as any).state].filter(has).join(', ') || null,
      project_name: facts.projectName || project.name,
      project_address: facts.siteAddress || project.site_location || null,
      client_name: facts.clientName || null,
    };
  }

  private async nextNumber(transaction?: Transaction) {
    const year = new Date().getFullYear();
    const prefix = `QTN-${year}-`;
    const latest = await this.quotations.findOne({
      where: { quotation_number: { [Op.like]: `${prefix}%` } },
      order: [['quotation_number', 'DESC']],
      transaction,
    });
    const last = latest
      ? Number(latest.quotation_number.slice(prefix.length)) || 0
      : 0;
    return `${prefix}${String(last + 1).padStart(4, '0')}`;
  }

  private async liveFor(projectId: string, vendorId: string) {
    return this.quotations.findOne({
      where: {
        project_id: projectId,
        vendor_id: vendorId,
        status: { [Op.notIn]: CLOSED },
      },
      order: [['updated_at', 'DESC']],
    });
  }

  private async writeLines(
    quotationId: string,
    lines: QuotationItemDto[],
    transaction: Transaction,
  ) {
    const totals = quotationTotals(lines);
    await this.items.destroy({
      where: { quotation_id: quotationId },
      transaction,
    });
    await this.items.bulkCreate(
      lines.map((l, i) => ({
        quotation_id: quotationId,
        sort_order: i + 1,
        category_name: l.category_name || null,
        item_name: l.item_name,
        description: l.description || null,
        unit: l.unit || null,
        quantity: Number(l.quantity) || 0,
        rate: Number(l.rate) || 0,
        amount: totals.rows[i].amount,
        tax_percent: Number(l.tax_percent || 0),
        tax_amount: totals.rows[i].tax,
        remarks: l.remarks || null,
        source_item_id: l.source_item_id || null,
        material_id: l.material_id || null,
      })),
      { transaction },
    );
    return totals;
  }

  private header(dto: SaveProcurementQuotationDto) {
    const out: Record<string, unknown> = {};
    for (const key of [
      'vendor_kind',
      'quotation_date',
      'valid_until',
      'vendor_name',
      'vendor_type',
      'vendor_phone',
      'vendor_address',
      'project_name',
      'project_address',
      'client_name',
      'terms',
      'notes',
      'payment_terms',
    ] as const)
      if (dto[key] !== undefined) out[key] = dto[key];
    if (out.valid_until === '') out.valid_until = null;
    return out;
  }

  // ---------------------------------------------------------------- write
  /** New quotation — or, when one is live for this project + vendor, its next version. */
  async create(dto: CreateProcurementQuotationDto, userId: string) {
    const live = await this.liveFor(dto.project_id, dto.vendor_id);
    if (live) {
      const { project_id: _p, vendor_id: _v, ...rest } = dto;
      void _p;
      void _v;
      return this.update(live.id, { ...rest, version: undefined }, userId);
    }
    const facts = await this.autofill(dto.project_id, dto.vendor_id);
    const id = await this.sequelize.transaction(async (transaction) => {
      const quotation = await this.quotations.create(
        {
          quotation_number: await this.nextNumber(transaction),
          project_id: dto.project_id,
          vendor_id: dto.vendor_id,
          status: ProcurementQuotationStatus.DRAFT,
          version: 1,
          quotation_date: today(),
          terms: QUOTATION_DEFAULT_TERMS,
          ...facts,
          ...this.header(dto),
          created_by: userId,
          updated_by: userId,
        },
        { transaction },
      );
      const totals = await this.writeLines(
        quotation.id,
        dto.items ?? [],
        transaction,
      );
      await quotation.update(
        {
          subtotal: totals.subtotal,
          tax_amount: totals.tax,
          total_amount: totals.total,
        },
        { transaction },
      );
      return quotation.id;
    });
    return this.get(id);
  }

  /** Save an edit: the current state is frozen as a version, then replaced. */
  async update(id: string, dto: SaveProcurementQuotationDto, userId: string) {
    await this.sequelize.transaction(async (transaction) => {
      const current = await this.get(id, transaction);
      if (dto.version && dto.version !== current.version)
        throw new ConflictException(
          'This quotation was changed elsewhere. Reload it before saving.',
        );
      const {
        history: _h,
        comparison: _c,
        purchase_order: _po,
        work_order: _wo,
        project: _pr,
        vendor: _ve,
        ...snapshot
      } = current;
      void [_h, _c, _po, _wo, _pr, _ve];
      await this.versions.create(
        {
          quotation_id: id,
          version: current.version,
          snapshot,
          created_by: userId,
        },
        { transaction },
      );
      const patch: Record<string, unknown> = {
        ...this.header(dto),
        version: current.version + 1,
        updated_by: userId,
      };
      // An edited quotation goes back to draft unless it was already ordered.
      if (
        current.status !== ProcurementQuotationStatus.ORDERED &&
        current.status !== ProcurementQuotationStatus.DRAFT
      ) {
        patch.status = ProcurementQuotationStatus.DRAFT;
        patch.approved_by = null;
        patch.approved_at = null;
      }
      if (dto.items) {
        const totals = await this.writeLines(id, dto.items, transaction);
        Object.assign(patch, {
          subtotal: totals.subtotal,
          tax_amount: totals.tax,
          total_amount: totals.total,
        });
      }
      await this.quotations.update(patch, { where: { id }, transaction });
    });
    return this.get(id);
  }

  async fromComparison(dto: QuotationFromComparisonDto, userId: string) {
    const sheet = await this.comparisons.findByPk(dto.comparison_id);
    if (!sheet) throw new NotFoundException('Vendor comparison not found');
    const snapshot = sheet.snapshot ?? {};
    const finalised = Object.values(snapshot.finalised_vendors ?? {});
    if (!finalised.includes(dto.vendor_id))
      throw new BadRequestException(
        'Finalise this vendor for at least one category of the comparison first.',
      );
    const lines = linesFromComparison(
      snapshot,
      dto.vendor_id,
      dto.tax_percent ?? 0,
    );
    if (!lines.length)
      throw new BadRequestException(
        'The finalised vendor has no quoted rates in its categories.',
      );
    const live = await this.liveFor(sheet.project_id, dto.vendor_id);
    const quotation = live
      ? await this.update(live.id, { items: lines }, userId)
      : await this.create(
          {
            project_id: sheet.project_id,
            vendor_id: dto.vendor_id,
            items: lines,
          },
          userId,
        );
    await this.quotations.update(
      { comparison_id: sheet.id },
      { where: { id: quotation.id } },
    );
    return { ...quotation, comparison_id: sheet.id, refilled: Boolean(live) };
  }

  async setStatus(
    id: string,
    status: ProcurementQuotationStatus,
    userId: string,
  ) {
    const quotation = await this.quotations.findByPk(id);
    if (!quotation) throw new NotFoundException('Quotation not found');
    const approved = status === ProcurementQuotationStatus.APPROVED;
    await quotation.update({
      status,
      approved_by: approved ? userId : quotation.approved_by,
      approved_at: approved ? new Date() : quotation.approved_at,
      updated_by: userId,
    });
    return this.get(id);
  }

  async remove(id: string) {
    const quotation = await this.quotations.findByPk(id);
    if (!quotation) throw new NotFoundException('Quotation not found');
    await quotation.destroy();
    return { success: true, id };
  }

  // ------------------------------------------------------- raise PO / WO
  private assertOrderable(q: Record<string, any>) {
    if (CLOSED.includes(q.status))
      throw new BadRequestException(
        `A ${String(q.status).toLowerCase()} quotation cannot be ordered.`,
      );
    if (!q.items?.length)
      throw new BadRequestException('The quotation has no lines.');
  }

  /** Effective single GST % for PO / WO headers (they carry one rate). */
  private gstPercent(q: Record<string, any>) {
    const sub = Number(q.subtotal) || 0;
    return sub > 0 ? round2((Number(q.tax_amount) / sub) * 100) : 0;
  }

  private async unitFor(code?: string | null) {
    const all = await this.units.findAll({ where: { is_active: true } });
    const norm = (s: string | null | undefined) =>
      (s ?? '').toLowerCase().replace(/[^a-z]/g, '');
    const alias: Record<string, string> = {
      sqft: 'sqft',
      sft: 'sqft',
      sqm: 'sqm',
      rmt: 'rmt',
      rft: 'rft',
      no: 'nos',
      nos: 'nos',
      each: 'nos',
      pcs: 'nos',
      kg: 'kg',
      ltr: 'ltr',
      l: 'ltr',
      cum: 'cum',
      cft: 'cft',
      ls: 'ls',
      lumpsum: 'ls',
      set: 'set',
      bag: 'bag',
      box: 'box',
      day: 'day',
      point: 'pt',
      pt: 'pt',
    };
    const key = alias[norm(code)] ?? norm(code);
    return (
      all.find((u) => norm(u.code) === key || norm(u.name) === key) ??
      all.find((u) => norm(u.code) === 'nos') ??
      all[0] ??
      null
    );
  }

  /** Material master entry for a line: linked, same name, or added. */
  private async materialFor(line: Record<string, any>, n: number) {
    if (line.material_id) {
      const linked = await this.materials.findByPk(line.material_id);
      if (linked?.is_active) return linked;
    }
    const same = await this.materials.findOne({
      where: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('name')),
        String(line.item_name).trim().toLowerCase(),
      ),
    });
    if (same?.is_active) return same;
    const unit = await this.unitFor(line.unit);
    return this.materials.create({
      material_code: `MAT-Q${Date.now().toString(36).toUpperCase()}${n}`,
      name: String(line.item_name).slice(0, 255),
      category: line.category_name || null,
      specification: line.description || null,
      unit_id: unit?.id ?? null,
      is_active: true,
    });
  }

  async raisePurchaseOrder(id: string, userId: string) {
    const q = await this.get(id);
    if (q.vendor_kind !== QuotationVendorKind.MATERIAL)
      throw new BadRequestException(
        'This is a labour quotation — raise a Work Order instead.',
      );
    if (q.purchase_order) return { id: q.purchase_order.id, existing: true };
    this.assertOrderable(q);
    const lines: any[] = q.items;
    const items: any[] = [];
    for (const [i, line] of lines.entries()) {
      const material = await this.materialFor(line, i);
      if (line.material_id !== material.id)
        await this.items.update(
          { material_id: material.id },
          { where: { id: line.id } },
        );
      items.push({
        material_id: material.id,
        description: String(line.item_name).slice(0, 500),
        specification: line.description || undefined,
        unit: line.unit || undefined,
        ordered_quantity: Number(line.quantity) > 0 ? Number(line.quantity) : 1,
        rate:
          Number(line.quantity) > 0 ? Number(line.rate) : Number(line.amount),
        remarks: line.remarks || undefined,
      });
    }
    const po = await this.purchaseOrderService.create(
      {
        project_id: q.project_id,
        vendor_id: q.vendor_id,
        po_date: today(),
        agency_name: q.vendor_name || undefined,
        phone: q.vendor_phone || undefined,
        ship_to_address: q.project_address || undefined,
        gst_percent: this.gstPercent(q),
        source_reference_id: q.id,
        notes: `Raised from Quotation ${q.quotation_number} (v${q.version})`,
        terms_and_conditions: q.terms || undefined,
        items,
      },
      userId,
    );
    await this.quotations.update(
      {
        purchase_order_id: (po as any).id,
        status: ProcurementQuotationStatus.ORDERED,
        updated_by: userId,
      },
      { where: { id } },
    );
    return { id: (po as any).id, po_number: (po as any).po_number };
  }

  async raiseWorkOrder(id: string, userId: string) {
    const q = await this.get(id);
    if (q.vendor_kind !== QuotationVendorKind.LABOUR)
      throw new BadRequestException(
        'This is a material quotation — raise a Purchase Order instead.',
      );
    if (q.work_order) return { id: q.work_order.id, existing: true };
    this.assertOrderable(q);
    const items: any[] = [];
    for (const [i, line] of (q.items as any[]).entries()) {
      const unit = await this.unitFor(line.unit);
      if (!unit) throw new BadRequestException('No active units are set up.');
      const qty = Number(line.quantity);
      items.push({
        sort_order: i + 1,
        description: [line.item_name, line.description].filter(has).join(' — '),
        quantity: qty > 0 ? qty : 1,
        unit_id: unit.id,
        rate: qty > 0 ? Number(line.rate) : Number(line.amount),
        remarks: line.remarks || undefined,
      });
    }
    const stages = (q.payment_terms ?? []).filter(
      (s: any) => has(s?.stage) && Number(s.amount) >= 0,
    );
    const wo = await this.workOrdersService.create(
      {
        project_id: q.project_id,
        vendor_id: q.vendor_id,
        work_order_date: today(),
        site_address: q.project_address || undefined,
        gst_percentage: this.gstPercent(q),
        payment_terms: `As per Quotation ${q.quotation_number} (v${q.version})`,
        items,
        payment_stages: stages.map((s: any, i: number) => ({
          sort_order: i + 1,
          stage_name: String(s.stage),
          due_date: s.date || undefined,
          amount: Number(s.amount) || 0,
          remarks: s.remarks || undefined,
        })),
        terms: String(q.terms || '')
          .split(/\n+/)
          .map((t) => t.replace(/^\s*\d+[.)]\s*/, '').trim())
          .filter(Boolean)
          .map((description, i) => ({ sort_order: i + 1, description })),
      },
      userId,
    );
    await this.quotations.update(
      {
        work_order_id: (wo as any).id,
        status: ProcurementQuotationStatus.ORDERED,
        updated_by: userId,
      },
      { where: { id } },
    );
    return { id: (wo as any).id, wo_id: (wo as any).wo_id };
  }
}
