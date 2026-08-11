import { AutomationEvent } from '../events/event.types';
import { AutomationExecutionContext } from '../core/automation-context';

/**
 * ============================================================================
 * EXTENSION POINTS — the ONLY boundary between this engine and a host app.
 * ============================================================================
 * The engine ships default/no-op implementations where sensible so it runs
 * standalone. A host application overrides these via DI to connect its own
 * business logic. The engine core never imports anything business-specific.
 * See docs/automation-engine/13-integration-contracts.md.
 */

/** Opaque reference to an entity that lives in an external business system. */
export interface EntityReference {
  type: string;
  id: string;
}

/** Implemented by a host app to push its own domain events into the engine. */
export interface DomainEventPublisher {
  publish(event: AutomationEvent): Promise<void>;
}

/** Implemented by a host app to receive events emitted BY the engine (automation.started, etc). */
export interface DomainEventConsumer {
  onEngineEvent(event: AutomationEvent): Promise<void>;
}

export interface ContextRequest {
  /** Name of the registered AutomationContextProvider to invoke. */
  providerName: string;
  /** Free-form parameters passed to the provider. */
  params: Record<string, unknown>;
}

/** Enriches execution context with external data. The core engine never implements one of these itself. */
export interface AutomationContextProvider {
  name: string;
  resolve(
    context: AutomationExecutionContext,
    request: ContextRequest,
  ): Promise<Record<string, unknown>>;
}

/** Implemented by the host app's real permission system. */
export interface AutomationAuthorization {
  can(
    actorId: string,
    permission: string,
    resource?: unknown,
  ): Promise<boolean>;
}

export interface CredentialHandle {
  /** Opaque reference — never the secret value itself. */
  ref: string;
}

/** Implemented by a host app's secret store. The engine never persists raw secrets. */
export interface AutomationCredentialProvider {
  resolve(handle: CredentialHandle): Promise<string>;
}

export interface AuditEntry {
  type: string;
  occurredAt: string;
  runId?: string;
  automationId?: string;
  automationVersion?: number;
  actorId?: string;
  data?: Record<string, unknown>;
}

/** Implemented by the host app's real audit/observability pipeline. */
export interface AutomationAuditSink {
  record(entry: AuditEntry): Promise<void>;
}

/**
 * ----------------------------------------------------------------------------
 * APPROVAL EXTENSION POINT (spec §9)
 * ----------------------------------------------------------------------------
 * The generic engine only understands the REQUEST_APPROVAL /
 * WAIT_FOR_APPROVAL / APPROVAL_COMPLETED / APPROVAL_REJECTED lifecycle. A
 * host application implements AutomationApprovalProvider on top of its own
 * (already-existing) approval system and is responsible for eventually
 * calling back into WorkflowEngine.resumeApproval(...) — directly, or by
 * publishing a DomainEventPublisher event that WorkflowEngine.dispatchDomainEvent
 * picks up — once a human actually approves/rejects.
 */
export interface ApprovalRequest {
  /** Correlates the approval back to the workflow instance that asked for it. */
  workflowInstanceId: string;
  /** Opaque reference to the business entity the approval concerns (e.g. { type: 'project', id }). */
  entity?: EntityReference;
  /** Opaque role/permission name. The engine never knows what this means — the host resolves it. */
  approverRole?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ApprovalHandle {
  /** Opaque id of the approval request in the host's existing approval system. */
  approvalId: string;
}

/** Implemented by a host app adapter that delegates to its existing approval system. */
export interface AutomationApprovalProvider {
  requestApproval(request: ApprovalRequest): Promise<ApprovalHandle>;
}
