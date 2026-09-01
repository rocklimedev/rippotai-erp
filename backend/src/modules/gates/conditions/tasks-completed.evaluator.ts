import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ConditionEvaluator } from './condition-evaluator.interface';
import { GateConditionType } from '@/common/enums/gates.enum';
import { GateConditionResult } from '../../../common/interfaces/gate-condition-result.interface';
import { GateCondition } from '@/modules/gates/models/gate-condition.model';
import { Task } from '@/modules/tasks/models/task.model';

@Injectable()
export class TasksCompletedEvaluator implements ConditionEvaluator {
  readonly type = GateConditionType.TASKS_COMPLETED;

  constructor(@InjectModel(Task) private readonly taskModel: typeof Task) {}

  async evaluate(
    projectId: string,
    condition: GateCondition,
  ): Promise<GateConditionResult> {
    const titleContains: string | undefined = condition.params?.titleContains;

    const where: any = { projectId };
    if (titleContains) where.title = { [Op.like]: `%${titleContains}%` };

    const total = await this.taskModel.count({ where });
    const completed = await this.taskModel.count({
      where: { ...where, status: 'completed' },
    });
    const passed = total > 0 && completed === total;

    return {
      conditionId: condition.id,
      type: this.type,
      label: condition.label,
      optional: condition.optional,
      passed,
      detail:
        total === 0
          ? 'No matching tasks found.'
          : `${completed}/${total} matching tasks completed.`,
    };
  }
}
