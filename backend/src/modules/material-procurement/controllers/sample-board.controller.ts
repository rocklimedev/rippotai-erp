import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { SampleBoardService } from '../services/sample-board.service';
import { CreateSampleBoardDto } from '../dto/create-sample-board.dto';
import { ApproveDto, RejectDto } from '../dto/approve.dto';

/** 2a. Sourcing & sample boards. */
@Controller('procurement/sample-boards')
export class SampleBoardController {
  constructor(private readonly service: SampleBoardService) {}

  @RequirePermission('procurement-sample-boards:create')
  @Post()
  create(@Body() dto: CreateSampleBoardDto) {
    return this.service.create(dto);
  }

  @RequirePermission('procurement-sample-boards:read')
  @Get('by-requirement/:materialRequirementId')
  findAllForRequirement(
    @Param('materialRequirementId') materialRequirementId: string,
  ) {
    return this.service.findAllForRequirement(materialRequirementId);
  }

  @RequirePermission('procurement-sample-boards:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @RequirePermission('procurement-sample-boards:approve')
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveDto) {
    return this.service.approve(id, dto);
  }

  @RequirePermission('procurement-sample-boards:reject')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectDto) {
    return this.service.reject(id, dto);
  }

  @RequirePermission('procurement-sample-boards:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
