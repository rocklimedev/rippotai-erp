import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

import { ProcessPhase } from './process-phase.model';
import { TradeTeam } from './trade-team.model';
import { ProcessStepTeam } from './process-step-team.model';
import { DeliverableType } from './deliverable-type.model';
import { ProcessStepDeliverable } from './process-step-deliverable.model';
import { ProjectStepProgress } from './project-step-progress.model';
import { ProjectGateLog } from './project-gate-log.model';

@Table({
  tableName: 'process_steps',
  timestamps: true,
})
export class ProcessStep extends Model<ProcessStep> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => ProcessPhase)
  @AllowNull(false)
  @Column(DataType.CHAR(36))
  declare phase_id: string;

  @AllowNull(true)
  @Column(DataType.STRING(20))
  declare step_no: string | null;

  @AllowNull(false)
  @Column(DataType.STRING(500))
  declare title: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.TINYINT)
  declare is_gate: boolean;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare gate_between: string | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.TINYINT)
  declare is_continuous: boolean;

  @AllowNull(true)
  @Column(DataType.DECIMAL(5, 2))
  declare pct_start: number | null;

  @AllowNull(true)
  @Column(DataType.DECIMAL(5, 2))
  declare pct_end: number | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare summary: string | null;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare sort_order: number;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  declare updated_at: Date;

  // Associations
  @BelongsTo(() => ProcessPhase, {
    onDelete: 'CASCADE',
  })
  declare phase: ProcessPhase;

  @BelongsToMany(() => TradeTeam, () => ProcessStepTeam)
  declare teams: TradeTeam[];

  @BelongsToMany(() => DeliverableType, () => ProcessStepDeliverable)
  declare deliverables: DeliverableType[];

  @HasMany(() => ProjectStepProgress)
  declare projectProgress: ProjectStepProgress[];

  @HasMany(() => ProjectGateLog)
  declare gateLogs: ProjectGateLog[];
}
