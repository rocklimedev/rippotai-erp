import { AdminDprExportService } from './admin-dpr-export.service';
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
  constructor(private readonly service: AdminDailyReportService, private readonly exporter: AdminDprExportService) {}

  @Post()
  create(@Body() dto: CreateAdminDailyReportDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  findAll(@Query() query: QueryAdminDailyReportDto) {
    return this.service.findAll(query);
  }

  @Get('summary')
  summary(@Query('date') date: string = new Date().toISOString().slice(0, 10)) {
    return this.service.daySummary(date);
  }

  @Get('export')
  async export(@Query() query: QueryAdminDailyReportDto, @Res() res: Response) {
    const buffer = await this.exporter.export(query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="admin-dpr.xlsx"');
    res.send(Buffer.from(buffer));
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDailyReportDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
