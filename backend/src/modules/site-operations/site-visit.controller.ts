import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SiteVisitService } from './site-visit.service';
import {
  CreateVisitAssignmentDto,
  LogSiteVisitDto,
  UpdateSiteVisitDto,
  UpdateVisitAssignmentDto,
} from './dto/visit.dto';

@Controller('site-ops/visits')
export class SiteVisitController {
  constructor(private readonly visitService: SiteVisitService) {}

  // Central assignment
  @RequirePermission('site-ops-visits:assign')
  @Post('assignments')
  createAssignment(@Body() dto: CreateVisitAssignmentDto) {
    return this.visitService.createAssignment(dto);
  }

  @RequirePermission('site-ops-visits:read')
  @Get('assignments')
  listAllAssignments(
    @Query('projectId', new ParseUUIDPipe({ optional: true }))
    projectId?: string,
  ) {
    return this.visitService.listAssignments(projectId);
  }

  @RequirePermission('site-ops-visits:assign')
  @Patch('assignments/:id')
  updateAssignment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVisitAssignmentDto,
  ) {
    return this.visitService.updateAssignment(id, dto);
  }

  @RequirePermission('site-ops-visits:read')
  @Get('assignments/projects/:projectId')
  listAssignments(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.visitService.listAssignments(projectId);
  }

  @RequirePermission('site-ops-visits:assign')
  @Patch('assignments/:id/deactivate')
  deactivateAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.visitService.deactivateAssignment(id);
  }

  // Logging
  @RequirePermission('site-ops-visits:read')
  @Get('log')
  listVisitLogs(
    @Query('projectId', new ParseUUIDPipe({ optional: true }))
    projectId?: string,
  ) {
    return this.visitService.getVisitLog(projectId);
  }

  @RequirePermission('site-ops-visits:read')
  @Get('log/:id')
  getVisit(@Param('id', ParseIntPipe) id: number) {
    return this.visitService.getVisit(id);
  }

  @RequirePermission('site-ops-visits:create')
  @Post('log')
  logVisit(@Body() dto: LogSiteVisitDto) {
    return this.visitService.logVisit(dto);
  }

  @RequirePermission('site-ops-visits:update')
  @Patch('log/:id')
  updateVisit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSiteVisitDto,
  ) {
    return this.visitService.updateVisit(id, dto);
  }

  @RequirePermission('site-ops-visits:check-in')
  @Post('log/:id/check-in')
  checkIn(@Param('id', ParseIntPipe) id: number) {
    return this.visitService.checkIn(id);
  }

  /** GET /site-ops/visits/log/projects/:projectId?from=2026-08-01&to=2026-08-31 */
  @RequirePermission('site-ops-visits:read')
  @Get('log/projects/:projectId')
  getVisitLog(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.visitService.getVisitLog(projectId, from, to);
  }
}
