import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SiteVisitService } from './site-visit.service';
import {
  CreateVisitAssignmentDto,
  LogSiteVisitDto,
  UpdateSiteVisitDto,
} from './dto/visit.dto';

@Controller('site-ops/visits')
export class SiteVisitController {
  constructor(private readonly visitService: SiteVisitService) {}

  // Central assignment
  @Post('assignments')
  createAssignment(@Body() dto: CreateVisitAssignmentDto) {
    return this.visitService.createAssignment(dto);
  }

  @Get('assignments/projects/:projectId')
  listAssignments(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.visitService.listAssignments(projectId);
  }

  @Patch('assignments/:id/deactivate')
  deactivateAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.visitService.deactivateAssignment(id);
  }

  // Logging
  @Post('log')
  logVisit(@Body() dto: LogSiteVisitDto) {
    return this.visitService.logVisit(dto);
  }

  @Patch('log/:id')
  updateVisit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSiteVisitDto,
  ) {
    return this.visitService.updateVisit(id, dto);
  }

  @Post('log/:id/check-in')
  checkIn(@Param('id', ParseIntPipe) id: number) {
    return this.visitService.checkIn(id);
  }

  /** GET /site-ops/visits/log/projects/:projectId?from=2026-08-01&to=2026-08-31 */
  @Get('log/projects/:projectId')
  getVisitLog(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.visitService.getVisitLog(projectId, from, to);
  }
}
