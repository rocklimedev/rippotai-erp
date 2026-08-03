import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuid } from 'uuid';
import { Op } from 'sequelize';

import { InventoryCategory } from './models/inventory-category.model';
import { InventoryMaster } from './models/inventory-master.model';
import { Brand } from './models/brand.model';
import { Unit } from '../metas/models/unit.model';

import { CreateInventoryMasterDto } from './dto/create-inventory-master.dto';
import { UpdateInventoryMasterDto } from './dto/update-inventory-master.dto';

import { BrandService } from './services/brand.service';
import { UnitsService } from '@/modules/metas/units.service';
import { InventoryRequestService } from './services/inventory-request.service';
import { InventoryDispatchService } from './services/inventory-dispatch.service';
import { ProjectMaterialService } from './services/project-material.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryMaster)
    private masterModel: typeof InventoryMaster,

    // Sub-services injected for dashboard aggregation
    private readonly brandService: BrandService,
    private readonly unitService: UnitsService,
    private readonly requestService: InventoryRequestService,
    private readonly dispatchService: InventoryDispatchService,
    private readonly projectMaterialService: ProjectMaterialService,
  ) {}

  // ====================== INVENTORY MASTER ======================

  async createMaster(dto: CreateInventoryMasterDto) {
    return this.masterModel.create({
      id: uuid(),
      ...dto,
    });
  }

  async findAllMaster() {
    return this.masterModel.findAll({
      include: [
        { model: Brand, as: 'brand' },
        { model: Unit, as: 'unit' },
        { model: InventoryCategory, as: 'category' },
      ],
      order: [['item_name', 'ASC']],
    });
  }

  async findMasterById(id: string) {
    const item = await this.masterModel.findByPk(id, {
      include: ['brand', 'unit', 'category'],
    });

    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async updateMaster(id: string, dto: UpdateInventoryMasterDto) {
    const item = await this.findMasterById(id);
    return item.update(dto);
  }

  async deleteMaster(id: string) {
    const item = await this.findMasterById(id);
    await item.destroy();
    return { message: 'Inventory item deleted successfully' };
  }

  async searchInventory(query: string) {
    return this.masterModel.findAll({
      where: {
        [Op.or]: [
          { item_name: { [Op.like]: `%${query}%` } },
          { item_code: { [Op.like]: `%${query}%` } },
        ],
      },
      include: ['brand', 'unit', 'category'],
      limit: 25,
      order: [['item_name', 'ASC']],
    });
  }

  async getInventoryByCategory(categoryId: string) {
    return this.masterModel.findAll({
      where: { category_id: categoryId, is_active: true },
      include: ['brand', 'unit', 'category'],
    });
  }

  async getInventoryByBrand(brandId: string) {
    return this.masterModel.findAll({
      where: { brand_id: brandId, is_active: true },
      include: ['brand', 'unit', 'category'],
    });
  }

  // ====================== DASHBOARD ======================

  async getInventoryDashboard() {
    const [
      totalItems,
      totalBrands,
      totalUnits,
      totalRequests,
      totalDispatches,
    ] = await Promise.all([
      this.masterModel.count(),
      this.brandService.countTotal(),

      this.requestService.countTotal(),
      this.dispatchService.countTotal(),
      this.projectMaterialService.countTotal(),
    ]);

    return {
      totalItems,
      totalBrands,
      totalUnits,
      totalRequests,
      totalDispatches,
    };
  }

  async getProjectInventoryDashboard(projectId: string) {
    const [materials, requests, dispatches] = await Promise.all([
      this.projectMaterialService.countByProject(projectId),
      this.requestService.countByProject(projectId),
      this.dispatchService.countByProject(projectId),
    ]);

    return { projectId, materials, requests, dispatches };
  }
}
