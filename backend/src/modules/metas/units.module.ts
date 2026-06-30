import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Unit } from './models/unit.model';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';

@Module({
  imports: [SequelizeModule.forFeature([Unit])],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [UnitsService],
})
export class UnitsModule {}
