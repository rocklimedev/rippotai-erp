import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Tracks the next-fire bookkeeping for SCHEDULE / DEADLINE / DEADLINE_APPROACHING
 * triggers so the scheduler can enqueue jobs without re-parsing every
 * automation's trigger on every tick.
 */
@Entity('scheduled_automations')
@Index(['nextRunAt'])
@Index(['automationId'])
export class ScheduledAutomationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  automationId!: string;

  @Column({ type: 'int' })
  automationVersion!: number;

  @Column({ type: 'varchar', length: 32 })
  triggerType!: string;

  @Column({ type: 'timestamp' })
  nextRunAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastRunAt?: Date | null;

  /** Opaque reference to the external entity a DEADLINE trigger is watching, if applicable. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  externalEntityType?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalEntityId?: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
