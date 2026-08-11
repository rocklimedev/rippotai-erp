import { AutomationTrigger } from '../triggers/trigger.types';
import { ConditionNode } from '../conditions/condition.types';
import { AutomationActionStepConfig } from '../actions/action.types';
import { RetryPolicy } from '../jobs/job.types';

export interface CreateAutomationDto {
  name: string;
  tenantId?: string;
  trigger: AutomationTrigger;
  conditions?: ConditionNode;
  actions: AutomationActionStepConfig[];
  retryPolicy?: RetryPolicy;
  enabled?: boolean;
}

export interface UpdateAutomationDto {
  name?: string;
  trigger?: AutomationTrigger;
  conditions?: ConditionNode;
  actions?: AutomationActionStepConfig[];
  retryPolicy?: RetryPolicy;
}

export interface AutomationSummaryDto {
  id: string;
  name: string;
  tenantId?: string | null;
  enabled: boolean;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
}
