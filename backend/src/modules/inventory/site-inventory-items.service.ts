import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomUUID } from 'crypto';

import { SiteInventoryItem } from './models/site-inventory-item.model';

import {
  CreateSiteInventoryItemDto,
  UpdateSiteInventoryItemDto,
} from './dto/site-inventory-item.dto';

@Injectable()
export class SiteInventoryItemsService {
  constructor(
    @InjectModel(SiteInventoryItem)
    private readonly model: typeof SiteInventoryItem,
  ) {}

  async findAll(
    projectId?: string,
    belowReorderLevel = false,
  ): Promise<SiteInventoryItem[]> {
    const where = projectId
      ? {
          projectId,
        }
      : undefined;

    const rows = await this.model.findAll({
      where,
      order: [['materialName', 'ASC']],
    });

    if (!belowReorderLevel) {
      return rows;
    }

    return rows.filter(
      (row) =>
        row.reorderLevel != null &&
        Number(row.quantityOnHand) <= Number(row.reorderLevel),
    );
  }

  async findOne(id: string): Promise<SiteInventoryItem> {
    const record = await this.model.findByPk(id);

    if (!record) {
      throw new NotFoundException(`SiteInventoryItem ${id} not found`);
    }

    return record;
  }

  async create(dto: CreateSiteInventoryItemDto): Promise<SiteInventoryItem> {
    return this.model.create({
      id: randomUUID(),

      projectId: dto.project_id,
      materialName: dto.material_name,

      unitId: dto.unit_id ?? null,
      quantityOnHand: dto.quantity_on_hand ?? 0,
      reorderLevel: dto.reorder_level ?? null,
      locationOnSite: dto.location_on_site ?? null,
    });
  }

  async update(
    id: string,
    dto: UpdateSiteInventoryItemDto,
  ): Promise<SiteInventoryItem> {
    const record = await this.findOne(id);

    await record.update({
      ...(dto.project_id !== undefined && {
        projectId: dto.project_id,
      }),

      ...(dto.material_name !== undefined && {
        materialName: dto.material_name,
      }),

      ...(dto.unit_id !== undefined && {
        unitId: dto.unit_id,
      }),

      ...(dto.quantity_on_hand !== undefined && {
        quantityOnHand: dto.quantity_on_hand,
      }),

      ...(dto.reorder_level !== undefined && {
        reorderLevel: dto.reorder_level,
      }),

      ...(dto.location_on_site !== undefined && {
        locationOnSite: dto.location_on_site,
      }),
    });

    return record;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const record = await this.findOne(id);

    await record.destroy();

    return {
      deleted: true,
    };
  }
}
