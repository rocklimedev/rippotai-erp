import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConditionEvaluator } from './condition-evaluator.interface';
import { GateConditionType } from '@/common/enums/gates.enum';
import { GateConditionResult } from '../../../common/interfaces/gate-condition-result.interface';
import { GateCondition } from '@/modules/gates/models/gate-condition.model';
import { GateTransitionLog } from '@/modules/gates/models/gate-transition-log.model';
import { GateTransitionAction } from '@/common/enums/gates.enum';

/**
 * No automated signal exists in the ERP schema for these (e.g. "client
 * verbally approved on-site"). A permission-holder ticks it explicitly via
 * GatesService.tickManualCondition(), which writes a
 * GateTransitionAction.MANUAL_CONDITION_TICKED row. This evaluator just reads
 * the latest tick for the (project, condition) pair.
 */
@Injectable()
export class ManualApprovalEvaluator implements ConditionEvaluator {
  readonly type = GateConditionType.MANUAL_APPROVAL;

  constructor(
    @InjectModel(GateTransitionLog)
    private readonly logModel: typeof GateTransitionLog,
  ) {}

  async evaluate(
    projectId: string,
    condition: GateCondition,
  ): Promise<GateConditionResult> {
    const latest = await this.logModel.findOne({
      where: {
        projectId,
        action: GateTransitionAction.MANUAL_CONDITION_TICKED,
      },
      order: [['createdAt', 'DESC']],
    });

    const snapshot = latest?.snapshot as any;
    const passed =
      !!latest &&
      snapshot?.conditionId === condition.id &&
      snapshot?.ticked === true;

    return {
      conditionId: condition.id,
      type: this.type,
      label: condition.label,
      optional: condition.optional,
      passed,
      detail: passed
        ? `Manually confirmed by a team member on ${latest!.createdAt.toISOString().slice(0, 10)}.`
        : 'Awaiting manual confirmation — no automated signal exists for this condition.',
    };
  }
}
