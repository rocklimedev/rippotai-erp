import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AutomationVersionEntity } from './automation-version.entity';

/**
 * The stable identity of an automation. Definitions themselves are versioned
 * (see AutomationVersionEntity) — this row only tracks identity, enable
 * state, and which version is currently active.
 */
@Entity('automations')
@Index(['tenantId', 'enabled'])
export class AutomationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tenantId?: string | null;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ type: 'int' })
  currentVersion!: number;

  @OneToMany(() => AutomationVersionEntity, (v) => v.automation)
  versions?: AutomationVersionEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
