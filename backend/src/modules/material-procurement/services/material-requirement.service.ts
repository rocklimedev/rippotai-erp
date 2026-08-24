import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MaterialRequirement } from '../models/material-requirement.model';
import { SampleBoard } from '../models/sample-board.model';
import { MaterialRateSheet } from '../models/material-rate-sheet.model';
import { MaterialEstimate } from '../models/material-estimate.model';
import { MaterialQuotation } from '../models/material-quotation.model';
import { CreateMaterialRequirementDto } from '../dto/create-material-requirement.dto';
import { UpdateMaterialRequirementDto } from '../dto/update-material-requirement.dto';
import { RequirementStatus } from '../../../common/enums/requirement-status.enum';

@Injectable()
export class MaterialRequirementService {
  constructor(
    @InjectModel(MaterialRequirement)
    private readonly model: typeof MaterialRequirement,
  ) {}

  create(dto: CreateMaterialRequirementDto) {
    return this.model.create({
      ...dto,
      status: RequirementStatus.DRAFT,
    } as any);
  }

  findAll(projectId?: string) {
    return this.model.findAll({
      where: projectId ? { projectId } : {},
      include: [SampleBoard, MaterialRateSheet, MaterialEstimate],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    const requirement = await this.model.findByPk(id, {
      include: [
        SampleBoard,
        MaterialRateSheet,
        { model: MaterialEstimate, include: [MaterialQuotation] },
      ],
    });
    if (!requirement) {
      throw new NotFoundException(`Material requirement ${id} not found`);
    }
    return requirement;
  }

  async update(id: string, dto: UpdateMaterialRequirementDto) {
    const requirement = await this.findOne(id);
    return requirement.update(dto as any);
  }

  async remove(id: string) {
    const requirement = await this.findOne(id);
    await requirement.destroy();
    return { id, deleted: true };
  }

  /** Convenience used by downstream services to advance the workflow status. */
  async setStatus(id: string, status: RequirementStatus) {
    await this.model.update({ status }, { where: { id } });
  }
}
