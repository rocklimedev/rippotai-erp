import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConditionEvaluator } from './condition-evaluator.interface';
import { GateConditionType } from '@/common/enums/gates.enum';
import { GateConditionResult } from '../../../common/interfaces/gate-condition-result.interface';
import { GateCondition } from '@/modules/gates/models/gate-condition.model';
import { PaymentSchedule } from '@/modules/payments/models/payment-schedule.model';
import { PaymentScheduleMilestone } from '@/modules/payments/models/payment-schedule-milestone.model';

@Injectable()
export class PaymentMilestonePaidEvaluator implements ConditionEvaluator {
  readonly type = GateConditionType.PAYMENT_MILESTONE_PAID;

  constructor(
    @InjectModel(PaymentSchedule)
    private readonly scheduleModel: typeof PaymentSchedule,
    @InjectModel(PaymentScheduleMilestone)
    private readonly milestoneModel: typeof PaymentScheduleMilestone,
  ) {}

  async evaluate(
    projectId: string,
    condition: GateCondition,
  ): Promise<GateConditionResult> {
    const milestoneCode: string = condition.params?.milestoneCode;

    const schedules = await this.scheduleModel.findAll({
      where: { projectId },
    });
    const scheduleIds = schedules.map((s) => s.id);

    if (scheduleIds.length === 0) {
      return this.result(
        condition,
        false,
        'No payment schedule exists for this project yet.',
      );
    }

    const milestone = await this.milestoneModel.findOne({
      where: { paymentScheduleId: scheduleIds, milestoneCode },
      order: [['updatedAt', 'DESC']],
    });

    const passed = milestone?.status === 'PAID';

    return this.result(
      condition,
      passed,
      milestone
        ? `Milestone "${milestoneCode}" is ${milestone.status}${milestone.paidAt ? ` (paid ${milestone.paidAt.toISOString().slice(0, 10)})` : ''}.`
        : `No payment milestone with code "${milestoneCode}" found.`,
    );
  }

  private result(
    condition: GateCondition,
    passed: boolean,
    detail: string,
  ): GateConditionResult {
    return {
      conditionId: condition.id,
      type: this.type,
      label: condition.label,
      optional: condition.optional,
      passed,
      detail,
    };
  }
}
