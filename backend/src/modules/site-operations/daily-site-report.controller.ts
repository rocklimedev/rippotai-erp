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
import { DailySiteReportService } from './daily-site-report.service';
import {
  CreateDailySiteReportDto,
  UpdateDailySiteReportDto,
} from './dto/daily-report.dto';

@Controller('site-ops/daily-reports')
export class DailySiteReportController {
  constructor(private readonly reportService: DailySiteReportService) {}

  @Post()
  create(@Body() dto: CreateDailySiteReportDto) {
    return this.reportService.createReport(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDailySiteReportDto,
  ) {
    return this.reportService.updateReport(id, dto);
  }

  @Post(':id/share')
  share(@Param('id', ParseIntPipe) id: number) {
    return this.reportService.markShared(id);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.reportService.getReportOrThrow(id);
  }

  /** GET /site-ops/daily-reports/projects/:projectId?from=2026-08-01&to=2026-08-31 */
  @Get('projects/:projectId')
  list(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportService.listReports(projectId, from, to);
  }

  @Get('projects/:projectId/date/:reportDate')
  getByDate(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('reportDate') reportDate: string,
  ) {
    return this.reportService.getReportByDate(projectId, reportDate);
  }
}
