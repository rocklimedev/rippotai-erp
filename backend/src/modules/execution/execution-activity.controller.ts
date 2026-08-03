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

import { ExecutionActivityService } from './services/execution-activity.service';
import { CreateExecutionActivityDto } from './dto/create-activity.dto';
import { UpdateExecutionActivityDto } from './dto/update-activity.dto';

@Controller('execution/activities')
export class ExecutionActivityController {
  constructor(private readonly service: ExecutionActivityService) {}

  /**
   * Create Activity
   */
  @Post()
  async create(@Body() dto: CreateExecutionActivityDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  /**
   * Get Activities By Project
   */
  @Get('project/:projectId')
  async findAll(@Param('projectId') projectId: string) {
    return this.service.findAll(projectId);
  }

  /**
   * Get Activities By Stage
   */
  @Get('stage/:stageId')
  async findByStage(@Param('stageId') stageId: string) {
    return this.service.findByStage(stageId);
  }

  /**
   * Get Activity By Id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * Update Activity
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExecutionActivityDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  /**
   * Reorder Activities
   */
  @Patch('stage/:stageId/reorder')
  async reorderActivities(
    @Param('stageId') stageId: string,
    @Body() body: { activityIds: string[] },
    @Req() req: any,
  ) {
    await this.service.reorderActivities(
      stageId,
      body.activityIds,
      req.user?.id,
    );

    return {
      success: true,
      message: 'Activities reordered successfully',
    };
  }

  /**
   * Delete Activity
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.service.remove(id, req.user?.id);

    return {
      success: true,
      message: 'Activity deleted successfully',
    };
  }
}
