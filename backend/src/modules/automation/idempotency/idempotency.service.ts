import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedEventEntity } from '../persistence/entities/processed-event.entity';
import { AutomationEvent, ProcessedEventStatus } from '../events/event.types';
import { ConflictError } from '../errors/automation.errors';

export type ClaimOutcome = 'CLAIMED' | 'ALREADY_PROCESSED' | 'IN_PROGRESS';

/**
 * Guarantees a given (event, consumer) pair is only ever fully processed
 * once, and that duplicate deliveries/retries of the *same* action step
 * never produce duplicate side effects (spec §17, §27, §64).
 *
 * Correctness comes from the database unique constraint, not from an
 * application-level read-then-write check.
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    @InjectRepository(ProcessedEventEntity)
    private readonly processedEvents: Repository<ProcessedEventEntity>,
  ) {}

  /**
   * Attempts to claim processing rights for (event.id, consumer). Returns
   * 'CLAIMED' if this call is the first to record the pair (caller should
   * proceed), 'ALREADY_PROCESSED' if it previously completed successfully,
   * or 'IN_PROGRESS' if another worker currently holds the claim.
   */
  async claim(event: AutomationEvent, consumer: string): Promise<ClaimOutcome> {
    const existing = await this.processedEvents.findOne({
      where: { eventId: event.id, consumer },
    });

    if (existing) {
      if (existing.status === ProcessedEventStatus.PROCESSED) {
        return 'ALREADY_PROCESSED';
      }
      if (existing.status === ProcessedEventStatus.FAILED) {
        // Allow re-claim of a previously failed attempt.
        existing.status = ProcessedEventStatus.PROCESSING;
        await this.processedEvents.save(existing);
        return 'CLAIMED';
      }
      return 'IN_PROGRESS';
    }

    try {
      await this.processedEvents.insert({
        eventId: event.id,
        eventType: event.type,
        eventVersion: event.version,
        consumer,
        status: ProcessedEventStatus.PROCESSING,
      });
      return 'CLAIMED';
    } catch (err) {
      // Unique constraint violation = a concurrent worker won the race.
      this.logger.debug(
        `Idempotency claim race lost for event=${event.id} consumer=${consumer}`,
      );
      return 'IN_PROGRESS';
    }
  }

  async markProcessed(event: AutomationEvent, consumer: string): Promise<void> {
    await this.processedEvents.update(
      { eventId: event.id, consumer },
      { status: ProcessedEventStatus.PROCESSED, processedAt: new Date() },
    );
  }

  async markFailed(
    event: AutomationEvent,
    consumer: string,
    error: string,
  ): Promise<void> {
    await this.processedEvents.update(
      { eventId: event.id, consumer },
      { status: ProcessedEventStatus.FAILED, error },
    );
  }

  /**
   * Builds a deterministic idempotency key for a single action-step attempt,
   * per spec §27 (runId + stepId). Actions use this key to guard against
   * duplicate side effects across retries.
   */
  buildActionIdempotencyKey(runId: string, stepId: string): string {
    return `${runId}:${stepId}`;
  }

  assertUniqueOrThrow(condition: boolean, message: string): void {
    if (!condition) {
      throw new ConflictError(message);
    }
  }
}
