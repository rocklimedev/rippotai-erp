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
import { PlannerTaskFloorProgress } from './planner-task-floor-progress.model';
import { ProjectRoom } from './project-room.model';

@Table({
  tableName: 'project_floors',
  timestamps: true,
  paranoid: false,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ProjectFloor extends Model<ProjectFloor> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare floor_number: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare floor_name: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare sort_order: number;

  // ===================== Associations =====================

  @BelongsTo(() => Project, { foreignKey: 'project_id' })
  declare project: Project;

  @HasMany(() => PlannerTaskFloorProgress, { foreignKey: 'project_floor_id' })
  declare floor_progress: PlannerTaskFloorProgress[];

  /** See project-room.model.ts — supports the Overview sheet's per-room grid. */
  @HasMany(() => ProjectRoom, { foreignKey: 'project_floor_id' })
  declare rooms: ProjectRoom[];
}
