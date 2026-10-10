import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { QueryAdminDailyReportDto } from './dto/admin-daily-report.dto';
import { AdminDprDocumentService } from './admin-dpr-document.service';

@UseGuards(JwtAuthGuard)
@Controller('dpr/admin-documents')
export class AdminDprDocumentController {
  constructor(private readonly service: AdminDprDocumentService) {}
  @RequirePermission('dpr-admin-documents:create')
  @Post() create(@Body() query: QueryAdminDailyReportDto, @Req() req: any) {
    return this.service.create(query, req.user);
  }
  @RequirePermission('dpr-admin-documents:read')
  @Get() list(@Query() query: QueryAdminDailyReportDto) {
    return this.service.list(query);
  }
  @RequirePermission('dpr-admin-documents:export')
  @Get(':id/export')
  async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const row = await this.service.download(id);
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
  @RequirePermission('dpr-admin-documents:read')
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}
