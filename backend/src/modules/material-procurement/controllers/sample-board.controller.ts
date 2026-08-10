import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { SampleBoardService } from '../services/sample-board.service';
import { CreateSampleBoardDto } from '../dto/create-sample-board.dto';
import { ApproveDto, RejectDto } from '../dto/approve.dto';

/** 2a. Sourcing & sample boards. */
@Controller('material-procurement/sample-boards')
export class SampleBoardController {
  constructor(private readonly service: SampleBoardService) {}

  @Post()
  create(@Body() dto: CreateSampleBoardDto) {
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
