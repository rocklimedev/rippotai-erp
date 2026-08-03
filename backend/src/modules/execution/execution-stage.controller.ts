import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';

import { ExecutionStageService } from './services/execution-stage.service';
import { CreateExecutionStageDto } from '@/modules/projects/dto/create-stage.dto';
import { UpdateExecutionStageDto } from '@/modules/projects/dto/update-stage.dto';

@Controller('execution/stages')
export class ExecutionStageController {
  constructor(private readonly service: ExecutionStageService) {}

  /**
   * Create Stage
   */
  @Post()
  async create(@Body() dto: CreateExecutionStageDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  /**
   * Get Stages By Project
   */
  @Get('project/:projectId')
  async findAll(@Param('projectId') projectId: string) {
    return this.service.findAll(projectId);
  }

  /**
   * Get Stage By Id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * Update Stage
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExecutionStageDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  /**
   * Reorder Stages
   */
  @Patch('project/:projectId/reorder')
  async reorderStages(
    @Param('projectId') projectId: string,
    @Body() body: { stageIds: string[] },
    @Req() req: any,
  ) {
    await this.service.reorderStages(projectId, body.stageIds, req.user?.id);

    return {
      success: true,
      message: 'Stages reordered successfully',
    };
  }

  /**
   * Delete Stage
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.service.remove(id, req.user?.id);

    return {
      success: true,
      message: 'Stage deleted successfully',
    };
  }
}
