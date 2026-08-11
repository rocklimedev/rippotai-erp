import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

import { TradeTeam } from './trade-team.model';
import { ProcessStep } from './process-step.model';
import { ProjectPhaseProgress } from './project-phase-progress.model';

@Table({
  tableName: 'process_phases',
  timestamps: true,
  underscored: false,
})
export class ProcessPhase extends Model<ProcessPhase> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @AllowNull(false)
  @Unique('uk_process_phases_no')
  @Column(DataType.STRING(10))
  declare phase_no: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  declare title: string;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare span_label: string | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.TINYINT)
  declare is_parallel: boolean;

  @ForeignKey(() => TradeTeam)
  @AllowNull(true)
  @Column(DataType.CHAR(36))
  declare lead_team_id: string | null;

  @AllowNull(true)
  @Column(DataType.DECIMAL(5, 2))
  declare pct_start: number | null;

  @AllowNull(true)
  @Column(DataType.DECIMAL(5, 2))
  declare pct_end: number | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare note: string | null;

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
  @BelongsTo(() => TradeTeam, {
    foreignKey: 'lead_team_id',
    onDelete: 'SET NULL',
  })
  declare leadTeam: TradeTeam;

  @HasMany(() => ProcessStep)
  declare steps: ProcessStep[];

  @HasMany(() => ProjectPhaseProgress)
  declare projectProgress: ProjectPhaseProgress[];
}
