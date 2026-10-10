import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { MaterialRateSheetService } from '../services/material-rate-sheet.service';
import { CreateMaterialRateSheetDto } from '../dto/create-material-rate-sheet.dto';
import { ApproveDto, RejectDto } from '../dto/approve.dto';

/** 2b. Sourcing — material rate sheets. */
@Controller('procurement/rate-sheets')
export class MaterialRateSheetController {
  constructor(private readonly service: MaterialRateSheetService) {}

  @RequirePermission('procurement-rate-sheets:create')
  @Post()
  create(@Body() dto: CreateMaterialRateSheetDto) {
    return this.service.create(dto);
  }

  @RequirePermission('procurement-rate-sheets:read')
  @Get('by-requirement/:materialRequirementId')
  findAllForRequirement(
    @Param('materialRequirementId') materialRequirementId: string,
  ) {
    return this.service.findAllForRequirement(materialRequirementId);
  }

  @RequirePermission('procurement-rate-sheets:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @RequirePermission('procurement-rate-sheets:approve')
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveDto) {
    return this.service.approve(id, dto);
  }

  @RequirePermission('procurement-rate-sheets:reject')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectDto) {
    return this.service.reject(id, dto);
  }

  @RequirePermission('procurement-rate-sheets:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
