import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { InventoryController } from './inventory.controller';

import { InventoryService } from './inventory.service';
import { UnitsService } from '@/modules/metas/units.service';
import { BrandService } from './services/brand.service';
import { InventoryRequestService } from './services/inventory-request.service';
import { InventoryDispatchService } from './services/inventory-dispatch.service';
import { ProjectMaterialService } from './services/project-material.service';

import { InventoryRequest } from './models/inventory-request.model';
import { InventoryDispatch } from './models/inventory-dispatch.model';
import { InventoryMaster } from './models/inventory-master.model';
import { ProjectMaterial } from './models/project-materials.model';
import { InventoryCategory } from './models/inventory-category.model';
import { Brand } from './models/brand.model';
import { Unit } from '../metas/models/unit.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      InventoryRequest,
      InventoryDispatch,
      InventoryMaster,
      ProjectMaterial,
      InventoryCategory,
      Brand,
      Unit,
    ]),
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    UnitsService,
    BrandService,
    InventoryRequestService,
    InventoryDispatchService,
    ProjectMaterialService,
  ],
  exports: [
    InventoryService,
    UnitsService,
    BrandService,
    InventoryRequestService,
    InventoryDispatchService,
    ProjectMaterialService,
  ],
})
export class InventoryModule {}
