import { ComparisonOperator } from '../conditions/condition.types';
import { ContextRequest } from '../interfaces/extension-points';

/** How a gate's checks combine into an overall pass/fail. */
export enum GateMode {
  ALL = 'ALL',
  ANY = 'ANY',
}

/** Outcome of evaluating a gate. */
export enum GateStatus {
  PASSED = 'PASSED',
  BLOCKED = 'BLOCKED',
  ERROR = 'ERROR',
}

/**
 * A single named checkpoint condition, e.g. "project.contractApproved".
 * Deliberately just a thin, human-labellable wrapper around a Condition
 * Engine leaf comparison — spec §3/§6 forbid a second condition system.
 */
export interface GateCheck {
  /** Human-readable label surfaced in gate results/UI, e.g. "Contract approved". */
  label: string;
  /** Dotted path resolved against the gate's data root (payload/variables/context). */
  path: string;
  operator: ComparisonOperator;
  /** Not required for unary operators (EXISTS, IS_TRUE, IS_NULL, etc). */
  value?: unknown;
}

/**
 * Declarative gate definition. Entirely business-agnostic: `path` strings
 * like "context.project.contractApproved" are opaque to the engine — they
 * only resolve to something meaningful once a host-registered
 * AutomationContextProvider has populated `context.<providerName>`.
 */
export interface GateDefinition {
  id: string;
  name: string;
  mode: GateMode;
  checks: GateCheck[];
  /**
   * Optional context requests the Gate Engine issues (via
   * ContextProviderRegistry) before evaluating checks, to enrich the data
   * root with business data. Never talks to a business service directly.
   */
  contextRequests?: ContextRequest[];
  /**
   * Event types that should cause a BLOCKED gate to be re-evaluated when a
   * workflow is WAITING on it (spec §8). Purely opaque strings to the
   * engine — matched against inbound AutomationEvent.type.
   */
  resumeOn?: string[];
}

export interface GateCheckResult {
  label: string;
  path: string;
  operator: ComparisonOperator;
  expected?: unknown;
  actual: unknown;
  passed: boolean;
}

export interface GateResult {
  gateId: string;
  gateName: string;
  mode: GateMode;
  status: GateStatus;
  checks: GateCheckResult[];
  failedChecks: GateCheckResult[];
  /** Human-readable explanation, e.g. "Contractor has not been selected." — for UI/audit. */
  reason?: string;
  /** Present only when status === ERROR. */
  error?: Record<string, unknown>;
}
