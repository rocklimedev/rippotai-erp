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
} from '@nestjs/common';
import { AdminDailyReportService } from './admin-daily-report.service';
import {
  CreateAdminDailyReportDto,
  QueryAdminDailyReportDto,
  UpdateAdminDailyReportDto,
} from './dto/admin-daily-report.dto';

// TODO: add your AuthGuard / PermissionsGuard decorators here, same as other modules.
@Controller('dpr/admin-reports')
export class AdminDailyReportController {
  constructor(private readonly service: AdminDailyReportService) {}

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
