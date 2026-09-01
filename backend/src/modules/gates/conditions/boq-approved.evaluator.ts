import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { ConditionEvaluator } from './condition-evaluator.interface';

import { GateConditionType } from '@/common/enums/gates.enum';
import { GateConditionResult } from '../../../common/interfaces/gate-condition-result.interface';
import { GateCondition } from '@/modules/gates/models/gate-condition.model';
import { Boq } from '@/modules/boqs/models/boq.model';
import { BoqStatus } from '@/common/enums/boq-enums';

@Injectable()
export class BoqApprovedEvaluator implements ConditionEvaluator {
  readonly type = GateConditionType.BOQ_APPROVED;

  constructor(
    @InjectModel(Boq)
    private readonly boqModel: typeof Boq,
  ) {}

  async evaluate(
    projectId: string,
    condition: GateCondition,
  ): Promise<GateConditionResult> {
    const boq = await this.boqModel.findOne({
      where: {
        project_id: projectId,
        status: BoqStatus.APPROVED,
      },
      order: [['id', 'DESC']],
    });

    return {
      conditionId: condition.id,
      type: this.type,
      label: condition.label,
      optional: condition.optional,
      passed: !!boq,
      detail: boq
        ? 'BOQ is approved.'
        : 'No approved BOQ found for this project.',
    };
  }
}
