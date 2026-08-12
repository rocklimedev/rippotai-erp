import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { QcChecklistTemplate } from './qc-checklist-template.model';

export enum PhaseQcSignoffStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  REWORK = 'rework',
}

@Table({
  tableName: 'phase_qc_signoffs',
  timestamps: false,
  underscored: true,
})
export class PhaseQcSignoff extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'project_id',
  })
  declare projectId: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'step_id',
  })
  declare stepId: string | null;

  @ForeignKey(() => QcChecklistTemplate)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'checklist_id',
  })
  declare checklistId: string | null;

  @BelongsTo(() => QcChecklistTemplate, {
    foreignKey: 'checklistId',
  })
  declare checklist: QcChecklistTemplate;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'trade_team_id',
  })
  declare tradeTeamId: string | null;

  @Default(PhaseQcSignoffStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(PhaseQcSignoffStatus)),
    allowNull: false,
  })
  declare status: PhaseQcSignoffStatus;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'checked_by',
  })
  declare checkedBy: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'checked_at',
  })
  declare checkedAt: Date | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;
}
