import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConditionEvaluator } from './condition-evaluator.interface';
import { GateConditionType } from '@/common/enums/gates.enum';
import { GateConditionResult } from '../../../common/interfaces/gate-condition-result.interface';
import { GateCondition } from '@/modules/gates/models/gate-condition.model';
import { Quotation } from '@/modules/quotations/models/quotations.model';

/**
 * "Every rate and every quote stays an ESTIMATE until it is approved. On
 * approval the estimate converts into the quotation." — we treat the
 * existence of at least one approved quotation on the project as the signal
 * that at least one trade/material estimate has completed that conversion.
 */
@Injectable()
export class QuotationApprovedEvaluator implements ConditionEvaluator {
  readonly type = GateConditionType.QUOTATION_APPROVED;

  constructor(
    @InjectModel(Quotation) private readonly quotationModel: typeof Quotation,
  ) {}

  async evaluate(
    projectId: string,
    condition: GateCondition,
  ): Promise<GateConditionResult> {
    const count = await this.quotationModel.count({
      where: { projectId, status: 'approved' },
    });
    const passed = count > 0;

    return {
      conditionId: condition.id,
      type: this.type,
      label: condition.label,
      optional: condition.optional,
      passed,
      detail: passed
        ? `${count} approved quotation(s) on this project.`
        : 'No quotation has been approved yet — estimates have not converted.',
    };
  }
}
