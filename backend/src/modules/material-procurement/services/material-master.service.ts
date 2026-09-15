import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { MaterialMaster } from '../models/material-master.model';
import {
  CreateMaterialMasterDto,
  UpdateMaterialMasterDto,
} from '../dto/material-master.dto';

@Injectable()
export class MaterialMasterService {
  constructor(
    @InjectModel(MaterialMaster)
    private readonly materialModel: typeof MaterialMaster,
  ) {}

  async create(
    dto: CreateMaterialMasterDto,
    userId?: string,
  ): Promise<MaterialMaster> {
    const existing = await this.materialModel.findOne({
      where: {
        material_code: dto.material_code,
      },
    });

    if (existing) {
      throw new ConflictException('Material code already exists');
    }

    return this.materialModel.create({
      ...dto,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    });
  }

  async findAll(params?: {
    search?: string;
    category?: string;
    is_active?: boolean;
  }): Promise<MaterialMaster[]> {
    const where: any = {};

    if (params?.category) {
      where.category = params.category;
    }

    if (params?.is_active !== undefined) {
      where.is_active = params.is_active;
    }

    if (params?.search) {
      const { Op } = require('sequelize');

      where[Op.or] = [
        {
          name: {
            [Op.like]: `%${params.search}%`,
          },
        },
        {
          material_code: {
            [Op.like]: `%${params.search}%`,
          },
        },
        {
          brand: {
            [Op.like]: `%${params.search}%`,
          },
        },
      ];
    }

    return this.materialModel.findAll({
      where,
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: string): Promise<MaterialMaster> {
    const material = await this.materialModel.findByPk(id);

    if (!material) {
      throw new NotFoundException('Material master not found');
    }

    return material;
  }

  async update(
    id: string,
    dto: UpdateMaterialMasterDto,
    userId?: string,
  ): Promise<MaterialMaster> {
    const material = await this.findOne(id);

    await material.update({
      ...dto,
      updated_by: userId ?? null,
    });

    return material;
  }

  async deactivate(id: string, userId?: string): Promise<MaterialMaster> {
    const material = await this.findOne(id);

    await material.update({
      is_active: false,
      updated_by: userId ?? null,
    });

    return material;
  }
}
