import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { SettingsService } from './settings.service';
import { CreateSettingDto, UpdateSettingDto } from './dto/setting.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @RequirePermission('settings:create')
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateSettingDto) {
    return this.settingsService.create(dto);
  }

  @RequirePermission('settings:read')
  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @RequirePermission('settings:read')
  @Get(':key')
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @RequirePermission('settings:update')
  @Patch(':key')
  @UseGuards(JwtAuthGuard)
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.update(key, dto);
  }

  @RequirePermission('settings:update')
  @Put(':key')
  @UseGuards(JwtAuthGuard)
  upsert(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.upsert(key, dto.value, dto.updated_by);
  }

  @RequirePermission('settings:delete')
  @Delete(':key')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}
