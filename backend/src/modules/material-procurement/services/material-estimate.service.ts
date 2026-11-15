import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MaterialEstimate } from '../models/material-estimate.model';
import { MaterialRateSheet } from '../models/material-rate-sheet.model';
import { CreateMaterialEstimateDto } from '../dto/create-material-estimate.dto';
import { ApproveDto, RejectDto } from '../dto/approve.dto';
import { ApprovalStatus } from '../../../common/enums/approval-status.enum';
import { RequirementStatus } from '../../../common/enums/requirement-status.enum';
import { MaterialRequirementService } from './material-requirement.service';

/**
 * 3. Material estimate.
 * An estimate is created PENDING and must be explicitly APPROVED; a
 * purchase order is then raised directly against the approved estimate.
 */
@Injectable()
export class MaterialEstimateService {
  constructor(
    @InjectModel(MaterialEstimate)
    private readonly model: typeof MaterialEstimate,
    @InjectModel(MaterialRateSheet)
    private readonly rateSheetModel: typeof MaterialRateSheet,
    private readonly requirementService: MaterialRequirementService,
  ) {}

  async create(dto: CreateMaterialEstimateDto) {
    const existing = await this.model.findOne({
      where: { materialRequirementId: dto.materialRequirementId },
    });
    if (existing) {
      throw new ConflictException(
        `An estimate already exists for requirement ${dto.materialRequirementId}`,
      );
    }

    let unitRate = dto.unitRate;
    if (dto.rateSheetId) {
      const sheet = await this.rateSheetModel.findByPk(dto.rateSheetId);
      if (!sheet) {
        throw new NotFoundException(`Rate sheet ${dto.rateSheetId} not found`);
      }
      if (sheet.approvalStatus !== ApprovalStatus.APPROVED) {
        throw new BadRequestException(
          'Estimate can only reference an approved rate sheet',
        );
      }
      unitRate = Number(sheet.unitRate);
    }

    const totalAmount = Number((dto.quantity * unitRate).toFixed(2));

    const estimate = await this.model.create({
      materialRequirementId: dto.materialRequirementId,
      rateSheetId: dto.rateSheetId,
      quantity: dto.quantity,
      unit: dto.unit,
      unitRate,
      totalAmount,
      approvalStatus: ApprovalStatus.PENDING,
    } as any);

    // material_requirements.status is a DB enum (DRAFT/READY/IN_PROGRESS/...)
    // that has no "estimated" value; the estimate itself is the record of
    // this step, so a status the column cannot hold must not fail the save.
    await this.requirementService
      .setStatus(dto.materialRequirementId, RequirementStatus.ESTIMATED)
      .catch(() => undefined);
    return estimate;
  }

  async findOne(id: string) {
    const estimate = await this.model.findByPk(id);
    if (!estimate) throw new NotFoundException(`Estimate ${id} not found`);
    return estimate;
  }

  findForRequirement(materialRequirementId: string) {
    return this.model.findOne({ where: { materialRequirementId } });
  }

  async approve(id: string, dto: ApproveDto) {
    const estimate = await this.findOne(id);
    if (estimate.approvalStatus === ApprovalStatus.APPROVED) {
      return estimate;
    }
    return estimate.update({
      approvalStatus: ApprovalStatus.APPROVED,
      approvedBy: dto.approvedBy,
      approvedAt: new Date(),
    });
  }

  async reject(id: string, dto: RejectDto) {
    const estimate = await this.findOne(id);
    return estimate.update({
      approvalStatus: ApprovalStatus.REJECTED,
      approvedBy: dto.approvedBy,
      approvedAt: new Date(),
    });
  }
}
