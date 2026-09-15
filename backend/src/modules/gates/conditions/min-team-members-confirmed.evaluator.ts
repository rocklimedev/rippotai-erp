import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { ConditionEvaluator } from './condition-evaluator.interface';
import { GateConditionType } from '@/common/enums/gates.enum';
import { GateConditionResult } from '@/common/interfaces/gate-condition-result.interface';
import { GateCondition } from '@/modules/gates/models/gate-condition.model';
import { TeamMember } from '@/modules/users/models/team-member.model';
import { TeamMemberOwnerType } from '@/common/enums/team.enums';

/**
 * Counts distinct team_members.role_label values starting with a prefix
 * (e.g. "CONTRACTOR:") attached to this project
 * (owner_type=PROJECT).
 *
 * Because TeamMember uses paranoid: true, soft-deleted records are
 * automatically excluded by Sequelize.
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
    // ============================================================
    // CONDITION PARAMETERS
    // ============================================================

    const prefix = condition.params?.roleLabelPrefix ?? '';

    const minCount = Number(condition.params?.minCount ?? 1);

    // ============================================================
    // GET PROJECT TEAM MEMBERS
    // ============================================================

    const rows = await this.teamMemberModel.findAll({
      where: {
        owner_type: TeamMemberOwnerType.PROJECT,
        owner_id: projectId,

        role_label: {
          [Op.like]: `${prefix}%`,
        },
      },

      attributes: ['id', 'user_id', 'role_label'],
    });

    // ============================================================
    // COUNT DISTINCT ROLES
    // ============================================================

    const distinctTrades = new Set(
      rows
        .map((row) => row.role_label)
        .filter((role): role is string => Boolean(role)),
    ).size;

    // ============================================================
    // EVALUATE CONDITION
    // ============================================================

    const passed = distinctTrades >= minCount;

    // ============================================================
    // RESULT
    // ============================================================

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
        roleLabelPrefix: prefix,
        projectId,
      },
    };
  }
}
