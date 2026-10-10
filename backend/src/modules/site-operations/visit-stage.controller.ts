import { RequirePermission } from '@/common/decorator/require-permission.decorator';
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
} from '@nestjs/common';
import { VisitStageService } from './visit-stage.service';
import {
  CreateVisitStageDto,
  UpdateVisitStageDto,
} from './dto/visit-stage.dto';

// TODO: add your AuthGuard / PermissionsGuard (admin-only for writes)
@Controller('architect/visit-stages')
export class VisitStageController {
  constructor(private readonly service: VisitStageService) {}

  @RequirePermission('architect-visit-stages:read')
  @Get()
  findAll(@Query('include_inactive') inc?: string) {
    return this.service.findAll(inc === 'true');
  }

  @RequirePermission('architect-visit-stages:read')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @RequirePermission('architect-visit-stages:create')
  @Post()
  create(@Body() dto: CreateVisitStageDto) {
    return this.service.create(dto);
  }

  @RequirePermission('architect-visit-stages:update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVisitStageDto,
  ) {
    return this.service.update(id, dto);
  }

  @RequirePermission('architect-visit-stages:delete')
  @Delete(':id')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(id);
  }
}
