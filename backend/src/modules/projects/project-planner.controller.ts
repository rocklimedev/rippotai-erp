import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
  ParseEnumPipe,
} from '@nestjs/common';

import { ProjectPlannerService } from './project-planner.service';

import {
  ProjectPhaseModule,
  PlannerModule,
} from '@/common/enums/project-planner.enum';

import {
  CreatePlannerTaskDto,
  UpdatePlannerTaskDto,
  UpsertFloorProgressDto,
  CloneTemplatesDto,
} from './dto/planner-task.dto';

@Controller('projects')
export class ProjectPlannerController {
  constructor(private readonly service: ProjectPlannerService) {}

  // ============================================================
  // PROJECT PLANNER PHASES
  // ============================================================

  @Get('planner/phases')
  listPhases(
    @Query('module', new ParseEnumPipe(ProjectPhaseModule))
    module: ProjectPhaseModule,
  ) {
    return this.service.listPhases(module);
  }

  // ============================================================
  // PROJECT PLANNER TASKS
  // ============================================================

  @Get(':projectId/planner/tasks')
  getTaskTree(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('module', new ParseEnumPipe(PlannerModule))
    module: PlannerModule,
  ) {
    return this.service.getTaskTree(projectId, module);
  }

  @Post(':projectId/planner/tasks')
  createTask(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreatePlannerTaskDto,
  ) {
    return this.service.createTask(projectId, dto);
  }

  @Patch('planner/tasks/:id')
  updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlannerTaskDto,
  ) {
    return this.service.updateTask(id, dto);
  }

  @Delete('planner/tasks/:id')
  deleteTask(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteTask(id);
  }

  // ============================================================
  // FLOOR PROGRESS
  // ============================================================

  @Post('planner/tasks/:id/floor-progress')
  upsertFloorProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertFloorProgressDto,
  ) {
    return this.service.upsertFloorProgress(id, dto);
  }

  // ============================================================
  // TEMPLATE CLONING
  // ============================================================

  @Post('planner/tasks/clone-from-templates')
  cloneTemplates(@Body() dto: CloneTemplatesDto) {
    return this.service.cloneTemplatesIntoProject(dto);
  }
}
