import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AutomationActionStepConfig } from '../../actions/action.types';
import { ConditionNode } from '../../conditions/condition.types';
import { GateDefinition } from '../../gates/gate.types';

export enum WorkflowInstanceStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  WAITING = 'WAITING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export const VALID_WORKFLOW_TRANSITIONS: Record<
  WorkflowInstanceStatus,
  WorkflowInstanceStatus[]
> = {
  [WorkflowInstanceStatus.PENDING]: [
    WorkflowInstanceStatus.RUNNING,
    WorkflowInstanceStatus.CANCELLED,
  ],
  [WorkflowInstanceStatus.RUNNING]: [
    WorkflowInstanceStatus.WAITING,
    WorkflowInstanceStatus.PAUSED,
    WorkflowInstanceStatus.COMPLETED,
    WorkflowInstanceStatus.FAILED,
    WorkflowInstanceStatus.CANCELLED,
  ],
  [WorkflowInstanceStatus.WAITING]: [
    WorkflowInstanceStatus.RUNNING,
    WorkflowInstanceStatus.FAILED,
    WorkflowInstanceStatus.CANCELLED,
  ],
  [WorkflowInstanceStatus.PAUSED]: [
    WorkflowInstanceStatus.RUNNING,
    WorkflowInstanceStatus.CANCELLED,
  ],
  [WorkflowInstanceStatus.COMPLETED]: [],
  [WorkflowInstanceStatus.FAILED]: [WorkflowInstanceStatus.RUNNING],
  [WorkflowInstanceStatus.CANCELLED]: [],
};

export enum WorkflowWaitType {
  EVENT = 'EVENT',
  TIME = 'TIME',
  MANUAL_INPUT = 'MANUAL_INPUT',
  APPROVAL = 'APPROVAL',
  EXTERNAL_ACTION = 'EXTERNAL_ACTION',
  /** A BLOCKED Gate re-uses the WAITING state machine (spec §7/§8) rather than a second waiting mechanism. */
  GATE = 'GATE',
}

/** What happens when a WAITING step's timeout elapses without a resume (spec §12/§13). */
export enum TimeoutAction {
  FAIL = 'FAIL',
  CANCEL = 'CANCEL',
  ESCALATE = 'ESCALATE',
  RUN_ACTION = 'RUN_ACTION',
}

/**
 * One rung of an escalation ladder (spec §13). The generic engine only
 * understands "after N seconds, optionally run this action, optionally
 * resolve the wait". It has no idea what "notify the project manager"
 * means — that's whatever host-registered action `notify.action` (config)
 * points at, resolved through the normal ActionRegistry/ContextProvider
 * mechanisms.
 */
export interface EscalationStep {
  /** Seconds after the wait started (not after the previous rung) that this rung fires. */
  afterSeconds: number;
  /** Optional action to run at this rung (e.g. a host-registered NOTIFY_ROLE action). Failures are logged, never fail the workflow. */
  action?: AutomationActionStepConfig;
  /** If set, this rung also resolves the wait (rather than just notifying and continuing to wait). */
  resolve?: TimeoutAction;
}

export interface WorkflowStepTimeout {
  escalation: EscalationStep[];
}

