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

import { ProjectPlannerItem } from './project_planner_items.model';
import { ProjectLocation } from './project_locations.model';
import { User } from '@/modules/users/models/user.model';
import { PlannerItemStatus } from '@/common/enums/project-planner.enum';

/**
 * Attributes accepted when creating a ProjectPlannerItemLocation.
 *
 * Keep this separate from the Model itself so Sequelize does not expect
 * model instance methods such as get(), set(), update(), etc. during create()
 * or findOrCreate().
 */
export interface ProjectPlannerItemLocationCreationAttributes {
  id?: string;

  planner_item_id: string;

  location_id: string;

  status?: PlannerItemStatus;

  progress_pct?: number;

  planned_start_date?: string | null;

  planned_end_date?: string | null;

  actual_start_date?: string | null;

  actual_end_date?: string | null;

  assigned_to?: string | null;

  remarks?: string | null;
}

@Table({
  tableName: 'project_planner_item_locations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['planner_item_id', 'location_id'],
    },
  ],
})
export class ProjectPlannerItemLocation extends Model<
  ProjectPlannerItemLocation,
  ProjectPlannerItemLocationCreationAttributes
> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ============================================================
  // RELATIONSHIPS
  // ============================================================

  @ForeignKey(() => ProjectPlannerItem)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare planner_item_id: string;

  @ForeignKey(() => ProjectLocation)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare location_id: string;

  // ============================================================
  // STATUS
  // ============================================================

  @Column({
    type: DataType.ENUM(...Object.values(PlannerItemStatus)),
    allowNull: false,
    defaultValue: PlannerItemStatus.NOT_STARTED,
  })
  declare status: PlannerItemStatus;

  // ============================================================
  // PROGRESS
  // ============================================================

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare progress_pct: number;

  // ============================================================
  // PLANNED DATES
  // DATEONLY should be represented as YYYY-MM-DD strings.
  // ============================================================

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare planned_start_date: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare planned_end_date: string | null;

  // ============================================================
  // ACTUAL DATES
  // ============================================================

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare actual_start_date: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare actual_end_date: string | null;

  // ============================================================
  // ASSIGNMENT
  // ============================================================

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare assigned_to: string | null;

  // ============================================================
  // REMARKS
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  // ============================================================
  // ASSOCIATIONS
  // ============================================================

  @BelongsTo(() => ProjectPlannerItem)
  declare planner_item: ProjectPlannerItem;

  @BelongsTo(() => ProjectLocation)
  declare location: ProjectLocation;

  @BelongsTo(() => User, {
    foreignKey: 'assigned_to',
    as: 'assignee',
  })
  declare assignee: User | null;
}
