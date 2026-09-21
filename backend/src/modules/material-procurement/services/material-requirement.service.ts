import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { MaterialRequirement } from '../models/material-requirement.model';
import { SampleBoard } from '../models/sample-board.model';
import { MaterialMaster } from '../models';
import { MaterialVendor } from '../models/material-vendor.model';
import { Quotation } from '@/modules/quotations/models/quotations.model';

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
  // ============================================================

  /**
   * All related procurement/design information belonging
   * to a material requirement.
   *
   * MaterialMaster is the source of truth for material data.
   *
   * MaterialMaster
   *   └── MaterialVendor[]
   *
   * Vendor-specific pricing is maintained in MaterialVendor.
   *
   * Quotation contains vendor quotation information generated
   * against the requirement.
   */
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
  ];

  // ============================================================
  // CREATE
  // ============================================================

  async create(dto: CreateMaterialRequirementDto) {
    const requirement = await this.model.create({
      ...dto,
      status: RequirementStatus.DRAFT,
    } as any);

    return this.findOne(requirement.id);
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  async findAll(projectId?: string) {
    return this.model.findAll({
      where: projectId
        ? {
            projectId,
          }
        : {},
      include: this.includes,
      order: [['createdAt', 'DESC']],
    });
  }

  // ============================================================
  // GET MATERIAL REQUIREMENTS BY PROJECT
  // ============================================================

  async getMaterialRequirementsByProject(projectId: string) {
    return this.model.findAll({
      where: {
        projectId,
      },
      include: this.includes,
      order: [['createdAt', 'DESC']],
    });
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string) {
    const requirement = await this.model.findByPk(id, {
      include: this.includes,
    });

    if (!requirement) {
      throw new NotFoundException(`Material requirement ${id} not found`);
    }

    return requirement;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(id: string, dto: UpdateMaterialRequirementDto) {
    const requirement = await this.findOne(id);

    await requirement.update(dto as any);

    return this.findOne(id);
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(id: string) {
    const requirement = await this.findOne(id);

    await requirement.destroy();

    return {
      id,
      deleted: true,
    };
  }

  // ============================================================
  // STATUS
  // ============================================================

  /**
   * Update material requirement workflow status.
   *
   * Example:
   *
   * DRAFT
   *   ↓
   * READY_FOR_SOURCING
   *   ↓
   * SOURCING
   *   ↓
   * COMPLETED
   */
  async setStatus(id: string, status: RequirementStatus) {
    const requirement = await this.model.findByPk(id);

    if (!requirement) {
      throw new NotFoundException(`Material requirement ${id} not found`);
    }

    await requirement.update({
      status,
    });

    return this.findOne(id);
  }
}
