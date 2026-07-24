import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, UniqueConstraintError } from 'sequelize';

import { Quotation } from './models/quotations.model';
import { QuotationItem } from './models/quotation-items.model';
import { QuotationComparison } from './models/quotation-comparisons.model';

import { ProjectsService } from '../projects/projects.service';
import { VendorsService } from '../vendors/vendors.service';
import { QuotationVersionsService } from './quotation-versions.service';

import { ActivityLogForQuotationService } from '../engagement/services/activity-log-quotation.service';
import { NotificationForQuotationService } from '../engagement/services/notification-quotation.service';

import {
  CreateQuotationDto,
  UpdateQuotationDto,
  ReviewQuotationDto,
} from './dto/quotation.dto';
import { CreateQuotationComparisonDto } from './dto/quotation-comparison.dto';
import { QuotationStatus } from '../../common/enums';

const EDITABLE_STATUSES = [
  QuotationStatus.DRAFT,
  QuotationStatus.RETURNED_FOR_EDITING,
  QuotationStatus.SUBMITTED,
];

@Injectable()
export class QuotationsService {
  constructor(
    @InjectModel(Quotation)
    private readonly quotationModel: typeof Quotation,

    @InjectModel(QuotationComparison)
    private readonly quotationComparisonModel: typeof QuotationComparison,

    private readonly projectsService: ProjectsService,
    private readonly vendorsService: VendorsService,
    private readonly versionsService: QuotationVersionsService,

    private readonly activityLogForQuotationService: ActivityLogForQuotationService,
    private readonly notificationForQuotationService: NotificationForQuotationService,
  ) {}

  private resolveActorId(
    user?: any,
    fallback?: string | null,
  ): string | undefined {
    return user?.id ?? fallback ?? undefined;
  }

