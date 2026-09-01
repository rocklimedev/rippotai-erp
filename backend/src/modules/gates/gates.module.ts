import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { GateEngineModule } from './gate-engine.module';
import { GatesController } from './gates.controller';

import { GatePhaseDefinition } from './models/gate-phase-definition.model';

@Module({
  imports: [
    SequelizeModule.forFeature([GatePhaseDefinition]),

    GateEngineModule,
  ],

  controllers: [GatesController],
})
export class GatesModule {}
