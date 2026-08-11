import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AutomationEntity } from './automation.entity';
import type { AutomationTrigger } from '../../triggers/trigger.types';
import { ConditionNode } from '../../conditions/condition.types';
import { AutomationActionStepConfig } from '../../actions/action.types';

export enum AutomationVersionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

/**
 * An immutable snapshot of an automation's trigger/conditions/actions at a
 * point in time. Automation runs always reference the exact version that
 * executed (spec §12) — never the current mutable automation row.
 */
@Entity('automation_versions')
@Unique(['automationId', 'version'])
@Index(['automationId'])
export class AutomationVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  automationId!: string;

  @ManyToOne(() => AutomationEntity, (a) => a.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'automationId' })
  automation?: AutomationEntity;

  @Column({ type: 'int' })
  version!: number;

  @Column({
    type: 'varchar',
    length: 32,
    default: AutomationVersionStatus.DRAFT,
  })
  status!: AutomationVersionStatus;

  @Column({ type: 'json' })
  trigger!: AutomationTrigger;

  @Column({ type: 'json', nullable: true })
  conditions?: ConditionNode | null;

  @Column({ type: 'json' })
  actions!: AutomationActionStepConfig[];

  @Column({ type: 'json', nullable: true })
  retryPolicy?: {
    maxAttempts: number;
    backoff: { type: 'fixed' | 'exponential'; delay: number };
  } | null;

  @CreateDateColumn()
  createdAt!: Date;
}
