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
import { ProjectsService } from '../projects/projects.service';
import { VendorsService } from '../vendors/vendors.service';
import {
  CreateQuotationDto,
  UpdateQuotationDto,
  ReviewQuotationDto,
} from './dto/quotation.dto';
import { QuotationStatus } from '../../common/enums';
import { QuotationVersionsService } from './quotation-versions.service';
import { ActivityLogForQuotationService } from '../engagement/services/activity-log-quotation.service';
const EDITABLE_STATUSES = [
  QuotationStatus.DRAFT,
  QuotationStatus.RETURNED_FOR_EDITING,
  QuotationStatus.SUBMITTED, // allow editing submitted too
];

@Injectable()
export class QuotationsService {
  constructor(
    @InjectModel(Quotation)
    private readonly quotationModel: typeof Quotation,

    private readonly projectsService: ProjectsService,
    private readonly vendorsService: VendorsService,
    private readonly versionsService: QuotationVersionsService,
    private readonly activityLogForQuotationService: ActivityLogForQuotationService,
  ) {}

  /**
   * Resolve the "actor" id for audit fields (createdBy/updatedBy/etc).
   * Always prefer the authenticated user from the request over anything
   * the client claims in the DTO body — the DTO value is only used as a
   * fallback for system/service-account calls where `user` is not present.
   */
  private resolveActorId(
    user?: any,
    fallback?: string | null,
  ): string | undefined {
    return user?.id ?? fallback ?? undefined;
  }

  private async generateQuotationNumber(): Promise<string> {
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Use highest existing sequence, not a row count — row counts collide
    // with gaps from soft-deletes or concurrent inserts.
    const lastQuotation = await this.quotationModel.findOne({
      where: { quotationNumber: { [Op.like]: `QTN-${datePart}-%` } },
      order: [['quotationNumber', 'DESC']],
      paranoid: false, // include soft-deleted rows so numbers are never reused
    });

    let nextSeq = 1;
    if (lastQuotation) {
      const lastSeq = parseInt(lastQuotation.quotationNumber.split('-')[2], 10);
      if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }

    return `QTN-${datePart}-${String(nextSeq).padStart(4, '0')}`;
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
  async create(dto: CreateQuotationDto, user?: any): Promise<Quotation> {
    const project = await this.projectsService.findOne(dto.project_id);
    const vendor = await this.vendorsService.findOne(dto.vendor_id);

    const additional_charges = dto.additional_charges ?? 0;
    const global_discount_type = dto.global_discount_type ?? 'fixed';
    const global_discount_value = dto.global_discount_value ?? 0;
    const tax_percent = dto.tax_percent ?? 0;

    // Always derive from the authenticated user; dto.created_by is only a
    // fallback for system/service-account callers with no request user.
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
        dto.quotation_number ?? (await this.generateQuotationNumber());

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
        break; // success
      } catch (err) {
        if (err instanceof UniqueConstraintError) {
          // If the caller explicitly supplied a quotation_number, don't
          // silently override it — fail fast with a clear 409 instead.
          if (dto.quotation_number) {
            throw new ConflictException(
              `Quotation number "${quotation_number}" already exists`,
            );
          }
          // Auto-generated number collided with a concurrent insert — retry
          // with a freshly computed number rather than failing the request.
          if (attempt < MAX_ATTEMPTS) {
            continue;
          }
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
    await this.activityLogForQuotationService.logQuotationCreated(
      created,
      user,
    );
    return created;
  }

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
        {
          association: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }

  async findOne(id: string): Promise<Quotation> {
    const quotation = await this.quotationModel.findOne({
      where: {
        id,
        deletedAt: null,
      },
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
      items as any,
      Number(additional_charges),
      global_discount_type,
      Number(global_discount_value),
      Number(tax_percent),
    );
    // Update items if provided
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

    // Create version after update
    await this.versionsService.createVersion(
      id,
      updatedBy ?? null,
      'Updated quotation',
    );

    const updated = await this.findOne(id);

    await this.activityLogForQuotationService.logQuotationUpdated(
      updated,
      user,
      dto,
    );

    return updated;
  }

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

    await this.activityLogForQuotationService.logQuotationSubmitted(
      submitted,
      user,
    );

    return submitted;
  }

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

    await this.activityLogForQuotationService.logQuotationApproved(
      approved,
      user,
      dto.review_remarks,
    );

    return approved;
  }

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

    await this.activityLogForQuotationService.logQuotationReturnedForEditing(
      returned,
      user,
      dto.review_remarks,
    );

    return returned;
  }

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

    await this.activityLogForQuotationService.logQuotationDeclined(
      declined,
      user,
      dto.review_remarks,
    );

    return declined;
  }

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

    await this.activityLogForQuotationService.logQuotationCancelled(
      cancelled,
      user,
    );

    return cancelled;
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

    await this.activityLogForQuotationService.logQuotationDeleted(id, user);
  }

  async restore(id: string, user?: any): Promise<Quotation> {
    const quotation = await this.quotationModel.findByPk(id);

    if (!quotation) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }

    await quotation.update({
      deletedAt: null,
      deletedBy: null,
    });

    // Create a version to reflect restore
    await this.versionsService.createVersion(
      id,
      this.resolveActorId(user) ?? null,
      'Restored',
    );

    const restored = await this.findOne(id);

    await this.activityLogForQuotationService.logQuotationRestored(
      restored,
      user,
    );

    return restored;
  }

  async remove(id: string): Promise<void> {
    const quotation = await this.quotationModel.findByPk(id);
    if (!quotation) throw new NotFoundException(`Quotation ${id} not found`);
    await quotation.destroy();
  }
}
