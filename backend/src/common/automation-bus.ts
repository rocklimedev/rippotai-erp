import { EventEmitter } from 'events';

/**
 * In-process event bus for the automation engine. Domain services emit
 * events here (no DI coupling / circular imports); AutomationEngineService
 * subscribes on start-up and evaluates the matching rules for that entity.
 */
export type AutomationEvent =
  | 'QC_FAILED'
  | 'PAYMENT_MILESTONE_OVERDUE'
  | 'TASK_OVERDUE'
  | 'PHASE_STALLED'
  | 'RFI_OVERDUE';

export interface AutomationEventPayload {
  entityId: string | number;
  projectId?: string | null;
}

class AutomationBus extends EventEmitter {
  emitEvent(event: AutomationEvent, payload: AutomationEventPayload) {
    // Never let a listener error bubble into the caller's request.
    setImmediate(() => {
      try {
        this.emit(event, payload);
      } catch {
        /* ignore */
      }
    });
  }
}

export const automationBus = new AutomationBus();
automationBus.setMaxListeners(20);
