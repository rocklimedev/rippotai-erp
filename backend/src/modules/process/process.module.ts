// process.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProcessController } from './process.controller';
import { ProcessService } from './process.service';
import { ProcessPhase } from './models/process-phase.model';
import { ProcessStep } from './models/process-step.model';
import { ProcessStepTeam } from './models/process-step-team.model';
import { DeliverableType } from './models/deliverable-type.model';
import { ProcessStepDeliverable } from './models/process-step-deliverable.model';
import { ProjectPhaseProgress } from './models/project-phase-progress.model';
import { ProjectStepProgress } from './models/project-step-progress.model';
import { ProjectGateLog } from './models/project-gate-log.model';
import { TradeTeam } from './models/trade-team.model';
@Module({
  imports: [
    SequelizeModule.forFeature([
      ProcessPhase,
      TradeTeam,
      ProcessStep,
      ProcessStepTeam,
      DeliverableType,
      ProcessStepDeliverable,
      ProjectPhaseProgress,
      ProjectStepProgress,
      ProjectGateLog,
    ]),
  ],
  controllers: [ProcessController],
  providers: [ProcessService],
  exports: [ProcessService, SequelizeModule],
})
export class ProcessModule {}
