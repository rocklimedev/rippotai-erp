/**
 * Quality Checklist Status Enumeration
 * Represents the overall status of a quality checklist
 */
export enum ChecklistStatus {
  PENDING = 'PENDING', // Checklist has been created but not started
  IN_PROGRESS = 'IN_PROGRESS', // Checklist is actively being worked on
  COMPLETED = 'COMPLETED', // All items have been checked
  PASSED = 'PASSED', // Checklist has been passed and approved
  FAILED = 'FAILED', // Checklist has failed inspection
  ON_HOLD = 'ON_HOLD', // Checklist is on hold, pending resolution
}

/**
 * Item Status Enumeration
 * Represents the status of individual checklist items
 */
export enum ItemStatus {
  NOT_STARTED = 'NOT_STARTED', // Item inspection has not been started
  IN_PROGRESS = 'IN_PROGRESS', // Item is being inspected
  COMPLETED = 'COMPLETED', // Item inspection is complete
  ACCEPTED = 'ACCEPTED', // Item has been accepted after inspection
  REJECTED = 'REJECTED', // Item has been rejected, requires fixes
  DEFERRED = 'DEFERRED', // Item inspection has been deferred to later
}

/**
 * Checkpoint Phase Enumeration
 * Represents the phase of construction where the checkpoint is performed
 */
export enum CheckpointPhase {
  BEFORE_EXECUTION = 'BEFORE_EXECUTION', // Pre-work inspection phase
  DURING_EXECUTION = 'DURING_EXECUTION', // During work inspection phase
  AFTER_EXECUTION = 'AFTER_EXECUTION', // Post-work inspection phase
}

/**
 * Work Head/Category Enumeration
 * Represents different types of construction work
 */
export enum WorkHead {
  EXCAVATION = 'EXCAVATION',
  PCC_WORK = 'PCC_WORK',
  FORMWORK_SHUTTERING = 'FORMWORK_SHUTTERING',
  CONCRETING = 'CONCRETING',
  BRICKWORK = 'BRICKWORK',
  WATERPROOFING = 'WATERPROOFING',
  PLASTER_WORK = 'PLASTER_WORK',
  PLUMBING = 'PLUMBING',
  ELECTRICAL_LIGHTING = 'ELECTRICAL_LIGHTING',
  HVAC = 'HVAC',
  FALSE_CEILING = 'FALSE_CEILING',
  FLOORING_WORK = 'FLOORING_WORK',
  PAINT_WORK = 'PAINT_WORK',
  KITCHEN = 'KITCHEN',
  WARDROBE = 'WARDROBE',
  DOORS = 'DOORS',
  WINDOWS_GLAZING = 'WINDOWS_GLAZING',
}

/**
 * Acceptance Status Enumeration
 * Represents the acceptance status of an item
 */
export enum AcceptanceStatus {
  ACCEPTED = 'ACCEPTED', // Item is accepted
  REJECTED = 'REJECTED', // Item is rejected and requires rework
  PENDING = 'PENDING', // Acceptance status is pending
}

/**
 * Priority Level Enumeration
 * Represents the priority of a checkpoint
 */
export enum PriorityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Severity Level Enumeration
 * Represents the severity of issues found during inspection
 */
export enum SeverityLevel {
  MINOR = 'MINOR', // Minor issue, cosmetic in nature
  MAJOR = 'MAJOR', // Major issue, affects functionality
  CRITICAL = 'CRITICAL', // Critical issue, safety or structural concern
}

/**
 * Report Type Enumeration
 * Represents different types of reports that can be generated
 */
export enum ReportType {
  SUMMARY = 'SUMMARY', // Summary report
  DETAILED = 'DETAILED', // Detailed report with all items
  REJECTION = 'REJECTION', // Report of rejected items
  PHASE_WISE = 'PHASE_WISE', // Report grouped by phases
  COMPLIANCE = 'COMPLIANCE', // Compliance report
}

/**
 * Access Level Enumeration
 * Represents access permissions for checklist operations
 */
export enum AccessLevel {
  VIEW_ONLY = 'VIEW_ONLY', // Can only view the checklist
  EDIT = 'EDIT', // Can edit checklist items
  APPROVE = 'APPROVE', // Can approve/reject items
  ADMIN = 'ADMIN', // Full administrative access
}

/**
 * Notification Type Enumeration
 * Represents different types of notifications related to checklists
 */
export enum NotificationType {
  CHECKLIST_CREATED = 'CHECKLIST_CREATED',
  ITEM_UPDATED = 'ITEM_UPDATED',
  ITEM_REJECTED = 'ITEM_REJECTED',
  CHECKLIST_COMPLETED = 'CHECKLIST_COMPLETED',
  CHECKLIST_PASSED = 'CHECKLIST_PASSED',
  CHECKLIST_FAILED = 'CHECKLIST_FAILED',
}

/**
 * Mapping for user-friendly display names
 */
export const ChecklistStatusLabels: Record<ChecklistStatus, string> = {
  [ChecklistStatus.PENDING]: 'Pending',
  [ChecklistStatus.IN_PROGRESS]: 'In Progress',
  [ChecklistStatus.COMPLETED]: 'Completed',
  [ChecklistStatus.PASSED]: 'Passed',
  [ChecklistStatus.FAILED]: 'Failed',
  [ChecklistStatus.ON_HOLD]: 'On Hold',
};

export const ItemStatusLabels: Record<ItemStatus, string> = {
  [ItemStatus.NOT_STARTED]: 'Not Started',
  [ItemStatus.IN_PROGRESS]: 'In Progress',
  [ItemStatus.COMPLETED]: 'Completed',
  [ItemStatus.ACCEPTED]: 'Accepted',
  [ItemStatus.REJECTED]: 'Rejected',
  [ItemStatus.DEFERRED]: 'Deferred',
};

export const CheckpointPhaseLabels: Record<CheckpointPhase, string> = {
  [CheckpointPhase.BEFORE_EXECUTION]: 'Before Execution',
  [CheckpointPhase.DURING_EXECUTION]: 'During Execution',
  [CheckpointPhase.AFTER_EXECUTION]: 'After Execution',
};

export const WorkHeadLabels: Record<WorkHead, string> = {
  [WorkHead.EXCAVATION]: 'Excavation',
  [WorkHead.PCC_WORK]: 'PCC Work',
  [WorkHead.FORMWORK_SHUTTERING]: 'Formwork/Shuttering',
  [WorkHead.CONCRETING]: 'Concreting',
  [WorkHead.BRICKWORK]: 'Brickwork',
  [WorkHead.WATERPROOFING]: 'Waterproofing',
  [WorkHead.PLASTER_WORK]: 'Plaster Work',
  [WorkHead.PLUMBING]: 'Plumbing',
  [WorkHead.ELECTRICAL_LIGHTING]: 'Electrical & Lighting',
  [WorkHead.HVAC]: 'HVAC',
  [WorkHead.FALSE_CEILING]: 'False Ceiling',
  [WorkHead.FLOORING_WORK]: 'Flooring Work',
  [WorkHead.PAINT_WORK]: 'Paint Work',
  [WorkHead.KITCHEN]: 'Kitchen',
  [WorkHead.WARDROBE]: 'Wardrobe',
  [WorkHead.DOORS]: 'Doors',
  [WorkHead.WINDOWS_GLAZING]: 'Windows & Glazing',
};
