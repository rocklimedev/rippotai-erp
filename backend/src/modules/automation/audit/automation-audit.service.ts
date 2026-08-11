import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type {
  AuditEntry,
  AutomationAuditSink,
} from '../interfaces/extension-points';
import { AUTOMATION_AUDIT_SINK } from '../interfaces/tokens';

export enum AutomationAuditEventType {
  AUTOMATION_CREATED = 'AUTOMATION_CREATED',
  AUTOMATION_UPDATED = 'AUTOMATION_UPDATED',
  AUTOMATION_ENABLED = 'AUTOMATION_ENABLED',
  AUTOMATION_DISABLED = 'AUTOMATION_DISABLED',
  AUTOMATION_STARTED = 'AUTOMATION_STARTED',
  AUTOMATION_COMPLETED = 'AUTOMATION_COMPLETED',
  AUTOMATION_FAILED = 'AUTOMATION_FAILED',
  AUTOMATION_CANCELLED = 'AUTOMATION_CANCELLED',
  AUTOMATION_RETRIED = 'AUTOMATION_RETRIED',
  WORKFLOW_STARTED = 'WORKFLOW_STARTED',
  WORKFLOW_COMPLETED = 'WORKFLOW_COMPLETED',
  WORKFLOW_FAILED = 'WORKFLOW_FAILED',
  WORKFLOW_WAITING = 'WORKFLOW_WAITING',
  WORKFLOW_RESUMED = 'WORKFLOW_RESUMED',
  WORKFLOW_CANCELLED = 'WORKFLOW_CANCELLED',
  ACTION_STARTED = 'ACTION_STARTED',
  ACTION_EXECUTED = 'ACTION_EXECUTED',
  ACTION_FAILED = 'ACTION_FAILED',
  GATE_EVALUATED = 'GATE_EVALUATED',
  DECISION_EVALUATED = 'DECISION_EVALUATED',
  PARALLEL_STARTED = 'PARALLEL_STARTED',
  PARALLEL_BRANCH_COMPLETED = 'PARALLEL_BRANCH_COMPLETED',
  PARALLEL_JOINED = 'PARALLEL_JOINED',
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED',
  APPROVAL_COMPLETED = 'APPROVAL_COMPLETED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
  ESCALATION_TRIGGERED = 'ESCALATION_TRIGGERED',
  WORKFLOW_TIMED_OUT = 'WORKFLOW_TIMED_OUT',
}

/**
 * Default audit sink is structured logging. A host app binds its own
 * AutomationAuditSink (e.g. writing to its existing audit-log service) via
 * the AUTOMATION_AUDIT_SINK token — the engine never talks to a
 * business-specific audit table directly (spec §51).
 */
@Injectable()
export class AutomationAuditService {
  private readonly logger = new Logger('AutomationAudit');

  constructor(
    @Optional()
    @Inject(AUTOMATION_AUDIT_SINK)
    private readonly sink?: AutomationAuditSink,
  ) {}

  async record(
    type: AutomationAuditEventType,
    data: Omit<AuditEntry, 'type' | 'occurredAt'>,
  ): Promise<void> {
    const entry: AuditEntry = {
      type,
      occurredAt: new Date().toISOString(),
      ...data,
    };

    this.logger.log(JSON.stringify(entry));

    if (this.sink) {
      await this.sink.record(entry);
    }
  }
}
