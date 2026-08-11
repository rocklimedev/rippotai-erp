import { ConditionEngine } from '../conditions/condition.engine';
import { LogicalOperator } from '../conditions/condition.types';
import { GateCheck, GateCheckResult, GateMode } from './gate.types';

/**
 * Translates each GateCheck into a single-leaf Condition Engine evaluation
 * and folds the results per the gate's mode (ALL/ANY). Contains NO
 * comparison logic of its own — spec §6 requires reusing the existing
 * Condition Engine and operator set rather than duplicating it.
 */
export class GateEvaluator {
  constructor(private readonly conditionEngine: ConditionEngine) {}

  evaluateChecks(
    checks: GateCheck[],
    dataRoot: Record<string, unknown>,
  ): GateCheckResult[] {
    return checks.map((check) => {
      const outcome = this.conditionEngine.evaluate(
        {
          operator: LogicalOperator.AND,
          conditions: [
            { path: check.path, operator: check.operator, value: check.value },
          ],
        },
        dataRoot,
      );

      // Single-leaf AND group -> exactly one child result, which is the leaf result.
      const leaf = (outcome.result as { results: Array<{ actual: unknown }> })
        .results[0] as unknown as { actual: unknown };

      return {
        label: check.label,
        path: check.path,
        operator: check.operator,
        expected: check.value,
        actual: leaf.actual,
        passed: outcome.passed,
      } as GateCheckResult;
    });
  }

  fold(mode: GateMode, results: GateCheckResult[]): boolean {
    if (results.length === 0) return true;
    return mode === GateMode.ANY
      ? results.some((r) => r.passed)
      : results.every((r) => r.passed);
  }
}
