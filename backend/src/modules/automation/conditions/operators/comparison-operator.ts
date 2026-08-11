import { ComparisonOperator } from '../condition.types';

type OperatorFn = (actual: unknown, expected?: unknown) => boolean;

function isNumericComparable(a: unknown, b: unknown): boolean {
  return typeof a === 'number' && typeof b === 'number';
}

const operators: Record<ComparisonOperator, OperatorFn> = {
  [ComparisonOperator.EQUALS]: (actual, expected) =>
    deepEqual(actual, expected),
  [ComparisonOperator.NOT_EQUALS]: (actual, expected) =>
    !deepEqual(actual, expected),

  [ComparisonOperator.GREATER_THAN]: (actual, expected) =>
    isNumericComparable(actual, expected) &&
    (actual as number) > (expected as number),
  [ComparisonOperator.GREATER_THAN_OR_EQUAL]: (actual, expected) =>
    isNumericComparable(actual, expected) &&
    (actual as number) >= (expected as number),
  [ComparisonOperator.LESS_THAN]: (actual, expected) =>
    isNumericComparable(actual, expected) &&
    (actual as number) < (expected as number),
  [ComparisonOperator.LESS_THAN_OR_EQUAL]: (actual, expected) =>
    isNumericComparable(actual, expected) &&
    (actual as number) <= (expected as number),

  [ComparisonOperator.IN]: (actual, expected) =>
    Array.isArray(expected) && expected.some((v) => deepEqual(v, actual)),
  [ComparisonOperator.NOT_IN]: (actual, expected) =>
    Array.isArray(expected) && !expected.some((v) => deepEqual(v, actual)),

  [ComparisonOperator.CONTAINS]: (actual, expected) => {
    if (Array.isArray(actual))
      return actual.some((v) => deepEqual(v, expected));
    if (typeof actual === 'string' && typeof expected === 'string')
      return actual.includes(expected);
    return false;
  },
  [ComparisonOperator.NOT_CONTAINS]: (actual, expected) => {
    if (Array.isArray(actual))
      return !actual.some((v) => deepEqual(v, expected));
    if (typeof actual === 'string' && typeof expected === 'string')
      return !actual.includes(expected);
    return true;
  },

  [ComparisonOperator.STARTS_WITH]: (actual, expected) =>
    typeof actual === 'string' &&
    typeof expected === 'string' &&
    actual.startsWith(expected),
  [ComparisonOperator.ENDS_WITH]: (actual, expected) =>
    typeof actual === 'string' &&
    typeof expected === 'string' &&
    actual.endsWith(expected),

  [ComparisonOperator.EXISTS]: (actual) => actual !== undefined,
  [ComparisonOperator.NOT_EXISTS]: (actual) => actual === undefined,

  [ComparisonOperator.IS_TRUE]: (actual) => actual === true,
  [ComparisonOperator.IS_FALSE]: (actual) => actual === false,

  [ComparisonOperator.IS_NULL]: (actual) => actual === null,
  [ComparisonOperator.IS_NOT_NULL]: (actual) =>
    actual !== null && actual !== undefined,
};

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a === 'object' && typeof b === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

export function evaluateOperator(
  operator: ComparisonOperator,
  actual: unknown,
  expected?: unknown,
): boolean {
  const fn = operators[operator];
  if (!fn) {
    throw new Error(`Unknown comparison operator: ${operator}`);
  }
  return fn(actual, expected);
}
