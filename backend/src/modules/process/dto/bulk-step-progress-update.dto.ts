// dto/bulk-step-progress-update.dto.ts

export type StepProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'skipped';

export interface BulkStepProgressUpdate {
  stepId: string;
  status?: StepProgressStatus;
  remarks?: string;
  assignee_id?: string | null;
  due_date?: string | null;
}
