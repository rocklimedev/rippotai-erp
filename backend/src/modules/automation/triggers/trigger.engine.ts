import { Injectable } from '@nestjs/common';
import { AutomationEvent } from '../events/event.types';
import {
  AutomationTrigger,
  EventTrigger,
  TriggerMatchResult,
  TriggerType,
} from './trigger.types';

/**
 * Pure trigger-matching logic. The engine does not know what an event TYPE
 * means semantically — it only compares strings/versions (spec §13).
 */
@Injectable()
export class TriggerEngine {
  matchesEvent(
    trigger: AutomationTrigger,
    event: AutomationEvent,
  ): TriggerMatchResult {
    if (trigger.type !== TriggerType.EVENT) {
      return {
        matched: false,
        reason: `Trigger type ${trigger.type} does not match incoming events`,
      };
    }

    const eventTrigger = trigger as EventTrigger;

    if (eventTrigger.eventType !== event.type) {
      return { matched: false, reason: 'Event type mismatch' };
    }

    const compatibleVersions = eventTrigger.eventVersions ?? [1];
    if (!compatibleVersions.includes(event.version)) {
      return {
        matched: false,
        reason: `Event version ${event.version} not in compatible set [${compatibleVersions.join(', ')}]`,
      };
    }

    return { matched: true };
  }

  isManual(trigger: AutomationTrigger): boolean {
    return trigger.type === TriggerType.MANUAL;
  }

  isScheduled(trigger: AutomationTrigger): boolean {
    return trigger.type === TriggerType.SCHEDULE;
  }

  isDeadlineBased(trigger: AutomationTrigger): boolean {
    return (
      trigger.type === TriggerType.DEADLINE ||
      trigger.type === TriggerType.DEADLINE_APPROACHING
    );
  }
}
