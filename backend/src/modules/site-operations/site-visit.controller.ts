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
import { SiteVisitService } from './site-visit.service';
import {
  CreateSiteVisitDto,
  GenerateProjectVisitsDto,
  QuerySiteVisitDto,
  UpdateSiteVisitDto,
} from './dto/site-visit.dto';

// TODO: add your AuthGuard / PermissionsGuard
@Controller('architect/visits')
export class SiteVisitController {
  constructor(private readonly service: SiteVisitService) {}

  @Post()
  create(@Body() dto: CreateSiteVisitDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Post('generate')
  generate(@Body() dto: GenerateProjectVisitsDto, @Req() req: any) {
    return this.service.generateForProject(dto, req.user?.id);
  }

  @Get()
  findAll(@Query() q: QuerySiteVisitDto) {
    return this.service.findAll(q);
  }

  @Get('progress/:projectId')
  progress(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.service.projectProgress(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSiteVisitDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
