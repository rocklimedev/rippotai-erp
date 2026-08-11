import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationRunEntity } from '../persistence/entities/automation-run.entity';
import {
  CycleDetectedError,
  ExecutionLimitReachedError,
} from '../errors/automation.errors';

export interface ChainGuardOptions {
  /** Max automation executions allowed within a single correlation chain. Default 50. */
  maxChainDepth?: number;
}

const DEFAULT_MAX_CHAIN_DEPTH = 50;

/**
 * Prevents automation A -> event -> automation B -> event -> automation A
 * loops from running forever (spec §61/§62). Depth is tracked per
 * correlationId; causationId gives an auditable chain for tracing.
 */
@Injectable()
export class CycleGuardService {
  constructor(
    @InjectRepository(AutomationRunEntity)
    private readonly runs: Repository<AutomationRunEntity>,
  ) {}

  /**
   * Computes the depth this new run would have, given the run (if any) that
   * caused it, and throws if it would exceed the configured limit.
   */
  async assertWithinLimits(
    causationRunId: string | undefined,
    correlationId: string | undefined,
    options: ChainGuardOptions = {},
  ): Promise<number> {
    const maxDepth = options.maxChainDepth ?? DEFAULT_MAX_CHAIN_DEPTH;

    if (!causationRunId) {
      return 0;
    }

    const parent = await this.runs.findOne({ where: { id: causationRunId } });
    const parentDepth = parent?.chainDepth ?? 0;
    const nextDepth = parentDepth + 1;

    if (nextDepth > maxDepth) {
      throw new ExecutionLimitReachedError(
        `Automation execution chain exceeded maximum depth (${maxDepth}) for correlationId=${correlationId ?? 'n/a'}`,
        { correlationId, maxDepth, attemptedDepth: nextDepth },
      );
    }

    if (correlationId) {
      const directCycle = await this.runs.findOne({
        where: { correlationId, automationId: parent?.automationId },
      });
      if (
        directCycle &&
        parent &&
        directCycle.automationId === parent.automationId &&
        nextDepth > 1
      ) {
        // Same automation reappearing in its own causation chain is a strong cycle signal.
        // We don't hard-fail on a single repeat (legitimate reprocessing patterns exist),
        // but combined with depth, this is surfaced via CycleDetectedError below.
      }
    }

    return nextDepth;
  }

  /**
   * Explicit A->B->A cycle check: walks up the causation chain (bounded by
   * maxDepth) looking for a run of the same automationId already present.
   */
  async detectDirectCycle(
    automationId: string,
    causationRunId: string | undefined,
    maxDepth = DEFAULT_MAX_CHAIN_DEPTH,
  ): Promise<void> {
    let currentId = causationRunId;
    let hops = 0;

    while (currentId && hops < maxDepth) {
      const run: AutomationRunEntity | null = await this.runs.findOne({
        where: { id: currentId },
      });
      if (!run) break;

      if (run.automationId === automationId) {
        throw new CycleDetectedError(
          `Automation ${automationId} appears earlier in its own causation chain`,
          { automationId, causationRunId },
        );
      }

      currentId = run.causationId ?? undefined;
      hops += 1;
    }
  }
}
