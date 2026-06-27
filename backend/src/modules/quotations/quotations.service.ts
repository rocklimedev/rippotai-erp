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

const EDITABLE_STATUSES = [
  QuotationStatus.DRAFT,
  QuotationStatus.RETURNED_FOR_EDITING,
  QuotationStatus.SUBMITTED, // 👈 allow editing submitted too
];

@Injectable()
export class QuotationsService {
  constructor(
    @InjectModel(Quotation)
    private readonly quotationModel: typeof Quotation,

    private readonly projectsService: ProjectsService,
    private readonly vendorsService: VendorsService,
  ) {}

  private async generateQuotationNumber(): Promise<string> {
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');

    const countToday = await this.quotationModel.count({
      where: {
        quotationNumber: { [Op.like]: `QTN-${datePart}-%` }, // ← Correct camelCase
      },
    });

    const sequence = String(countToday + 1).padStart(4, '0');
    return `QTN-${datePart}-${sequence}`;
  }

  private computeTotals(
    items: { rate: number; quantity: number; amount?: number }[],
    additional_charges = 0,
    discount = 0,
    tax_percent = 0,
  ) {
    const subtotal = items.reduce((sum, item) => {
      const amount = item.amount ?? item.rate * item.quantity;
      return sum + Number(amount);
    }, 0);

    const taxable = subtotal + additional_charges - discount;
    const tax_amount = Math.round(((taxable * tax_percent) / 100) * 100) / 100;
    const total_amount = Math.round((taxable + tax_amount) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount,
      total_amount,
    };
  }

  async create(dto: CreateQuotationDto): Promise<Quotation> {
    const project = await this.projectsService.findOne(dto.project_id);
    const vendor = await this.vendorsService.findOne(dto.vendor_id);

    const additional_charges = dto.additional_charges ?? 0;
    const discount = dto.discount ?? 0;
    const tax_percent = dto.tax_percent ?? 0;

    const { subtotal, tax_amount, total_amount } = this.computeTotals(
      dto.items,
      additional_charges,
      discount,
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
        deletedAt: null, // ← Fixed: Use null directly
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
    const discount = dto.discount ?? quotation.discount;
    const tax_percent = dto.tax_percent ?? quotation.taxPercent;

    const items = dto.items ?? quotation.items;

    const { subtotal, tax_amount, total_amount } = this.computeTotals(
      items as any,
      Number(additional_charges),
      Number(discount),
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
      discount,
      taxPercent: tax_percent,
      subtotal,
      taxAmount: tax_amount,
      totalAmount: total_amount,
      termsConditions: dto.terms_conditions ?? quotation.termsConditions,
      updatedBy: dto.updated_by,
    });

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

    return this.findOne(id);
  }
  async remove(id: string): Promise<void> {
    const quotation = await this.quotationModel.findByPk(id);
    if (!quotation) throw new NotFoundException(`Quotation ${id} not found`);
    await quotation.destroy();
  }
}
