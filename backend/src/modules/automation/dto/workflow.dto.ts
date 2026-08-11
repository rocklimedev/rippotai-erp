import { AutomationRunStatus } from '../persistence/entities/automation-run.entity';

export interface AutomationRunSummaryDto {
  id: string;
  automationId: string;
  automationVersion: number;
  status: AutomationRunStatus;
  triggerType: string;
  correlationId?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  error?: Record<string, unknown> | null;
}

export interface WorkflowStartDto {
  definitionKey: string;
  definitionVersion: number;
  correlationId?: string;
  initialVariables?: Record<string, unknown>;
}
