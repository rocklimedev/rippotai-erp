import { GateConditionResult } from '../../../common/interfaces/gate-condition-result.interface';
import { GateCondition } from '@/modules/gates/models/gate-condition.model';

export interface ConditionEvaluator {
  readonly type: string;
  evaluate(
    projectId: string,
    condition: GateCondition,
  ): Promise<GateConditionResult>;
}
