import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MaterialEstimateService } from '../services/material-estimate.service';
import { CreateMaterialEstimateDto } from '../dto/create-material-estimate.dto';
import { ApproveDto, RejectDto } from '../dto/approve.dto';

/** 3a. Material estimate — first half of the estimate → quotation flow. */
@Controller('procurement/estimates')
export class MaterialEstimateController {
  constructor(private readonly service: MaterialEstimateService) {}

  @Post()
  create(@Body() dto: CreateMaterialEstimateDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('by-requirement/:materialRequirementId')
  findForRequirement(
    @Param('materialRequirementId') materialRequirementId: string,
  ) {
    return this.service.findForRequirement(materialRequirementId);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveDto) {
    return this.service.approve(id, dto);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectDto) {
    return this.service.reject(id, dto);
  }
}
