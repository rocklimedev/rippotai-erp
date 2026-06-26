import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Setting } from './models/settings.model';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [SequelizeModule.forFeature([Setting])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
