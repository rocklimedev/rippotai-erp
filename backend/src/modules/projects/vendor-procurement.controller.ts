import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';

import { VendorProcurementService } from './vendor-procurement.service';

import { ProcurementCategoryType } from '@/common/enums/project-planner.enum';

import {
  CreateVendorProcurementDto,
  UpdateVendorProcurementDto,
} from './dto/vendor-procurement.dto';

@Controller('projects')
export class VendorProcurementController {
  constructor(private readonly service: VendorProcurementService) {}

  // ============================================================
  // PROCUREMENT CATEGORIES
  // ============================================================

  @Get('planner/procurement-categories')
  listCategories(@Query('type') type?: ProcurementCategoryType) {
    return this.service.listCategories(type);
  }

  // ============================================================
  // VENDOR PROCUREMENT
  // ============================================================

  @Get(':projectId/planner/vendor-procurement')
  getSheet(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.service.getSheet(projectId);
  }

  @Post(':projectId/planner/vendor-procurement')
  upsertRow(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateVendorProcurementDto,
  ) {
    return this.service.upsertRow(projectId, dto);
  }

  @Patch(':projectId/planner/vendor-procurement/:rowId')
  updateRow(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('rowId', ParseUUIDPipe) rowId: string,
    @Body() dto: UpdateVendorProcurementDto,
  ) {
    return this.service.updateRow(rowId, dto);
  }
}
