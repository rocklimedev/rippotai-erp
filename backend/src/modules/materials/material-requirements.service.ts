import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomUUID } from 'crypto';
import { MaterialRequirementStatus } from './models/material-requirement.model';
import { MaterialRequirement } from './models/material-requirement.model';
import { SampleBoard } from '../vendors/models/sample-board.model';

import {
  CreateMaterialRequirementDto,
  UpdateMaterialRequirementDto,
} from './dto/material-requirement.dto';

@Injectable()
export class MaterialRequirementsService {
  constructor(
    @InjectModel(MaterialRequirement)
    private readonly model: typeof MaterialRequirement,
  ) {}

  findAll(projectId?: string) {
    return this.model.findAll({
      where: projectId ? { projectId } : undefined,
      include: [SampleBoard],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    const record = await this.model.findByPk(id, {
      include: [SampleBoard],
    });

    if (!record) {
      throw new NotFoundException(`MaterialRequirement ${id} not found`);
    }

    return record;
  }

  create(dto: CreateMaterialRequirementDto) {
    return this.model.create({
      id: randomUUID(),

      projectId: dto.project_id,
      raisedBy: dto.raised_by ?? null,

      category: dto.category ?? null,
      description: dto.description,

      budgetHint: dto.budget_hint ?? null,
      styleNotes: dto.style_notes ?? null,

      status: dto.status ?? MaterialRequirementStatus.PENDING,
    });
  }

  async update(id: string, dto: UpdateMaterialRequirementDto) {
    const record = await this.findOne(id);

    return record.update(dto);
  }

  async remove(id: string) {
    const record = await this.findOne(id);

    await record.destroy();

    return { deleted: true };
  }
}
