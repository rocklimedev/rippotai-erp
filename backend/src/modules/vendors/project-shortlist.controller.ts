import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProjectShortlistService } from './project-shortlist.service';
import { ShortlistExportService } from './shortlist-export.service';
import { CreateProjectShortlistDto } from './dto/create-project-shortlist.dto';
import { UpdateProjectShortlistDto } from './dto/update-project-shortlist.dto';
import { QueryProjectShortlistDto } from './dto/query-shortlist.dto';
import { ShortlistType } from '@/common/enums/shortlist.enums';
import { ShortlistEntryService } from './shortlist-entry.service';
import { SaveShortlistWorkspaceRowDto } from './dto/save-shortlist-workspace-row.dto';

@Controller('project-shortlists')
export class ProjectShortlistController {
  constructor(
    private readonly service: ProjectShortlistService,
    private readonly exportService: ShortlistExportService,
    private readonly entryService: ShortlistEntryService,
  ) {}

  /**
   * POST /project-shortlists
   * Create VENDOR or MATERIAL shortlist for a project (seeds 12×3 skeleton by default)
   */
  @RequirePermission('project-shortlists:create')
  @Post()
  async create(@Body() dto: CreateProjectShortlistDto) {
    // TODO: extract userId from request (JWT / session)
    return this.service.create(dto);
  }

  /**
   * GET /project-shortlists?project_id=&shortlist_type=
   */
  @RequirePermission('project-shortlists:read')
  @Get()
  async findAll(@Query() query: QueryProjectShortlistDto) {
    return this.service.findAll(query);
  }

  /**
   * GET /project-shortlists/:id
   */
  @RequirePermission('project-shortlists:read')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /**
   * GET /project-shortlists/by-project/:projectId/:type
   * Convenience: fetch by project + type
   */
  @RequirePermission('project-shortlists:read')
  @Get('by-project/:projectId/:type')
  async findByProjectAndType(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('type') type: ShortlistType,
  ) {
    return this.service.findByProjectAndType(projectId, type);
  }

  /**
   * GET /project-shortlists/:id/grid
   * Returns Excel-like grid structure for frontend rendering
   */
  @RequirePermission('project-shortlists:read')
  @Get(':id/grid')
  async getGrid(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getGridView(id);
  }

  @RequirePermission('project-shortlists:read')
  @Get(':id/workspace')
  async getWorkspace(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getGridView(id);
  }

  @RequirePermission('project-shortlists:update')
  @Put(':id/workspace/row')
  async saveWorkspaceRow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveShortlistWorkspaceRowDto,
  ) {
    await this.entryService.saveWorkspaceRow(id, dto);
    return this.service.getGridView(id);
  }

  /**
   * GET /project-shortlists/:id/export
   * Download single shortlist as Excel
   */
  @RequirePermission('project-shortlists:export')
  @Get(':id/export')
  async exportOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    await this.exportService.exportToExcel(id, res);
  }

  /**
   * GET /project-shortlists/export-both/:projectId
   * Download both VENDOR + MATERIAL sheets for a project
   */
  @RequirePermission('project-shortlists:export')
  @Get('export-both/:projectId')
  async exportBoth(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Res() res: Response,
  ) {
    await this.exportService.exportBothForProject(projectId, res);
  }

  /**
   * PUT /project-shortlists/:id
   */
  @RequirePermission('project-shortlists:update')
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectShortlistDto,
  ) {
    return this.service.update(id, dto);
  }

  /**
   * DELETE /project-shortlists/:id
   */
  @RequirePermission('project-shortlists:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
  }
}
