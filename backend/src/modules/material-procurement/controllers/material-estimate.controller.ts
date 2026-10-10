import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MaterialEstimateService } from '../services/material-estimate.service';
import { CreateMaterialEstimateDto } from '../dto/create-material-estimate.dto';
import { ApproveDto, RejectDto } from '../dto/approve.dto';

/** 3a. Material estimate — first half of the estimate → quotation flow. */
@Controller('procurement/estimates')
export class MaterialEstimateController {
  constructor(private readonly service: MaterialEstimateService) {}

  @RequirePermission('procurement-estimates:create')
  @Post()
  create(@Body() dto: CreateMaterialEstimateDto) {
    return this.service.create(dto);
  }

  @RequirePermission('procurement-estimates:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @RequirePermission('procurement-estimates:read')
  @Get('by-requirement/:materialRequirementId')
  findForRequirement(
    @Param('materialRequirementId') materialRequirementId: string,
  ) {
    return this.service.findForRequirement(materialRequirementId);
  }

  @RequirePermission('procurement-estimates:approve')
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveDto) {
    return this.service.approve(id, dto);
  }

  @RequirePermission('procurement-estimates:reject')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectDto) {
    return this.service.reject(id, dto);
  }
}
