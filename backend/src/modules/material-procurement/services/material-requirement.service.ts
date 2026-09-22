import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { MaterialRequirement } from '../models/material-requirement.model';
import { SampleBoard } from '../models/sample-board.model';
import { MaterialMaster } from '../models';
import { MaterialVendor } from '../models/material-vendor.model';
import { Quotation } from '@/modules/quotations/models/quotations.model';
import { DeliveryChallan } from '../models';
import { CreateMaterialRequirementDto } from '../dto/create-material-requirement.dto';
import { UpdateMaterialRequirementDto } from '../dto/update-material-requirement.dto';

import { RequirementStatus } from '../../../common/enums/requirement-status.enum';

@Injectable()
export class MaterialRequirementService {
  constructor(
    @InjectModel(MaterialRequirement)
    private readonly model: typeof MaterialRequirement,
  ) {}

  // ============================================================
  // INCLUDE CONFIGURATION
  //
  // MaterialMaster
  //   └── MaterialVendor[]
  //
  // Quotation and DeliveryChallan are generated against the
  // requirement once it's finalized by the procurement team.
  // ============================================================
  private readonly includes = [
    {
      model: SampleBoard,
    },
    {
      model: MaterialMaster,
      as: 'material',
      include: [
        {
          model: MaterialVendor,
          as: 'vendors',
        },
      ],
    },
    {
      model: Quotation,
    },
    {
      model: DeliveryChallan,
      as: 'deliveryChallans',
    },
  ];

  async create(dto: CreateMaterialRequirementDto) {
    const requirement = await this.model.create({
      ...dto,
      status: RequirementStatus.DRAFT,
    } as any);

    return this.findOne(requirement.id);
  }

  async findAll(projectId?: string) {
    return this.model.findAll({
      where: projectId ? { projectId } : {},
      include: this.includes,
      order: [['createdAt', 'DESC']],
    });
  }

  async getMaterialRequirementsByProject(projectId: string) {
    return this.model.findAll({
      where: { projectId },
      include: this.includes,
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    const requirement = await this.model.findByPk(id, {
      include: this.includes,
    });

    if (!requirement) {
      throw new NotFoundException(`Material requirement ${id} not found`);
    }

    return requirement;
  }

  async update(id: string, dto: UpdateMaterialRequirementDto) {
    const requirement = await this.findOne(id);
    await requirement.update(dto as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    const requirement = await this.findOne(id);
    await requirement.destroy();
    return { id, deleted: true };
  }

  async setStatus(id: string, status: RequirementStatus) {
    const requirement = await this.model.findByPk(id);

    if (!requirement) {
      throw new NotFoundException(`Material requirement ${id} not found`);
    }

    await requirement.update({ status });
    return this.findOne(id);
  }
}
