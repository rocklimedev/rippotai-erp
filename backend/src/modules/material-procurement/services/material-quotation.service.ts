import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MaterialQuotation } from '../models/material-quotation.model';
import { MaterialEstimate } from '../models/material-estimate.model';
import { PurchaseOrder } from '../models/purchase-order.model';
import { CreateMaterialQuotationDto } from '../dto/create-material-quotation.dto';
import { QuotationStatus } from '../../../common/enums/quotation-status.enum';
import { ApprovalStatus } from '../../../common/enums/approval-status.enum';
import { RequirementStatus } from '../../../common/enums/requirement-status.enum';
import { MaterialEstimateService } from './material-estimate.service';
import { MaterialRequirementService } from './material-requirement.service';

@Injectable()
export class MaterialQuotationService {
  constructor(
    @InjectModel(MaterialQuotation)
    private readonly model: typeof MaterialQuotation,
    private readonly estimateService: MaterialEstimateService,
    private readonly requirementService: MaterialRequirementService,
  ) {}

  /**
   * Converts an APPROVED estimate into a quotation — the same
   * estimate → approval → quotation rule enforced for trades.
   */
  async createFromEstimate(dto: CreateMaterialQuotationDto) {
    const estimate = await this.estimateService.findOne(dto.estimateId);

    if (estimate.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new BadRequestException(
        'Only an approved estimate can be converted into a quotation',
      );
    }
    if (estimate.convertedToQuotation) {
      throw new ConflictException(
        `Estimate ${dto.estimateId} has already been converted to a quotation`,
      );
    }

    const quotation = await this.model.create({
      estimateId: dto.estimateId,
      quotationNumber: dto.quotationNumber,
      quotationDate: dto.quotationDate,
      totalAmount: estimate.totalAmount,
      terms: dto.terms,
      status: QuotationStatus.DRAFT,
    } as any);

    await this.estimateService.markConverted(dto.estimateId);
    await this.requirementService.setStatus(
      estimate.materialRequirementId,
      RequirementStatus.QUOTED,
    );
    return quotation;
  }

  async findOne(id: string) {
    const quotation = await this.model.findByPk(id, {
      include: [MaterialEstimate, PurchaseOrder],
    });
    if (!quotation) throw new NotFoundException(`Quotation ${id} not found`);
    return quotation;
  }

  findAll() {
    return this.model.findAll({ order: [['createdAt', 'DESC']] });
  }

  async send(id: string) {
    const quotation = await this.findOne(id);
    return quotation.update({ status: QuotationStatus.SENT });
  }

  async accept(id: string) {
    const quotation = await this.findOne(id);
    return quotation.update({
      status: QuotationStatus.ACCEPTED,
      acceptedAt: new Date(),
    });
  }

  async reject(id: string) {
    const quotation = await this.findOne(id);
    return quotation.update({ status: QuotationStatus.REJECTED });
  }
}
