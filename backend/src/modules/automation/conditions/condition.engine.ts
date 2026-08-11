import { Injectable } from '@nestjs/common';
import {
  ConditionEvaluationOutcome,
  ConditionGroup,
  ConditionNode,
  EvaluationResult,
  GroupEvaluationResult,
  LeafCondition,
  LeafEvaluationResult,
  LogicalOperator,
  isConditionGroup,
} from './condition.types';
import { evaluateOperator } from './operators/comparison-operator';
import { resolvePath } from './path-resolver';
import { ValidationError } from '../errors/automation.errors';

/**
 * Evaluates declarative, JSON-representable condition trees against a data
 * root (typically `{ payload, variables, event }`).
 *
 * Deliberately declarative-only: no eval(), no expression language, no
 * arbitrary code execution (spec §20). Safe to expose to automation authors.
 */
@Injectable()
export class ConditionEngine {
  evaluate(
    node: ConditionNode | undefined,
    dataRoot: Record<string, unknown>,
  ): ConditionEvaluationOutcome {
    // An automation with no conditions always passes.
    if (!node) {
      return {
        passed: true,
        result: { operator: LogicalOperator.AND, passed: true, results: [] },
      };
    }

    const result = this.evaluateNode(node, dataRoot);
    return { passed: result.passed, result };
  }

  private evaluateNode(
    node: ConditionNode,
    dataRoot: Record<string, unknown>,
  ): EvaluationResult {
    if (isConditionGroup(node)) {
      return this.evaluateGroup(node, dataRoot);
    }
    return this.evaluateLeaf(node, dataRoot);
  }

  private evaluateGroup(
    group: ConditionGroup,
    dataRoot: Record<string, unknown>,
  ): GroupEvaluationResult {
    if (!Array.isArray(group.conditions)) {
      throw new ValidationError(
        'Condition group "conditions" must be an array',
        { group },
      );
    }

    const childResults = group.conditions.map((child) =>
      this.evaluateNode(child, dataRoot),
    );

    let passed: boolean;
    switch (group.operator) {
      case LogicalOperator.AND:
        passed = childResults.every((r) => r.passed);
        break;
      case LogicalOperator.OR:
        passed = childResults.some((r) => r.passed);
        break;
      case LogicalOperator.NOT:
        // NOT negates the (single) child, or the AND of all children if multiple are given.
        passed = !childResults.every((r) => r.passed);
        break;
      default:
        throw new ValidationError(
          `Unknown logical operator: ${group.operator}`,
          { group },
        );
    }

    return { operator: group.operator, passed, results: childResults };
  }

  private evaluateLeaf(
    leaf: LeafCondition,
    dataRoot: Record<string, unknown>,
  ): LeafEvaluationResult {
    if (!leaf.path || !leaf.operator) {
      throw new ValidationError(
        'Leaf condition requires "path" and "operator"',
        { leaf },
      );
    }

    const actual = resolvePath(dataRoot, leaf.path);
    const passed = evaluateOperator(leaf.operator, actual, leaf.value);

    return {
      path: leaf.path,
      operator: leaf.operator,
      expected: leaf.value,
      actual,
      passed,
    };
  }
}
