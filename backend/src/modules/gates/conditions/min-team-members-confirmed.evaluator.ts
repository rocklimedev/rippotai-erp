import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { ConditionEvaluator } from './condition-evaluator.interface';
import { GateConditionType } from '@/common/enums/gates.enum';
import { GateConditionResult } from '../../../common/interfaces/gate-condition-result.interface';
import { GateCondition } from '@/modules/gates/models/gate-condition.model';
import { TeamMember } from '@/modules/users/models/team-member.model';
import { TeamMemberOwnerType } from '@/common/enums/team.enums';

/**
 * Counts distinct team_members.role_label values starting with a prefix
 * (e.g. "CONTRACTOR:") attached to this project (owner_type=PROJECT),
 * not soft-deleted.
 *
 * Used to verify all required contractor trades are confirmed before
 * CONTRACTOR_LINEUP_HANDOFF.
 */
@Injectable()
export class MinTeamMembersConfirmedEvaluator implements ConditionEvaluator {
  readonly type = GateConditionType.MIN_TEAM_MEMBERS_CONFIRMED;

  constructor(
    @InjectModel(TeamMember)
    private readonly teamMemberModel: typeof TeamMember,
  ) {}

  async evaluate(
    projectId: string,
    condition: GateCondition,
  ): Promise<GateConditionResult> {
    const prefix: string = condition.params?.roleLabelPrefix ?? '';
    const minCount: number = condition.params?.minCount ?? 1;

    const rows = await this.teamMemberModel.findAll({
      where: {
        owner_type: TeamMemberOwnerType.PROJECT,
        owner_id: projectId,
        role_label: {
          [Op.like]: `${prefix}%`,
        },
        deleted_at: null,
      },
    });

    const distinctTrades = new Set(rows.map((row) => row.role_label)).size;

    const passed = distinctTrades >= minCount;

    return {
      conditionId: condition.id,
      type: this.type,
      label: condition.label,
      optional: condition.optional,
      passed,
      detail: `${distinctTrades}/${minCount} required trades confirmed.`,
      meta: {
        distinctTrades,
        minCount,
      },
    };
  }
}
