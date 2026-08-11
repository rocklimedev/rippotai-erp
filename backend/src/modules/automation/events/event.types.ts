/**
 * Generic, business-agnostic event contract.
 *
 * The Automation Engine has no knowledge of what `type` or `payload` mean.
 * It is the responsibility of the host application to translate its own
 * domain events (e.g. "quotation.approved") into this shape and publish them.
 */
export interface AutomationEvent {
  /** Globally unique event id. Used for idempotency. */
  id: string;

  /** Dotted event type, e.g. "example.created". Opaque to the engine. */
  type: string;

  /** Schema version of this event type's payload. */
  version: number;

  /** Logical name of the system that produced the event. */
  source: string;

  /** ISO-8601 timestamp of when the event occurred. */
  timestamp: string;

  /** Optional tenant scoping. If present, automations are matched within this tenant only. */
  tenantId?: string;

  /** Optional id of the actor (user/system) that caused the event. */
  actorId?: string;

  /** Groups related runs/events together across a business process. */
  correlationId?: string;

  /** Id of the event/action that directly caused this event (for chain tracing / cycle detection). */
  causationId?: string;

  /** Opaque business payload. Only inspected via explicit path resolution in conditions/actions. */
  payload: Record<string, unknown>;
}

/** Result of validating a raw inbound event. */
export interface EventValidationResult {
  valid: boolean;
  errors: string[];
}

/** Status of processing a given event through the idempotency ledger. */
export enum ProcessedEventStatus {
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

/**
 * A handler subscribed to a given event type + compatible version range.
 * Registered by the host application or internal engine components (e.g. TriggerEngine).
 */
export interface EventHandler {
  eventType: string;
  /** Explicit list of payload schema versions this handler understands. */
  compatibleVersions: number[];
  handle(event: AutomationEvent): Promise<void>;
}
