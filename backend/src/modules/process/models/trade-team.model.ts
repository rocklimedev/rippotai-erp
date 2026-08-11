import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  CreatedAt,
  UpdatedAt,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';

import { ProcessPhase } from './process-phase.model';
import { ProcessStep } from './process-step.model';
import { ProcessStepTeam } from './process-step-team.model';

@Table({
  tableName: 'trade_teams',
  timestamps: true,
  underscored: false,
})
export class TradeTeam extends Model<TradeTeam> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare id: string;

  @AllowNull(false)
  @Unique('uk_trade_teams_code')
  @Column({
    type: DataType.STRING(10),
    allowNull: false,
  })
  declare code: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  declare name: string;

  @AllowNull(false)
  @Default(false)
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
  })
  declare is_core: boolean;

  @AllowNull(false)
  @Default(false)
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
  })
  declare is_contractor: boolean;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(10),
    allowNull: true,
  })
  declare color_hex: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare sort_order: number;

  @AllowNull(false)
  @Default(true)
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 1,
  })
  declare is_active: boolean;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  declare updated_at: Date;

  // ==================== Associations ====================

  // One team can lead many process phases
  @HasMany(() => ProcessPhase, {
    foreignKey: 'lead_team_id',
    onDelete: 'SET NULL',
  })
  declare leadPhases: ProcessPhase[];

  // Many-to-Many with ProcessStep (through process_step_teams)
  @BelongsToMany(() => ProcessStep, () => ProcessStepTeam)
  declare steps: ProcessStep[];
}
