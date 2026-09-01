import { Injectable } from '@nestjs/common';
import { ConditionEvaluator } from './condition-evaluator.interface';
import { DocumentApprovedEvaluator } from './document-approved.evaluator';
import { DocumentTypeAllApprovedEvaluator } from './document-type-all-approved.evaluator';
import { PaymentMilestonePaidEvaluator } from './payment-milestone-paid.evaluator';
import { QuotationApprovedEvaluator } from './quotation-approved.evaluator';
import { BoqApprovedEvaluator } from './boq-approved.evaluator';
import { MinTeamMembersConfirmedEvaluator } from './min-team-members-confirmed.evaluator';
import { TasksCompletedEvaluator } from './tasks-completed.evaluator';
import { ManualApprovalEvaluator } from './manual-approval.evaluator';

@Injectable()
export class ConditionRegistry {
  private readonly evaluators = new Map<string, ConditionEvaluator>();

  constructor(
    documentApproved: DocumentApprovedEvaluator,
    documentTypeAllApproved: DocumentTypeAllApprovedEvaluator,
    paymentMilestonePaid: PaymentMilestonePaidEvaluator,
    quotationApproved: QuotationApprovedEvaluator,
    boqApproved: BoqApprovedEvaluator,
    minTeamMembersConfirmed: MinTeamMembersConfirmedEvaluator,
    tasksCompleted: TasksCompletedEvaluator,
    manualApproval: ManualApprovalEvaluator,
  ) {
    for (const evaluator of [
      documentApproved,
      documentTypeAllApproved,
      paymentMilestonePaid,
      quotationApproved,
      boqApproved,
      minTeamMembersConfirmed,
      tasksCompleted,
      manualApproval,
    ]) {
      this.evaluators.set(evaluator.type, evaluator);
    }
  }

  resolve(type: string): ConditionEvaluator {
    const evaluator = this.evaluators.get(type);
    if (!evaluator) {
      throw new Error(`No condition evaluator registered for type "${type}".`);
    }
    return evaluator;
  }
}
