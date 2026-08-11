/**
 * Structured error taxonomy for the Automation Engine.
 *
 * Every error thrown from engine internals should be one of these classes so
 * that retry classification (see jobs/job.types.ts) and API error responses
 * can be handled uniformly.
 */

export enum AutomationErrorCode {
  VALIDATION = 'VALIDATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  TRANSIENT = 'TRANSIENT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  PERMANENT = 'PERMANENT',
  CYCLE_DETECTED = 'AUTOMATION_CYCLE_DETECTED',
  EXECUTION_LIMIT_REACHED = 'AUTOMATION_EXECUTION_LIMIT_REACHED',
  TIMEOUT = 'TIMEOUT',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  GATE_EVALUATION_FAILED = 'GATE_EVALUATION_FAILED',
}

/** Errors of these codes are safe to retry (subject to the retry policy). */
export const RETRYABLE_ERROR_CODES: ReadonlySet<AutomationErrorCode> = new Set([
  AutomationErrorCode.TRANSIENT,
  AutomationErrorCode.EXTERNAL_SERVICE,
  AutomationErrorCode.TIMEOUT,
]);

export class AutomationError extends Error {
  public readonly code: AutomationErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: AutomationErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AutomationError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AutomationError.prototype);
  }

  get isRetryable(): boolean {
    return RETRYABLE_ERROR_CODES.has(this.code);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class ValidationError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(AutomationErrorCode.VALIDATION, message, details);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(AutomationErrorCode.AUTHORIZATION, message, details);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(AutomationErrorCode.NOT_FOUND, message, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(AutomationErrorCode.CONFLICT, message, details);
    this.name = 'ConflictError';
  }
}

export class TransientError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(AutomationErrorCode.TRANSIENT, message, details);
    this.name = 'TransientError';
  }
}

export class ExternalServiceError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(AutomationErrorCode.EXTERNAL_SERVICE, message, details);
    this.name = 'ExternalServiceError';
  }
}

export class PermanentError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(AutomationErrorCode.PERMANENT, message, details);
    this.name = 'PermanentError';
  }
}

export class CycleDetectedError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(AutomationErrorCode.CYCLE_DETECTED, message, details);
    this.name = 'CycleDetectedError';
  }
}

export class ExecutionLimitReachedError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(AutomationErrorCode.EXECUTION_LIMIT_REACHED, message, details);
    this.name = 'ExecutionLimitReachedError';
  }
}

export class AutomationTimeoutError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(AutomationErrorCode.TIMEOUT, message, details);
    this.name = 'AutomationTimeoutError';
  }
}

export class InvalidStateTransitionError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(AutomationErrorCode.INVALID_STATE_TRANSITION, message, details);
    this.name = 'InvalidStateTransitionError';
  }
}

/** Thrown when a Gate cannot be evaluated at all (bad config, provider failure) — distinct from a gate that evaluates cleanly to BLOCKED. */
export class GateEvaluationError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(AutomationErrorCode.GATE_EVALUATION_FAILED, message, details);
    this.name = 'GateEvaluationError';
  }
}
