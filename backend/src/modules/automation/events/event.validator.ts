import { Injectable } from '@nestjs/common';
import { AutomationEvent, EventValidationResult } from './event.types';

const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/** Structural validation only — the engine never interprets payload semantics (spec §15). */
@Injectable()
export class EventValidator {
  validate(event: unknown): EventValidationResult {
    const errors: string[] = [];
    const e = event as Partial<AutomationEvent>;

    if (!e || typeof e !== 'object') {
      return { valid: false, errors: ['Event must be an object'] };
    }
    if (typeof e.id !== 'string' || e.id.length === 0)
      errors.push('"id" is required and must be a non-empty string');
    if (typeof e.type !== 'string' || e.type.length === 0)
      errors.push('"type" is required and must be a non-empty string');
    if (
      typeof e.version !== 'number' ||
      !Number.isInteger(e.version) ||
      e.version < 1
    ) {
      errors.push('"version" is required and must be a positive integer');
    }
    if (typeof e.source !== 'string' || e.source.length === 0)
      errors.push('"source" is required and must be a non-empty string');
    if (
      typeof e.timestamp !== 'string' ||
      !ISO_TIMESTAMP_PATTERN.test(e.timestamp)
    ) {
      errors.push('"timestamp" is required and must be an ISO-8601 string');
    }
    if (
      e.payload === undefined ||
      e.payload === null ||
      typeof e.payload !== 'object' ||
      Array.isArray(e.payload)
    ) {
      errors.push('"payload" is required and must be an object');
    }
    if (e.tenantId !== undefined && typeof e.tenantId !== 'string')
      errors.push('"tenantId" must be a string if present');
    if (e.actorId !== undefined && typeof e.actorId !== 'string')
      errors.push('"actorId" must be a string if present');
    if (e.correlationId !== undefined && typeof e.correlationId !== 'string')
      errors.push('"correlationId" must be a string if present');
    if (e.causationId !== undefined && typeof e.causationId !== 'string')
      errors.push('"causationId" must be a string if present');

    return { valid: errors.length === 0, errors };
  }
}
