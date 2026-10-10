import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DailySiteReportService } from './daily-site-report.service';
import { SiteOpsDashboardService } from './site-ops-dashboard.service';
import { CdnService } from '../cdn/cdn.service';
import {
  CreateDailySiteReportDto,
  UpdateDailySiteReportDto,
} from './dto/daily-report.dto';

@Controller('site-ops/daily-reports')
export class DailySiteReportController {
  constructor(
    private readonly reportService: DailySiteReportService,
    private readonly cdn: CdnService,
  ) {}

  /** GET /site-ops/daily-reports?projectId=&from=&to=&status=&hasIssues=true */
  @Get()
  listAll(
    @Query('projectId') projectId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('hasIssues') hasIssues?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportService.listReports({
      projectId: projectId || undefined,
      from: from || undefined,
      to: to || undefined,
      status: status || undefined,
      hasIssues: hasIssues === 'true' || hasIssues === '1',
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post()
  create(@Body() dto: CreateDailySiteReportDto) {
    return this.reportService.createReport(dto);
  }

  /** Site photo upload (multipart `file`) → { url, filename }. Stored through the shared CDN service. */
  @Post('photos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.size) throw new BadRequestException('File is required');
    if (!/^image\//.test(file.mimetype)) {
      throw new BadRequestException('Only image files can be attached');
    }
    const res = await this.cdn.uploadFile(file);
    return { ...res, originalName: file.originalname };
  }

  /** GET /site-ops/daily-reports/projects/:projectId?from=2026-08-01&to=2026-08-31 */
  @Get('projects/:projectId')
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportService.listReports({ projectId, from, to });
  }

  @Get('projects/:projectId/date/:reportDate')
  getByDate(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('reportDate') reportDate: string,
  ) {
    return this.reportService.getReportByDate(projectId, reportDate);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportService.getReportOrThrow(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDailySiteReportDto,
  ) {
    return this.reportService.updateReport(id, dto);
  }

  @Post(':id/share')
  share(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportService.markShared(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportService.deleteReport(id);
  }
}

/** GET /site-ops/dashboard — numbers + recent rows for the Site Operations dashboard widgets. */
@Controller('site-ops')
export class SiteOpsDashboardController {
  constructor(private readonly dashboard: SiteOpsDashboardService) {}

  @Get('dashboard')
  get(@Query('projectId') projectId?: string) {
    return this.dashboard.getDashboard(projectId || undefined);
  }
}
