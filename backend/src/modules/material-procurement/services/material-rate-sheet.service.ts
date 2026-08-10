import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MaterialRateSheet } from '../models/material-rate-sheet.model';
import { CreateMaterialRateSheetDto } from '../dto/create-material-rate-sheet.dto';
import { ApproveDto, RejectDto } from '../dto/approve.dto';
import { ApprovalStatus } from '../../../common/enums/approval-status.enum';

@Injectable()
export class MaterialRateSheetService {
  constructor(
    @InjectModel(MaterialRateSheet)
    private readonly model: typeof MaterialRateSheet,
  ) {}

  create(dto: CreateMaterialRateSheetDto) {
    return this.model.create({
      ...dto,
      currency: dto.currency ?? 'INR',
      approvalStatus: ApprovalStatus.PENDING,
    } as any);
  }

  findAllForRequirement(materialRequirementId: string) {
    return this.model.findAll({
      where: { materialRequirementId },
      order: [['unitRate', 'ASC']],
    });
  }

  async findOne(id: string) {
    const sheet = await this.model.findByPk(id);
    if (!sheet) throw new NotFoundException(`Rate sheet ${id} not found`);
    return sheet;
  }

  async approve(id: string, dto: ApproveDto) {
    const sheet = await this.findOne(id);
    return sheet.update({
      approvalStatus: ApprovalStatus.APPROVED,
      approvedBy: dto.approvedBy,
      approvedAt: new Date(),
    });
  }

  async reject(id: string, dto: RejectDto) {
    const sheet = await this.findOne(id);
    return sheet.update({
      approvalStatus: ApprovalStatus.REJECTED,
      approvedBy: dto.approvedBy,
      approvedAt: new Date(),
    });
  }

  async remove(id: string) {
    const sheet = await this.findOne(id);
    await sheet.destroy();
    return { id, deleted: true };
  }
}
