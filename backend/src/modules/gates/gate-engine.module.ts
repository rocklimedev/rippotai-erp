import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { GateDefinition } from './models/gate-definition.model';
import { GateCondition } from './models/gate-condition.model';
import { ProjectGate } from './models/project-gate.model';
import { GateTransitionLog } from './models/gate-transition-log.model';
import { Project } from '@/modules/projects/models/projects.model';
import { Document } from '@/modules/documents/models/document.model';
import { DocumentType } from '@/modules/documents/models/document-type.model';
import { DocumentRequirement } from '@/modules/documents/models/document-requirement.model';
import { PaymentSchedule } from '@/modules/payments/models/payment-schedule.model';
import { PaymentScheduleMilestone } from '@/modules/payments/models/payment-schedule-milestone.model';
import { Quotation } from '@/modules/quotations/models/quotations.model';
import { Boq } from '@/modules/boqs/models/boq.model';
import { TeamMember } from '@/modules/users/models/team-member.model';
import { Task } from '@/modules/tasks/models/task.model';

import { GateEngineService } from './gate-engine.service';
import { ConditionRegistry } from './conditions/condition-registry';
import { DocumentApprovedEvaluator } from './conditions/document-approved.evaluator';
import { DocumentTypeAllApprovedEvaluator } from './conditions/document-type-all-approved.evaluator';
import { PaymentMilestonePaidEvaluator } from './conditions/payment-milestone-paid.evaluator';
import { QuotationApprovedEvaluator } from './conditions/quotation-approved.evaluator';
import { BoqApprovedEvaluator } from './conditions/boq-approved.evaluator';
import { MinTeamMembersConfirmedEvaluator } from './conditions/min-team-members-confirmed.evaluator';
import { TasksCompletedEvaluator } from './conditions/tasks-completed.evaluator';
import { ManualApprovalEvaluator } from './conditions/manual-approval.evaluator';
import { ActivityLogsModule } from '@/modules/engagement/activity-logs.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      GateDefinition,
      GateCondition,
      ProjectGate,
      GateTransitionLog,
      Project,
      Document,
      DocumentType,
      DocumentRequirement,
      PaymentSchedule,
      PaymentScheduleMilestone,
      Quotation,
      Boq,
      TeamMember,
      Task,
    ]),
    ActivityLogsModule,
  ],
  providers: [
    GateEngineService,
    ConditionRegistry,
    DocumentApprovedEvaluator,
    DocumentTypeAllApprovedEvaluator,
    PaymentMilestonePaidEvaluator,
    QuotationApprovedEvaluator,
    BoqApprovedEvaluator,
    MinTeamMembersConfirmedEvaluator,
    TasksCompletedEvaluator,
    ManualApprovalEvaluator,
  ],
  exports: [GateEngineService],
})
export class GateEngineModule {}
