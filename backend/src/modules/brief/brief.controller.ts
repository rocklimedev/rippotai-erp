import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUserPayload } from '@/common/interfaces/current-user-payload.interface';
import { UpdateBriefStatusDto } from './dto/update-brief-status.dto';
import {
  Body,
  Req,
  UseGuards,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ProjectBriefsService } from './brief.service';

import { CreateProjectBriefDto } from './dto/create-project-brief.dto';
import { UpdateProjectBriefDto } from './dto/update-project-brief.dto';

@UseGuards(JwtAuthGuard)
@Controller('project-briefs')
export class ProjectBriefsController {
  constructor(private readonly projectBriefsService: ProjectBriefsService) {}

  // =========================================================
  // CREATE
  // =========================================================

  @Post()
  create(@Body() dto: CreateProjectBriefDto) {
    return this.projectBriefsService.create(dto);
  }

  // =========================================================
  // LIST
  // =========================================================

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.projectBriefsService.findAll(projectId);
  }

  // =========================================================
  // LATEST BY PROJECT
  // =========================================================

  @Get('project/:projectId/latest')
  findLatestByProject(@Param('projectId') projectId: string) {
    return this.projectBriefsService.findLatestByProject(projectId);
  }

  // =========================================================
  // DETAIL
  // =========================================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectBriefsService.findOne(id);
  }

  // =========================================================
  // UPDATE
  // =========================================================

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectBriefDto) {
    return this.projectBriefsService.update(id, dto);
  }

  // =========================================================
  // STATUS
  // =========================================================

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateBriefStatusDto,
    @Req() req: { user: CurrentUserPayload },
  ) {
    return this.projectBriefsService.updateStatus(id, body.status, req.user.id, req.user.permissions);
  }

  // =========================================================
  // NEW VERSION
  // =========================================================

  @Post(':id/new-version')
  createNewVersion(@Param('id') id: string) {
    return this.projectBriefsService.createNewVersion(id);
  }

  // =========================================================
  // DELETE
  // =========================================================

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectBriefsService.remove(id);
  }
}
