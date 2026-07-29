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

  @Post()
  create(@Body() dto: CreateAppDto) {
    return this.appsService.create(dto);
  }

  @Get()
  findAll() {
    return this.appsService.findAll();
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.appsService.findOne(code);
  }

  @Patch(':code')
  update(@Param('code') code: string, @Body() dto: UpdateAppDto) {
    return this.appsService.update(code, dto);
  }

  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.appsService.remove(code);
  }
}
