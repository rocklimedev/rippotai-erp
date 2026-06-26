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
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto, UpdateSettingDto } from './dto/setting.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  create(@Body() dto: CreateSettingDto) {
    return this.settingsService.create(dto);
  }

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.update(key, dto);
  }

  @Put(':key')
  upsert(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.upsert(key, dto.value, dto.updated_by);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}
