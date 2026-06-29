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
  ) {}

  private async generateQuotationNumber(): Promise<string> {
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');

    const countToday = await this.quotationModel.count({
      where: {
        quotationNumber: { [Op.like]: `QTN-${datePart}-%` },
      },
    });

    const sequence = String(countToday + 1).padStart(4, '0');
    return `QTN-${datePart}-${sequence}`;
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

  async create(dto: CreateQuotationDto): Promise<Quotation> {
    const project = await this.projectsService.findOne(dto.project_id);
    const vendor = await this.vendorsService.findOne(dto.vendor_id);

    const additional_charges = dto.additional_charges ?? 0;
    const global_discount_type = dto.global_discount_type ?? 'fixed';
    const global_discount_value = dto.global_discount_value ?? 0;
    const tax_percent = dto.tax_percent ?? 0;

    const { subtotal, discount, tax_amount, total_amount } = this.computeTotals(
      dto.items,
      additional_charges,
      global_discount_type,
      global_discount_value,
      tax_percent,
    );
    const quotation_number =
      dto.quotation_number ?? (await this.generateQuotationNumber());

    try {
      const quotation = await this.quotationModel.create({
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
        createdBy: dto.created_by,
      } as any);

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

      // Create initial version
      await this.versionsService.createVersion(
        quotation.id,
        dto.created_by ?? null,
        'Initial version',
      );

      return this.findOne(quotation.id);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Quotation number "${quotation_number}" already exists`,
        );
      }
      throw err;
    }
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
      include: ['items'],
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

  async update(id: string, dto: UpdateQuotationDto): Promise<Quotation> {
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
      updatedBy: dto.updated_by,
    });

    // Create version after update
    await this.versionsService.createVersion(
      id,
      dto.updated_by ?? null,
      'Updated quotation',
    );

    return this.findOne(id);
  }

  async submit(id: string, submitted_by?: string): Promise<Quotation> {
    const quotation = await this.findOne(id);
    this.assertEditable(quotation);

    await quotation.update({
      status: QuotationStatus.SUBMITTED,
      submittedAt: new Date(),
      submittedBy: submitted_by,
    });

    await this.versionsService.createVersion(
      id,
      submitted_by ?? null,
      'Submitted',
    );

    return this.findOne(id);
  }

  async approve(id: string, dto: ReviewQuotationDto): Promise<Quotation> {
    const quotation = await this.requireStatus(id, QuotationStatus.SUBMITTED);

    await quotation.update({
      status: QuotationStatus.APPROVED,
      reviewedAt: new Date(),
      reviewedBy: dto.reviewed_by,
      reviewRemarks: dto.review_remarks,
    });

    await this.versionsService.createVersion(
      id,
      dto.reviewed_by ?? null,
      'Approved',
    );

    return this.findOne(id);
  }

  async returnForEditing(
    id: string,
    dto: ReviewQuotationDto,
  ): Promise<Quotation> {
    const quotation = await this.requireStatus(id, QuotationStatus.SUBMITTED);

    await quotation.update({
      status: QuotationStatus.RETURNED_FOR_EDITING,
      reviewedAt: new Date(),
      reviewedBy: dto.reviewed_by,
      reviewRemarks: dto.review_remarks,
    });

    await this.versionsService.createVersion(
      id,
      dto.reviewed_by ?? null,
      'Returned for editing',
    );

    return this.findOne(id);
  }

  async decline(id: string, dto: ReviewQuotationDto): Promise<Quotation> {
    const quotation = await this.requireStatus(id, QuotationStatus.SUBMITTED);

    await quotation.update({
      status: QuotationStatus.DECLINED,
      reviewedAt: new Date(),
      reviewedBy: dto.reviewed_by,
      reviewRemarks: dto.review_remarks,
    });

    await this.versionsService.createVersion(
      id,
      dto.reviewed_by ?? null,
      'Declined',
    );

    return this.findOne(id);
  }

  async cancel(id: string, updated_by?: string): Promise<Quotation> {
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

    await quotation.update({
      status: QuotationStatus.CANCELLED,
      updatedBy: updated_by,
    });

    await this.versionsService.createVersion(
      id,
      updated_by ?? null,
      'Cancelled',
    );

    return this.findOne(id);
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

  async softDelete(id: string, deleted_by?: string): Promise<void> {
    const quotation = await this.findOne(id);
    await quotation.update({
      deletedAt: new Date(),
      deletedBy: deleted_by,
    });

    await this.versionsService.createVersion(
      id,
      deleted_by ?? null,
      'Soft deleted',
    );
  }

  async restore(id: string): Promise<Quotation> {
    const quotation = await this.quotationModel.findByPk(id);

    if (!quotation) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }

    await quotation.update({
      deletedAt: null,
      deletedBy: null,
    });

    // Create a version to reflect restore
    await this.versionsService.createVersion(id, null, 'Restored');

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const quotation = await this.quotationModel.findByPk(id);
    if (!quotation) throw new NotFoundException(`Quotation ${id} not found`);
    await quotation.destroy();
  }
}
