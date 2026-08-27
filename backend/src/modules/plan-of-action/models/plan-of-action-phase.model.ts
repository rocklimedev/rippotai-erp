import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  IsUUID,
} from 'sequelize-typescript';

import { PlanOfAction } from './plan-of-action.model';
import { ProjectPhase } from '../../projects/models/project-phase.model';

@Table({
  tableName: 'plan_of_action_phases',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class PlanOfActionPhase extends Model<PlanOfActionPhase> {
  // ===================== Primary Key =====================

  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ===================== Plan of Action =====================

  @ForeignKey(() => PlanOfAction)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare plan_of_action_id: string;

  // ===================== Project Phase =====================

  @ForeignKey(() => ProjectPhase)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_phase_id: string;

  // ===================== Phase Timing =====================

  /**
   * Minimum expected duration of this phase.
   *
   * Example:
   * 30-45 Days
   * duration_min_days = 30
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare duration_min_days: number | null;

  /**
   * Maximum expected duration of this phase.
   *
   * Example:
   * 30-45 Days
   * duration_max_days = 45
   *
   * For a fixed duration such as "07 Days":
   * duration_min_days = 7
   * duration_max_days = 7
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare duration_max_days: number | null;

  // ===================== Phase Notes =====================

  /**
   * Additional work that happens in parallel with this phase.
   *
   * Example:
   * "PARALLEL WORK — OVERALL MATERIAL SELECTION"
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare parallel_work_note: string | null;

  /**
   * Additional inclusion information for this phase.
   *
   * Example:
   * "INCLUDES — PAINT 1ST COAT"
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare inclusion_note: string | null;

  // ===================== Gantt =====================

  /**
   * Number of days from the site/project start
   * at which this phase begins on the Gantt chart.
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare gantt_start_offset_days: number;

  /**
   * Number of days this phase occupies on the Gantt chart.
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare gantt_duration_days: number;

  // ===================== Ordering =====================

  /**
   * Ordering of phases within this Plan of Action.
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare sort_order: number;

  // ===================== Associations =====================

  @BelongsTo(() => PlanOfAction, {
    foreignKey: 'plan_of_action_id',
    as: 'plan_of_action',
  })
  declare plan_of_action: PlanOfAction;

  @BelongsTo(() => ProjectPhase, {
    foreignKey: 'project_phase_id',
    as: 'project_phase',
  })
  declare project_phase: ProjectPhase;

  // ===================== Soft Delete =====================

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare deleted_at: Date | null;
}
