import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ProcessedEventStatus } from '../../events/event.types';

/**
 * Idempotency ledger for inbound events. A (eventId, consumer) pair may be
 * recorded at most once — the unique constraint is the actual safety
 * mechanism, not application-level `if` checks (spec §17, §64).
 */
@Entity('processed_events')
@Unique(['eventId', 'consumer'])
@Index(['eventType'])
export class ProcessedEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  eventId!: string;

  @Column({ type: 'varchar', length: 255 })
  eventType!: string;

  @Column({ type: 'int' })
  eventVersion!: number;

  /** Logical name of the internal consumer that processed this event (e.g. "trigger-engine"). */
  @Column({ type: 'varchar', length: 255 })
  consumer!: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: ProcessedEventStatus.PROCESSING,
  })
  status!: ProcessedEventStatus;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
