import { Injectable } from '@nestjs/common';
import { ConditionEngine } from '../conditions/condition.engine';
import { ConditionEvaluationOutcome } from '../conditions/condition.types';
import { AutomationVersionEntity } from '../persistence/entities/automation-version.entity';
import { AutomationEvent } from '../events/event.types';

export interface RuleEvaluationResult {
  shouldRun: boolean;
  conditionOutcome: ConditionEvaluationOutcome;
}

/**
 * Sits between trigger matching and workflow/action execution: given a
 * version whose trigger has already matched, decides whether its declared
 * conditions are satisfied for this specific event.
 */
@Injectable()
export class RuleEngine {
  constructor(private readonly conditionEngine: ConditionEngine) {}

  evaluate(
    version: AutomationVersionEntity,
    event: AutomationEvent,
    variables: Record<string, unknown> = {},
  ): RuleEvaluationResult {
    const dataRoot = {
      payload: event.payload,
      event: {
        type: event.type,
        source: event.source,
        tenantId: event.tenantId ?? null,
      },
      variables,
    };

    const outcome = this.conditionEngine.evaluate(
      version.conditions ?? undefined,
      dataRoot,
    );

    return { shouldRun: outcome.passed, conditionOutcome: outcome };
  }
}
