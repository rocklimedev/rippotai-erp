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
import { AdminDailyLogService } from './admin-daily-log.service';
import {
  CreateAdminDailyLogDto,
  QueryAdminDailyLogDto,
  UpdateAdminDailyLogDto,
} from './dto/admin-daily-log.dto';

@UseGuards(JwtAuthGuard)
@Controller('dpr/admin-logs')
export class AdminDailyLogController {
  constructor(private readonly service: AdminDailyLogService) {}

  @Post()
  create(@Body() dto: CreateAdminDailyLogDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  findAll(@Query() query: QueryAdminDailyLogDto) {
    return this.service.findAll(query);
  }

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDailyLogDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
