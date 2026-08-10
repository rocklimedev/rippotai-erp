import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { MaterialRateSheetService } from '../services/material-rate-sheet.service';
import { CreateMaterialRateSheetDto } from '../dto/create-material-rate-sheet.dto';
import { ApproveDto, RejectDto } from '../dto/approve.dto';

/** 2b. Sourcing — material rate sheets. */
@Controller('material-procurement/rate-sheets')
export class MaterialRateSheetController {
  constructor(private readonly service: MaterialRateSheetService) {}

  @Post()
  create(@Body() dto: CreateMaterialRateSheetDto) {
    return this.service.create(dto);
  }

  @Get('by-requirement/:materialRequirementId')
  findAllForRequirement(
    @Param('materialRequirementId') materialRequirementId: string,
  ) {
    return this.service.findAllForRequirement(materialRequirementId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveDto) {
    return this.service.approve(id, dto);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectDto) {
    return this.service.reject(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
