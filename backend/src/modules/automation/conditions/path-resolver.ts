/**
 * Resolves dotted paths like "payload.customer.name" or "variables.total"
 * against a plain object. Deliberately NOT a general-purpose object
 * traversal utility:
 *  - only dot-separated identifier segments are accepted (no brackets,
 *    no prototype-chain access, no function calls)
 *  - blocks dangerous keys (__proto__, prototype, constructor)
 *  - returns `undefined` for any missing/invalid segment rather than throwing
 *
 * This keeps conditions declarative and safe even if an end user is allowed
 * to author automation definitions (see spec §20/§21 — no eval, no arbitrary
 * object traversal into internal services).
 */

const PATH_SEGMENT_PATTERN = /^[A-Za-z0-9_]+$/;
const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export class InvalidPathError extends Error {
  constructor(path: string) {
    super(`Invalid or unsafe data path: "${path}"`);
    this.name = 'InvalidPathError';
  }
}

export function isValidPath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  const segments = path.split('.');
  return segments.every(
    (seg) => PATH_SEGMENT_PATTERN.test(seg) && !BLOCKED_KEYS.has(seg),
  );
}

export function resolvePath(
  root: Record<string, unknown>,
  path: string,
): unknown {
  if (!isValidPath(path)) {
    throw new InvalidPathError(path);
  }

  const segments = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = root;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    if (!Object.prototype.hasOwnProperty.call(current, segment)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}
