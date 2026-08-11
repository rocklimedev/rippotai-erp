export * from './automation.entity';
export * from './automation-version.entity';
export * from './automation-run.entity';
export * from './automation-run-step.entity';
export * from './processed-event.entity';
export * from './workflow.entity';
export * from './scheduled-automation.entity';

import { AutomationEntity } from './automation.entity';
import { AutomationVersionEntity } from './automation-version.entity';
import { AutomationRunEntity } from './automation-run.entity';
import { AutomationRunStepEntity } from './automation-run-step.entity';
import { ProcessedEventEntity } from './processed-event.entity';
import {
  WorkflowDefinitionEntity,
  WorkflowInstanceEntity,
} from './workflow.entity';
import { ScheduledAutomationEntity } from './scheduled-automation.entity';

/** All entities the engine owns. Pass this array into TypeOrmModule.forFeature(). */
export const AUTOMATION_ENGINE_ENTITIES = [
  AutomationEntity,
  AutomationVersionEntity,
  AutomationRunEntity,
  AutomationRunStepEntity,
  ProcessedEventEntity,
  WorkflowDefinitionEntity,
  WorkflowInstanceEntity,
  ScheduledAutomationEntity,
];
