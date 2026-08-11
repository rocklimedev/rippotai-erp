import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AutomationRunStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  WAITING = 'WAITING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export const VALID_RUN_TRANSITIONS: Record<
  AutomationRunStatus,
  AutomationRunStatus[]
> = {
  [AutomationRunStatus.PENDING]: [
    AutomationRunStatus.RUNNING,
    AutomationRunStatus.CANCELLED,
  ],
  [AutomationRunStatus.RUNNING]: [
    AutomationRunStatus.WAITING,
    AutomationRunStatus.COMPLETED,
    AutomationRunStatus.FAILED,
    AutomationRunStatus.CANCELLED,
  ],
  [AutomationRunStatus.WAITING]: [
    AutomationRunStatus.RUNNING,
    AutomationRunStatus.FAILED,
    AutomationRunStatus.CANCELLED,
  ],
  [AutomationRunStatus.COMPLETED]: [],
  [AutomationRunStatus.FAILED]: [AutomationRunStatus.RUNNING], // explicit retry re-enters RUNNING
  [AutomationRunStatus.CANCELLED]: [],
};

/** One execution of a specific automation version. */
@Entity('automation_runs')
@Index(['automationId'])
@Index(['correlationId'])
@Index(['status'])
export class AutomationRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  automationId!: string;

  @Column({ type: 'int' })
  automationVersion!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tenantId?: string | null;

  @Column({ type: 'varchar', length: 32 })
  triggerType!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  triggerEventId?: string | null;

  @Column({ type: 'varchar', length: 32, default: AutomationRunStatus.PENDING })
  status!: AutomationRunStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  correlationId?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  causationId?: string | null;

  /** Number of automation executions that occurred earlier in this correlation chain — used for cycle/limit protection. */
  @Column({ type: 'int', default: 0 })
  chainDepth!: number;

  @Column({ type: 'json', nullable: true })
  variablesSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  error?: Record<string, unknown> | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