  private getClientSlug(clientName: string): string {
    const parts = clientName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'XX';
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase().padEnd(2, 'X');
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  private async generateQuotationNumber(
    projectId: string,
    projectName: string,
  ): Promise<string> {
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');

    const projectSlug = this.getClientSlug(projectName);
    const existingCount = await this.quotationModel.count({
      where: { projectId },
      paranoid: false,
    });

    const nextSeq = existingCount + 1;
    return `QT-${projectSlug}-${datePart}-${String(nextSeq).padStart(3, '0')}`;
  }

  private computeTotals(
    items: { rate: number; quantity: number; amount?: number }[],
    additional_charges = 0,
    global_discount_type: 'fixed' | 'percentage' = 'fixed',
    global_discount_value = 0,
    tax_percent = 0,
  ) {
    const subtotal = items.reduce((sum, item) => {
      const amount = item.amount ?? item.rate * item.quantity;
      return sum + Number(amount);
    }, 0);

    const discount =
      global_discount_type === 'percentage'
        ? Math.round(((subtotal * global_discount_value) / 100) * 100) / 100
        : global_discount_value;

    const taxable = subtotal + Number(additional_charges) - Number(discount);
    const tax_amount = Math.round(((taxable * tax_percent) / 100) * 100) / 100;
    const total_amount = Math.round((taxable + tax_amount) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount,
      tax_amount,
      total_amount,
    };
  }

  // =========================
  // CREATE
  // =========================
  async create(dto: CreateQuotationDto, user?: any): Promise<Quotation> {
    const project = await this.projectsService.findOne(dto.project_id);
    const vendor = await this.vendorsService.findOne(dto.vendor_id);

    const additional_charges = dto.additional_charges ?? 0;
    const global_discount_type = dto.global_discount_type ?? 'fixed';
    const global_discount_value = dto.global_discount_value ?? 0;
    const tax_percent = dto.tax_percent ?? 0;

    const createdBy = this.resolveActorId(user, dto.created_by);

    const { subtotal, discount, tax_amount, total_amount } = this.computeTotals(
      dto.items,
      additional_charges,
      global_discount_type,
      global_discount_value,
      tax_percent,
    );

    const MAX_ATTEMPTS = 5;
    let attempt = 0;
    let quotation: Quotation;

    while (true) {
      attempt++;
      const quotation_number =
        dto.quotation_number ??
        (await this.generateQuotationNumber(dto.project_id, project.name));

      try {
        quotation = await this.quotationModel.create({
          quotationNumber: quotation_number,
          quotationDate: dto.quotation_date,
          status: QuotationStatus.DRAFT,
          projectId: dto.project_id,
          vendorId: dto.vendor_id,
          projectSnapshot: project.toJSON(),
          vendorSnapshot: vendor.toJSON(),
          subtotal,
          additionalCharges: additional_charges,
          discount,
          globalDiscountType: global_discount_type,
          globalDiscountValue: global_discount_value,
          taxPercent: tax_percent,
          taxAmount: tax_amount,
          totalAmount: total_amount,
          termsConditions: dto.terms_conditions,
          createdBy,
        } as any);
        break;
      } catch (err) {
        if (err instanceof UniqueConstraintError) {
          if (dto.quotation_number) {
            throw new ConflictException(
              `Quotation number "${quotation_number}" already exists`,
            );
          }
          if (attempt < MAX_ATTEMPTS) continue;
          throw new ConflictException(
            `Could not generate a unique quotation number after ${MAX_ATTEMPTS} attempts`,
          );
        }
        throw err;
      }
    }

    // Create quotation items
    await Promise.all(
      dto.items.map((item, idx) =>
        QuotationItem.create({
          sno: item.sno ?? idx + 1,
          particular: item.particular,
          rate: item.rate,
          quantity: item.quantity,
          amount:
            item.amount ?? Math.round(item.rate * item.quantity * 100) / 100,
          remarks: item.remarks,
          quotation_id: quotation.id,
        } as any),
      ),
    );

    await this.versionsService.createVersion(
      quotation.id,
      createdBy ?? null,
      'Initial version',
    );

    const created = await this.findOne(quotation.id);

    // Activity Log & Notification
    await this.activityLogForQuotationService.logQuotationCreated(
      created,
      user,
    );
    await this.notificationForQuotationService.notifyQuotationCreated(
      created,
      user?.id,
    );

    return created;
  }

  // =========================
  // FIND ALL
  // =========================
  findAll(
    filters: {
      status?: QuotationStatus;
      project_id?: string;
      vendor_id?: string;
      includeDeleted?: boolean;
    } = {},
  ): Promise<Quotation[]> {
    const where: Record<string, any> = {};

    if (filters.status) where.status = filters.status;
    if (filters.project_id) where.projectId = filters.project_id;
    if (filters.vendor_id) where.vendorId = filters.vendor_id;
    if (!filters.includeDeleted) where.deletedAt = { [Op.is]: null };

    return this.quotationModel.findAll({
      where,
      order: [['quotationDate', 'DESC']],
      include: [
        'items',
        { association: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });
  }

  // =========================
  // FIND ONE
  // =========================
  async findOne(id: string): Promise<Quotation> {
    const quotation = await this.quotationModel.findOne({
      where: { id, deletedAt: null },
      include: ['items', 'project', 'vendor'],
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }
    return quotation;
  }

  private assertEditable(quotation: Quotation) {
    if (!EDITABLE_STATUSES.includes(quotation.status)) {
      throw new BadRequestException(
        `Quotation in status "${quotation.status}" cannot be edited`,
      );
    }
  }

  // =========================
  // UPDATE
  // =========================
  async update(
    id: string,
    dto: UpdateQuotationDto,
    user?: any,
  ): Promise<Quotation> {
    const quotation = await this.findOne(id);
    this.assertEditable(quotation);

    const additional_charges =
      dto.additional_charges ?? quotation.additionalCharges;
    const global_discount_type =
      dto.global_discount_type ?? quotation.globalDiscountType;
    const global_discount_value =
      dto.global_discount_value ?? Number(quotation.globalDiscountValue);
    const tax_percent = dto.tax_percent ?? Number(quotation.taxPercent);
    const items = dto.items ?? quotation.items;

    const updatedBy = this.resolveActorId(user, dto.updated_by);

    const { subtotal, discount, tax_amount, total_amount } = this.computeTotals(
      items,
      Number(additional_charges),
      global_discount_type,
      Number(global_discount_value),
      Number(tax_percent),
    );

    if (dto.items) {
      await QuotationItem.destroy({ where: { quotation_id: id } });
      await Promise.all(
        dto.items.map((item, idx) =>
          QuotationItem.create({
            sno: item.sno ?? idx + 1,
            particular: item.particular,
            rate: item.rate,
            quantity: item.quantity,
            amount:
              item.amount ?? Math.round(item.rate * item.quantity * 100) / 100,
            remarks: item.remarks,
            quotation_id: id,
          } as any),
        ),
      );
    }

    await quotation.update({
      quotationDate: dto.quotation_date ?? quotation.quotationDate,
      additionalCharges: additional_charges,
      globalDiscountType: global_discount_type,
      globalDiscountValue: global_discount_value,
      discount,
      taxPercent: tax_percent,
      subtotal,
      taxAmount: tax_amount,
      totalAmount: total_amount,
      termsConditions: dto.terms_conditions ?? quotation.termsConditions,
      updatedBy,
    });

    await this.versionsService.createVersion(
      id,
      updatedBy ?? null,
      'Updated quotation',
    );

    const updated = await this.findOne(id);

    // Activity Log & Notification
    await this.activityLogForQuotationService.logQuotationUpdated(
      updated,
      user,
      dto,
    );
    await this.notificationForQuotationService.notifyQuotationUpdated(
      updated,
      user?.id,
    );

    return updated;
  }

  // =========================
  // SUBMIT
  // =========================
  async submit(
    id: string,
    submitted_by?: string,
    user?: any,
  ): Promise<Quotation> {
    const quotation = await this.findOne(id);
    this.assertEditable(quotation);

    const submittedBy = this.resolveActorId(user, submitted_by);

    await quotation.update({
      status: QuotationStatus.SUBMITTED,
      submittedAt: new Date(),
      submittedBy,
    });

    await this.versionsService.createVersion(
      id,
      submittedBy ?? null,
      'Submitted',
    );

    const submitted = await this.findOne(id);

    // Activity Log & Notification
    await this.activityLogForQuotationService.logQuotationSubmitted(
      submitted,
      user,
    );
    await this.notificationForQuotationService.notifyQuotationSubmitted(
      submitted,
      user?.id,
    );

    return submitted;
  }

  // =========================
  // APPROVE
  // =========================
  async approve(
    id: string,
    dto: ReviewQuotationDto,
    user?: any,
  ): Promise<Quotation> {
    const quotation = await this.requireStatus(id, QuotationStatus.SUBMITTED);
    const reviewedBy = this.resolveActorId(user, dto.reviewed_by);

    await quotation.update({
      status: QuotationStatus.APPROVED,
      reviewedAt: new Date(),
      reviewedBy,
      reviewRemarks: dto.review_remarks,
    });

    await this.versionsService.createVersion(
      id,
      reviewedBy ?? null,
      'Approved',
    );

    const approved = await this.findOne(id);

    // Activity Log & Notification
    await this.activityLogForQuotationService.logQuotationApproved(
      approved,
      user,
      dto.review_remarks,
    );
    await this.notificationForQuotationService.notifyQuotationApproved(
      approved,
      user?.id,
    );

    return approved;
  }

  // =========================
  // RETURN FOR EDITING
  // =========================
  async returnForEditing(
    id: string,
    dto: ReviewQuotationDto,
    user?: any,
  ): Promise<Quotation> {
    const quotation = await this.requireStatus(id, QuotationStatus.SUBMITTED);
    const reviewedBy = this.resolveActorId(user, dto.reviewed_by);

    await quotation.update({
      status: QuotationStatus.RETURNED_FOR_EDITING,
      reviewedAt: new Date(),
      reviewedBy,
      reviewRemarks: dto.review_remarks,
    });

    await this.versionsService.createVersion(
      id,
      reviewedBy ?? null,
      'Returned for editing',
    );

    const returned = await this.findOne(id);

    // Activity Log & Notification
    await this.activityLogForQuotationService.logQuotationReturnedForEditing(
      returned,
      user,
      dto.review_remarks,
    );
    await this.notificationForQuotationService.notifyQuotationReturnedForEditing(
      returned,
      dto.review_remarks,
      user?.id,
    );

    return returned;
  }

  // =========================
  // DECLINE
  // =========================
  async decline(
    id: string,
    dto: ReviewQuotationDto,
    user?: any,
  ): Promise<Quotation> {
    const quotation = await this.requireStatus(id, QuotationStatus.SUBMITTED);
    const reviewedBy = this.resolveActorId(user, dto.reviewed_by);

    await quotation.update({
      status: QuotationStatus.DECLINED,
      reviewedAt: new Date(),
      reviewedBy,
      reviewRemarks: dto.review_remarks,
    });

    await this.versionsService.createVersion(
      id,
      reviewedBy ?? null,
      'Declined',
    );

    const declined = await this.findOne(id);

    // Activity Log & Notification
    await this.activityLogForQuotationService.logQuotationDeclined(
      declined,
      user,
      dto.review_remarks,
    );
    await this.notificationForQuotationService.notifyQuotationDeclined(
      declined,
      dto.review_remarks,
      user?.id,
    );

    return declined;
  }

  // =========================
  // CANCEL
  // =========================
  async cancel(
    id: string,
    updated_by?: string,
    user?: any,
  ): Promise<Quotation> {
    const quotation = await this.findOne(id);

    if (
      [QuotationStatus.APPROVED, QuotationStatus.CANCELLED].includes(
        quotation.status,
      )
    ) {
      throw new BadRequestException(
        `Quotation in status "${quotation.status}" cannot be cancelled`,
      );
    }

    const updatedBy = this.resolveActorId(user, updated_by);

    await quotation.update({
      status: QuotationStatus.CANCELLED,
      updatedBy,
    });

    await this.versionsService.createVersion(
      id,
      updatedBy ?? null,
      'Cancelled',
    );

    const cancelled = await this.findOne(id);

    // Activity Log & Notification
    await this.activityLogForQuotationService.logQuotationCancelled(
      cancelled,
      user,
    );
    await this.notificationForQuotationService.notifyQuotationCancelled(
      cancelled,
      user?.id,
    );

    return cancelled;
  }

  // =========================
  // SOFT DELETE
  // =========================
  async softDelete(id: string, deleted_by?: string, user?: any): Promise<void> {
    const quotation = await this.findOne(id);
    const deletedBy = this.resolveActorId(user, deleted_by);

    await quotation.update({
      deletedAt: new Date(),
      deletedBy,
    });

    await this.versionsService.createVersion(
      id,
      deletedBy ?? null,
      'Soft deleted',
    );

    // Activity Log & Notification
    await this.activityLogForQuotationService.logQuotationDeleted(id, user);
    await this.notificationForQuotationService.notifyQuotationDeleted(
      quotation.quotationNumber,
      user?.id,
    );
  }

  // =========================
  // RESTORE
  // =========================
  async restore(id: string, user?: any): Promise<Quotation> {
    const quotation = await this.quotationModel.findByPk(id);
    if (!quotation) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }

    await quotation.update({
      deletedAt: null,
      deletedBy: null,
    });

    await this.versionsService.createVersion(
      id,
      this.resolveActorId(user) ?? null,
      'Restored',
    );

    const restored = await this.findOne(id);

    // Activity Log & Notification
    await this.activityLogForQuotationService.logQuotationRestored(
      restored,
      user,
    );
    await this.notificationForQuotationService.notifyQuotationRestored(
      restored,
      user?.id,
    );

    return restored;
  }

  private async requireStatus(
    id: string,
    status: QuotationStatus,
  ): Promise<Quotation> {
    const quotation = await this.findOne(id);
    if (quotation.status !== status) {
      throw new BadRequestException(
        `Quotation must be in "${status}" status (currently "${quotation.status}")`,
      );
    }
    return quotation;
  }

  // =========================
  // HARD DELETE
  // =========================
  async remove(id: string): Promise<void> {
    const quotation = await this.quotationModel.findByPk(id);
    if (!quotation) throw new NotFoundException(`Quotation ${id} not found`);
    await quotation.destroy();
  }

  // =========================
  // COMPARE QUOTATIONS
  // =========================
  async compareQuotations(ids: string[]) {
    if (!ids.length) {
      throw new BadRequestException('At least one quotation ID required');
    }

    const quotations = await this.quotationModel.findAll({
      where: {
        id: { [Op.in]: ids },
        deletedAt: null,
      },
      include: [
        { association: 'items', include: ['unit'] },
        { association: 'vendor', include: ['vendorCategory', 'businessType'] },
        { association: 'project', include: ['client', 'project_type'] },
      ],
    });

    if (!quotations.length) {
      throw new NotFoundException('No quotations found');
    }

    const lowestQuotation = quotations.reduce((lowest, current) =>
      Number(current.totalAmount) < Number(lowest.totalAmount)
        ? current
        : lowest,
    );

    const lineItemsMap = new Map();

    for (const quotation of quotations) {
      for (const item of quotation.items) {
        const key = `${item.sno}-${item.particular}`;
        if (!lineItemsMap.has(key)) {
          lineItemsMap.set(key, {
            sno: item.sno,
            description: item.particular,
            unit: item.unit?.name ?? '-',
            boq_rate: null,
            quotes: {},
          });
        }
        lineItemsMap.get(key)!.quotes[quotation.id] = {
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          amount: Number(item.amount),
        };
      }
    }

    return {
      lowest_id: lowestQuotation.id,
      quotations: quotations.map((q) => ({
        id: q.id,
        vendor_name:
          q.vendor?.company_name ||
          q.vendor?.name ||
          (q.vendorSnapshot as any)?.name,
        project_name: q.project?.name || (q.projectSnapshot as any)?.name,
        project_type: q.project?.project_type?.name ?? null,
        client_name: q.project?.client?.name ?? null,
        quotation_number: q.quotationNumber,
        quotation_date: q.quotationDate,
        status: q.status,
        subtotals: {
          base: Number(q.subtotal),
          additional_charges: Number(q.additionalCharges),
          discount: Number(q.discount),
          tax: Number(q.taxAmount),
          total: Number(q.totalAmount),
        },
        commercial_terms: q.termsConditions,
        vendor: q.vendor,
        vendor_category: q.vendor?.vendorCategory?.name ?? null,
        business_type: q.vendor?.businessType?.name ?? null,
        selected: false,
      })),
      line_items: [...lineItemsMap.values()],
    };
  }

  // =========================
  // MARK SELECTED
  // =========================
  async markQuotationSelected(id: string, remarks?: string, user?: any) {
    const quotation = await this.findOne(id);
    await this.activityLogForQuotationService.logQuotationUpdated(
      quotation,
      user,
      { remarks },
    );
    return quotation;
  }

  // =========================
  // SAVE COMPARISON
  // =========================
  async saveComparison(dto: CreateQuotationComparisonDto, user?: any) {
    const existing = await this.quotationModel.count({
      where: { id: { [Op.in]: dto.quotation_ids } },
    });

    if (existing !== dto.quotation_ids.length) {
      throw new NotFoundException('Some quotations not found');
    }

    return this.quotationComparisonModel.create({
      name: dto.name,
      projectId: dto.project_id,
      workCategory: dto.work_category,
      quotationIds: dto.quotation_ids,
      comparedAt: new Date(),
    } as any);
  }
}
