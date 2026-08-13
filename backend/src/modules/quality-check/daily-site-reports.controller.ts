import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DailySiteReportsService } from './daily-site-reports.service';
import { CreateDailySiteReportDto } from './dto/create-daily-site-report.dto';
import { UpdateDailySiteReportDto } from './dto/update-daily-site-report.dto';

@Controller('qc/site-reports')
export class DailySiteReportsController {
  constructor(
    private readonly dailySiteReportsService: DailySiteReportsService,
  ) {}

  @Post()
  create(@Body() dto: CreateDailySiteReportDto) {
    return this.dailySiteReportsService.create(dto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.dailySiteReportsService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dailySiteReportsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDailySiteReportDto,
  ) {
    return this.dailySiteReportsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.dailySiteReportsService.remove(id);
  }
}
