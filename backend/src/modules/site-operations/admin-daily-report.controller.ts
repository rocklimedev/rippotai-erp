import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { AdminDprDocumentService } from './admin-dpr-document.service';
import type { Response } from 'express';
import { Res } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
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
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminDailyReportService } from './admin-daily-report.service';
import {
  CreateAdminDailyReportDto,
  QueryAdminDailyReportDto,
  UpdateAdminDailyReportDto,
} from './dto/admin-daily-report.dto';

@UseGuards(JwtAuthGuard)
@Controller('dpr/admin-reports')
export class AdminDailyReportController {
  constructor(
    private readonly service: AdminDailyReportService,
    private readonly documents: AdminDprDocumentService,
  ) {}

  @RequirePermission('dpr-admin-reports:create')
  @Post()
  create(@Body() dto: CreateAdminDailyReportDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @RequirePermission('dpr-admin-reports:read')
  @Get()
  findAll(@Query() query: QueryAdminDailyReportDto) {
    return this.service.findAll(query);
  }

  @RequirePermission('dpr-admin-reports:read')
  @Get('summary')
  summary(@Query('date') date: string = new Date().toISOString().slice(0, 10)) {
    return this.service.daySummary(date);
  }

  @RequirePermission('dpr-admin-reports:export')
  @Get('export')
  async export(
    @Query() query: QueryAdminDailyReportDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const saved = await this.documents.create(query, req.user);
    const row = await this.documents.download(saved.id);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${row.filename}"`,
    );
    res.send(row.excel_data);
  }

  @RequirePermission('dpr-admin-reports:read')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @RequirePermission('dpr-admin-reports:update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDailyReportDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @RequirePermission('dpr-admin-reports:delete')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
