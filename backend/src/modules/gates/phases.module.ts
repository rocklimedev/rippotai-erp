import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GatePhaseDefinition } from './models/gate-phase-definition.model';
import { PhasesService } from './phases.service';
import { PhasesController } from './phases.controller';

@Module({
  imports: [SequelizeModule.forFeature([GatePhaseDefinition])],
  providers: [PhasesService],
  controllers: [PhasesController],
})
export class PhasesModule {}