/** A step in a workflow definition. */
export interface WorkflowStepDefinition {
  id: string;
  kind: 'ACTION' | 'WAIT' | 'GATE' | 'DECISION' | 'PARALLEL' | 'JOIN';
  action?: AutomationActionStepConfig;
  wait?: {
    type: WorkflowWaitType;
    /** For EVENT waits: the event type to resume on. For GATE waits: the primary (indexed) resume event type — see resumeEventTypes. */
    resumeEventType?: string;
    /** For GATE waits only: the full set of event types that should trigger re-evaluation (spec §8). resumeEventType mirrors the first entry for the indexed fast-path lookup. */
    resumeEventTypes?: string[];
    /** For TIME waits: ISO duration in seconds. */
    delaySeconds?: number;
    /** For APPROVAL/MANUAL_INPUT waits: optional expiry. */
    expiresInSeconds?: number;
    /** Generic timeout/escalation ladder applied to ANY wait type (spec §12/§13). */
    timeout?: WorkflowStepTimeout;
  };
  /**
   * GATE step: either an inline definition or a reference to a GateRegistry
   * entry (`gateRef`). `next` is taken when the gate PASSES; `onBlocked` is
   * an optional alternate path taken immediately if the gate evaluates to
   * BLOCKED with `haltOnBlocked: false` — by default a BLOCKED gate parks
   * the workflow in WAITING instead (spec §7).
   */
  gate?: GateDefinition;
  gateRef?: string;
  /** Event types that re-trigger evaluation of a blocked gate; falls back to gate.resumeOn when omitted. */
  gateResumeOn?: string[];
  /**
   * DECISION step: branches to `whenTrue` or `whenFalse` based on the
   * existing Condition Engine (spec §10) — no new expression language.
   */
  decision?: {
    condition: ConditionNode;
    whenTrue: string;
    whenFalse: string;
  };
  /**
   * PARALLEL step: fans out into one WorkflowInstance per branch (spec
   * §11), each starting at the given step id and running independently and
   * resumably until it reaches `joinStepId`. `next` is taken once every
   * branch has completed.
   */
  parallel?: {
    branches: string[]; // step ids to start each branch at
    joinStepId: string;
  };
  next?: string; // id of next step, or undefined = end of workflow
}

/** Immutable workflow definition version — analogous to AutomationVersionEntity. */
@Entity('workflow_definitions')
@Unique(['key', 'version'])
export class WorkflowDefinitionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  key!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'varchar', length: 255 })
  startStepId!: string;

  @Column({ type: 'json' })
  steps!: WorkflowStepDefinition[];

  @CreateDateColumn()
  createdAt!: Date;
}

/** A single running/completed execution of a workflow definition. */
@Entity('workflow_instances')
@Index(['workflowDefinitionId'])
@Index(['status'])
@Index(['automationRunId'])
@Index(['parentInstanceId', 'joinKey'])
// Enables an O(index) lookup of candidate instances to resume when a domain
// event arrives, instead of scanning every WAITING row (spec §8: "do not
// re-evaluate every waiting workflow for every event").
@Index(['status', 'resumeEventType', 'resumeCorrelationId'])
export class WorkflowInstanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  workflowDefinitionId!: string;

  @Column({ type: 'int' })
  workflowDefinitionVersion!: number;

  /** Optional link back to the automation run that started this workflow, if any. */
  @Column({ type: 'uuid', nullable: true })
  automationRunId?: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: WorkflowInstanceStatus.PENDING,
  })
  status!: WorkflowInstanceStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  currentStepId?: string | null;

  @Column({ type: 'json', nullable: true })
  waitCondition?: WorkflowStepDefinition['wait'] | null;

  @Column({ type: 'json', nullable: true })
  variables?: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  correlationId?: string | null;

  @Column({ type: 'json', nullable: true })
  error?: Record<string, unknown> | null;

  @Column({ type: 'timestamp', nullable: true })
  waitingSince?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  resumeAfter?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date | null;

  /**
   * Denormalized copy of the current wait's primary resumeEventType (for
   * EVENT/GATE waits), kept in sync purely so dispatchDomainEvent() can run
   * one indexed query instead of scanning every WAITING instance. The full
   * wait configuration (incl. any secondary resume event types) still lives
   * in `waitCondition`; this column is a fast-path index, not the source of
   * truth (spec §8 — use correlation/context info, not global polling).
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  resumeEventType?: string | null;

  /** Narrows the indexed lookup above to events within the same business process, when known. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  resumeCorrelationId?: string | null;

  /** Set on branch instances spawned by a PARALLEL step; null for top-level instances. */
  @Column({ type: 'uuid', nullable: true })
  parentInstanceId?: string | null;

  /** Groups sibling branch instances spawned by the same PARALLEL step invocation. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  joinKey?: string | null;

  /** Index of this branch within its PARALLEL step's `branches` array (for result namespacing). */
  @Column({ type: 'int', nullable: true })
  branchIndex?: number | null;

  /** Indices into the current wait step's timeout.escalation ladder that have already fired — prevents duplicate notifications on redelivered/late DEADLINE_CHECK jobs. */
  @Column({ type: 'json', nullable: true })
  firedEscalations?: number[] | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
