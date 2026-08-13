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
import { SiteVisitLogsService } from './site-visit-logs.service';
import { CreateSiteVisitLogDto } from './dto/create-site-visit-log.dto';
import { UpdateSiteVisitLogDto } from './dto/update-site-visit-log.dto';

@Controller('qc/site-visit-logs')
export class SiteVisitLogsController {
  constructor(private readonly siteVisitLogsService: SiteVisitLogsService) {}

  @Post()
  create(@Body() dto: CreateSiteVisitLogDto) {
    return this.siteVisitLogsService.create(dto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.siteVisitLogsService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.siteVisitLogsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSiteVisitLogDto,
  ) {
    return this.siteVisitLogsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.siteVisitLogsService.remove(id);
  }
}
