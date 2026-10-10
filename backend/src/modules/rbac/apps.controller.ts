import { RequirePermission } from '@/common/decorator/require-permission.decorator';
// modules/apps/apps.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AppsService } from './apps.service';
import { CreateAppDto, UpdateAppDto } from './dto/app.dto';
@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @RequirePermission('apps:create')
  @Post()
  create(@Body() dto: CreateAppDto) {
    return this.appsService.create(dto);
  }

  @RequirePermission('apps:read')
  @Get()
  findAll() {
    return this.appsService.findAll();
  }

  @RequirePermission('apps:read')
  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.appsService.findOne(code);
  }

  @RequirePermission('apps:update')
  @Patch(':code')
  update(@Param('code') code: string, @Body() dto: UpdateAppDto) {
    return this.appsService.update(code, dto);
  }

  @RequirePermission('apps:delete')
  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.appsService.remove(code);
  }
}
