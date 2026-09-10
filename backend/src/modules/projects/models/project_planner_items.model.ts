import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  IsUUID,
} from 'sequelize-typescript';

import { ProjectPlanner } from './project_planners.model';
import { ProjectPhase } from './project-phase.model';
import { DocumentType } from '@/modules/documents/models/document-type.model';
import { User } from '@/modules/users/models/user.model';

import { PlannerItemStatus } from '@/common/enums/project-planner.enum';
import { ProjectPlannerItemLocation } from './project_planner_item_locations.model';

/**
 * Attributes accepted when creating a ProjectPlannerItem.
 *
 * DATEONLY fields are intentionally strings because the API uses
 * YYYY-MM-DD calendar dates rather than JavaScript timestamps.
 */
export interface ProjectPlannerItemCreationAttributes {
  id?: string;

  planner_id: string;
  phase_id: string;

  work_name?: string | null;
  details?: string | null;

  document_type_id?: string | null;

  status?: PlannerItemStatus;

  planned_start_date?: string | null;
  planned_end_date?: string | null;

  actual_start_date?: string | null;
  actual_end_date?: string | null;

  progress_pct?: number;

  assigned_to?: string | null;

  remarks?: string | null;

  sort_order?: number;

  created_by?: string | null;
}

@Table({
  tableName: 'project_planner_items',

  timestamps: true,

  paranoid: true,

  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',

  indexes: [
    {
      fields: ['planner_id', 'phase_id'],
    },
    {
      fields: ['planner_id', 'sort_order'],
    },
    {
      fields: ['document_type_id'],
    },
  ],
})
export class ProjectPlannerItem extends Model<
  ProjectPlannerItem,
  ProjectPlannerItemCreationAttributes
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
  // PLANNER
  // ============================================================

  @ForeignKey(() => ProjectPlanner)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare planner_id: string;

  // ============================================================
  // PHASE
  // ============================================================

  /**
   * Existing ProjectPhase.
   *
   * Consultancy examples:
   * - PRE-DESIGN
   * - DESIGN
   * - MATERIAL SELECTION
   * - TENDER DRAWINGS
   * - WORKING DRAWINGS
   *
   * PMC examples:
   * - SITE PREPARATION
   * - CIVIL WORK
   * - FIT OUTS
   * - FINISHING
   * - SNAG & HANDOVER
   */
  @ForeignKey(() => ProjectPhase)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare phase_id: string;

  // ============================================================
  // WORK
  // ============================================================

  /**
   * Consultancy:
   * - EXISTING LAYOUT
   * - CONCEPT DESIGN 01-3D
   * - ELECTRICAL LAYOUT
   *
   * PMC:
   * - DEMOLITION
   * - FOUNDATION
   * - FLOORING
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare work_name: string | null;

  // ============================================================
  // DETAILS
  // ============================================================

  /**
   * Examples:
   * - LAYOUT FINALISATION
   * - WITH MATERIAL
   * - TILE SELECTION
   * - CONCRETE & RCC
   * - SWITCH BOARDS
   */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare details: string | null;

  // ============================================================
  // DOCUMENT TYPE
  // ============================================================

  /**
   * Optional connection with the existing DocumentType master.
   *
   * Example:
   * ELECTRICAL LAYOUT -> ELECTRICAL_LAYOUT DocumentType
   */
  @ForeignKey(() => DocumentType)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare document_type_id: string | null;

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
  // PLANNED DATES
  // ============================================================

  /**
   * DATEONLY is represented as YYYY-MM-DD.
   *
   * Example:
   * 2026-09-10
   *
   * Do not use Date here because these are calendar dates,
   * not timestamps.
   */
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
  // PROGRESS
  // ============================================================

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare progress_pct: number;

  // ============================================================
  // ASSIGNED USER
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
  // SORT ORDER
  // ============================================================

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sort_order: number;

  // ============================================================
  // CREATED BY
  // ============================================================

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  // ============================================================
  // ASSOCIATIONS
  // ============================================================

  @BelongsTo(() => ProjectPlanner)
  declare planner: ProjectPlanner;

  @BelongsTo(() => ProjectPhase)
  declare phase: ProjectPhase;

  @BelongsTo(() => DocumentType)
  declare document_type: DocumentType | null;

  @BelongsTo(() => User, {
    foreignKey: 'assigned_to',
    as: 'assignee',
  })
  declare assignee: User | null;

  @HasMany(() => ProjectPlannerItemLocation, {
    foreignKey: 'planner_item_id',
    as: 'locations',
  })
  declare locations: ProjectPlannerItemLocation[];
}
