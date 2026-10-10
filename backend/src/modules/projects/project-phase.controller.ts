import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ProjectPhaseService } from './project-phase.service';

import { CreateProjectPhaseDto } from './dto/create-project-phase.dto';
import { UpdateProjectPhaseDto } from './dto/update-project-phase.dto';

@Controller('projects-phases')
export class ProjectPhaseController {
  constructor(private readonly projectPhaseService: ProjectPhaseService) {}

  // ============================================================
  // CREATE
  // POST /projects-phases
  // ============================================================

  @RequirePermission('projects-phases:create')
  @Post()
  create(@Body() dto: CreateProjectPhaseDto) {
    return this.projectPhaseService.create(dto);
  }

  // ============================================================
  // FIND ALL
  // GET /projects-phases
  // ============================================================

  @RequirePermission('projects-phases:read')
  @Get()
  findAll(@Query('search') search?: string) {
    return this.projectPhaseService.findAll(search);
  }

  // ============================================================
  // FIND ONE
  // GET /projects-phases/:id
  // ============================================================

  @RequirePermission('projects-phases:read')
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.projectPhaseService.findOne(id);
  }

  // ============================================================
  // UPDATE
  // PATCH /projects-phases/:id
  // ============================================================

  @RequirePermission('projects-phases:update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body() dto: UpdateProjectPhaseDto,
  ) {
    return this.projectPhaseService.update(id, dto);
  }

  // ============================================================
  // DELETE
  // DELETE /projects-phases/:id
  // ============================================================

  @RequirePermission('projects-phases:delete')
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.projectPhaseService.remove(id);
  }
}
