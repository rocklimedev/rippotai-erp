export enum ComparisonOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  EXISTS = 'EXISTS',
  NOT_EXISTS = 'NOT_EXISTS',
  IS_TRUE = 'IS_TRUE',
  IS_FALSE = 'IS_FALSE',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
}

export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
}

/** A single leaf comparison against a resolved data path. */
export interface LeafCondition {
  path: string;
  operator: ComparisonOperator;
  /** Not required for unary operators (EXISTS, IS_TRUE, IS_NULL, etc). */
  value?: unknown;
}

/** A logical group of conditions (which may themselves be groups or leaves). */
export interface ConditionGroup {
  operator: LogicalOperator;
  conditions: ConditionNode[];
}

export type ConditionNode = LeafCondition | ConditionGroup;

export function isConditionGroup(node: ConditionNode): node is ConditionGroup {
  return (
    (node as ConditionGroup).operator !== undefined &&
    Object.values(LogicalOperator).includes(
      (node as ConditionGroup).operator as LogicalOperator,
    )
  );
}

/** Explainable per-leaf evaluation result, for debugging/future UI. */
export interface LeafEvaluationResult {
  path: string;
  operator: ComparisonOperator;
  expected?: unknown;
  actual: unknown;
  passed: boolean;
}

export interface GroupEvaluationResult {
  operator: LogicalOperator;
  passed: boolean;
  results: EvaluationResult[];
}

export type EvaluationResult = LeafEvaluationResult | GroupEvaluationResult;

export interface ConditionEvaluationOutcome {
  passed: boolean;
  result: EvaluationResult;
}
