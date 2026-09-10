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
import { PlannerModule } from '@/common/enums/project-planner.enum';
import { ProjectPhase } from './project-phase.model';
import { ProjectPlannerTask } from './project-planner-task.model';

/**
 * Master catalog for the WORK / DETAILS rows shown under "DRAWINGS &
 * DESIGN" (Consultancy) and "WORK" (PMC). One row here = one reusable
 * checklist item; project_planner_tasks.template_id points back to the
 * row it was cloned from when a new project is created.
 */
@Table({
  tableName: 'planner_task_templates',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class PlannerTaskTemplate extends Model<PlannerTaskTemplate> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @Column({
    type: DataType.ENUM(...Object.values(PlannerModule)),
    allowNull: false,
  })
  declare module: PlannerModule;

  @ForeignKey(() => ProjectPhase)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare phase_id: string | null;

  /**
   * Self-referencing: null = WORK-level row (e.g. "MATERIAL SELECTION"),
   * set = DETAILS-level sub-item (e.g. "TILE SELECTION" under it).
   * Note titles are intentionally NOT unique — e.g. PMC has three
   * separate "PAINT" WORK rows across different phases, each with its
   * own DETAILS child, so uniqueness lives at the row (id) level only.
   */
  @ForeignKey(() => PlannerTaskTemplate)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare parent_id: string | null;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare sort_order: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare is_active: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deleted_at: Date | null;

  // ===================== Associations =====================

  @BelongsTo(() => ProjectPhase, { foreignKey: 'phase_id', as: 'phase' })
  declare phase: ProjectPhase;

  @BelongsTo(() => PlannerTaskTemplate, {
    foreignKey: 'parent_id',
    as: 'parent',
  })
  declare parent: PlannerTaskTemplate;

  @HasMany(() => PlannerTaskTemplate, {
    foreignKey: 'parent_id',
    as: 'children',
  })
  declare children: PlannerTaskTemplate[];

  @HasMany(() => ProjectPlannerTask, {
    foreignKey: 'template_id',
    as: 'instances',
  })
  declare instances: ProjectPlannerTask[];
}
