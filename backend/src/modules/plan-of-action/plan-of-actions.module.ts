import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { PlanOfAction } from './models/plan-of-action.model';
import { ProjectPhase } from '../projects/models/project-phase.model';
import { PlanOfActionPhase } from './models/plan-of-action-phase.model';

import { TermsTemplate } from '../metas/models/terms-templates.model';
import { TermsTemplateVersion } from '../metas/models/terms-template-version.model';

import { PlanOfActionsService } from './plan-of-actions.service';
import { PlanOfActionsController } from './plan-of-actions.controller';

import { TeamModule } from '../process-workflow/team.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PlanOfAction,
      ProjectPhase,
      PlanOfActionPhase,
      TermsTemplate,
      TermsTemplateVersion,
    ]),

    TeamModule,
  ],

  controllers: [PlanOfActionsController],

  providers: [PlanOfActionsService],

  exports: [PlanOfActionsService],
})
export class PlanOfActionsModule {}
