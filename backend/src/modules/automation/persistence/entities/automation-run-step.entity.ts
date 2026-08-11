import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AutomationStepStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  WAITING = 'WAITING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

/** One executed (or attempted) step within an automation run. */
@Entity('automation_run_steps')
@Index(['automationRunId'])
@Index(['automationRunId', 'stepId', 'attempt'], { unique: true })
export class AutomationRunStepEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  automationRunId!: string;

  @Column({ type: 'varchar', length: 255 })
  stepId!: string;

  @Column({ type: 'varchar', length: 255 })
  actionType!: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: AutomationStepStatus.PENDING,
  })
  status!: AutomationStepStatus;

  @Column({ type: 'int', default: 0 })
  attempt!: number;

  /** Snapshot of resolved action input. Sensitive fields must be redacted before persisting. */
  @Column({ type: 'json', nullable: true })
  inputSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  outputSnapshot?: Record<string, unknown> | null;

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
