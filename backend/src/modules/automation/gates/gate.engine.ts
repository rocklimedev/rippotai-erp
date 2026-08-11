import { Injectable, Logger } from '@nestjs/common';
import { ConditionEngine } from '../conditions/condition.engine';
import { AutomationExecutionContext } from '../core/automation-context';
import { ContextProviderRegistry } from '../core/context-provider.registry';
import { GateEvaluator } from './gate.evaluator';
import {
  GateCheckResult,
  GateDefinition,
  GateMode,
  GateResult,
  GateStatus,
} from './gate.types';

/**
 * Evaluates a GateDefinition against a run/workflow's execution context.
 *
 * Never talks to a business service directly:
 *
 *   GateEngine -> ContextProviderRegistry -> AutomationContextProvider (host) -> RIPPOTAI Adapter -> RIPPOTAI Service
 *   GateEngine -> GateEvaluator -> ConditionEngine (existing, reused)
 *
 * A gate with contextRequests but no providers bound simply evaluates
 * against `{ payload, variables }` only — it degrades gracefully rather
 * than throwing, so the engine still runs standalone (spec: engine ships
 * with safe defaults when a host hasn't wired an extension point yet).
 */
@Injectable()
export class GateEngine {
  private readonly logger = new Logger(GateEngine.name);
  private readonly evaluator: GateEvaluator;

  constructor(
    private readonly conditionEngine: ConditionEngine,
    private readonly contextProviders: ContextProviderRegistry,
  ) {
    this.evaluator = new GateEvaluator(this.conditionEngine);
  }

  async evaluate(
    gate: GateDefinition,
    context: AutomationExecutionContext,
  ): Promise<GateResult> {
    try {
      const providedContext = gate.contextRequests?.length
        ? await this.contextProviders.resolveAll(context, gate.contextRequests)
        : {};

      const dataRoot: Record<string, unknown> = {
        payload: context.event?.payload ?? {},
        variables: context.variables,
        context: providedContext,
      };

      const checks: GateCheckResult[] = this.evaluator.evaluateChecks(
        gate.checks,
        dataRoot,
      );
      const passed = this.evaluator.fold(gate.mode, checks);
      const failedChecks = checks.filter((c) => !c.passed);

      const result: GateResult = {
        gateId: gate.id,
        gateName: gate.name,
        mode: gate.mode,
        status: passed ? GateStatus.PASSED : GateStatus.BLOCKED,
        checks,
        failedChecks,
        reason: passed ? undefined : this.buildReason(gate.mode, failedChecks),
      };

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Gate "${gate.id}" failed to evaluate: ${message}`);
      return {
        gateId: gate.id,
        gateName: gate.name,
        mode: gate.mode,
        status: GateStatus.ERROR,
        checks: [],
        failedChecks: [],
        error: { message },
      };
    }
  }

  /** Renders a short human-readable explanation, e.g. for the run/audit UI (spec §4). */
  private buildReason(mode: GateMode, failedChecks: GateCheckResult[]): string {
    if (failedChecks.length === 0) return '';
    if (mode === GateMode.ANY) {
      return `None of the required checks passed: ${failedChecks
        .map((c) => c.label)
        .join(', ')}.`;
    }
    return failedChecks
      .map((c) => `${c.label} has not been satisfied.`)
      .join(' ');
  }
}
