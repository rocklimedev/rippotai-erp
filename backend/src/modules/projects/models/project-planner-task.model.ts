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
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import {
  PlannerModule,
  PlannerTaskStatus,
} from '@/common/enums/project-planner.enum';
import { ProjectPhase } from './project-phase.model';
import { PlannerTaskTemplate } from './planner-task-template.model';
import { PlannerTaskFloorProgress } from './planner-task-floor-progress.model';

/**
 * One row per project for both the Consultancy sheet ("DRAWINGS &
 * DESIGN" / "DETAILS") and the PMC sheet ("WORK" / "DETAILS"). Which
 * sheet a row belongs to is `module`; whether it's a WORK-level or
 * DETAILS-level row is whether `parent_id` is null.
 */
@Table({
  tableName: 'project_planner_tasks',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class ProjectPlannerTask extends Model<ProjectPlannerTask> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  @Column({
    type: DataType.ENUM(...Object.values(PlannerModule)),
    allowNull: false,
  })
  declare module: PlannerModule;

  @ForeignKey(() => ProjectPhase)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare phase_id: string | null;

  /** Source template this row was cloned from. Null = ad-hoc row added for this project only. */
  @ForeignKey(() => PlannerTaskTemplate)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare template_id: string | null;

  /** Self-referencing: null = WORK-level row, set = DETAILS-level sub-item. */
  @ForeignKey(() => ProjectPlannerTask)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare parent_id: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare s_no: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({
    type: DataType.ENUM(...Object.values(PlannerTaskStatus)),
    allowNull: false,
    defaultValue: PlannerTaskStatus.PENDING,
  })
  declare status: PlannerTaskStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare updated_by: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deleted_at: Date | null;

  // ===================== Associations =====================

  @BelongsTo(() => Project, { foreignKey: 'project_id' })
  declare project: Project;

  @BelongsTo(() => ProjectPhase, { foreignKey: 'phase_id', as: 'phase' })
  declare phase: ProjectPhase;

  @BelongsTo(() => PlannerTaskTemplate, {
    foreignKey: 'template_id',
    as: 'template',
  })
  declare template: PlannerTaskTemplate;

  @BelongsTo(() => ProjectPlannerTask, {
    foreignKey: 'parent_id',
    as: 'parent',
  })
  declare parent: ProjectPlannerTask;

  @HasMany(() => ProjectPlannerTask, {
    foreignKey: 'parent_id',
    as: 'children',
  })
  declare children: ProjectPlannerTask[];

  @HasMany(() => PlannerTaskFloorProgress, {
    foreignKey: 'project_planner_task_id',
    as: 'floor_progress',
  })
  declare floor_progress: PlannerTaskFloorProgress[];

  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  declare creator: User;

  @BelongsTo(() => User, { foreignKey: 'updated_by', as: 'updater' })
  declare updater: User;
}
