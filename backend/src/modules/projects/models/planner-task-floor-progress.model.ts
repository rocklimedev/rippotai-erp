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
import { ProjectPlannerTask } from './project-planner-task.model';
import { ProjectFloor } from './project-floor.model';

/** One cell of the "FLOOR 1 / FLOOR 2 / ..." grid on Consultancy & PMC sheets. */
@Table({
  tableName: 'planner_task_floor_progress',
  timestamps: true,
  paranoid: false,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['project_planner_task_id', 'project_floor_id'] },
  ],
})
export class PlannerTaskFloorProgress extends Model<PlannerTaskFloorProgress> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => ProjectPlannerTask)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_planner_task_id: string;

  @ForeignKey(() => ProjectFloor)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_floor_id: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare completed_date: Date | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  // ===================== Associations =====================

  @BelongsTo(() => ProjectPlannerTask, { foreignKey: 'project_planner_task_id', as: 'task' })
  declare task: ProjectPlannerTask;

  @BelongsTo(() => ProjectFloor, { foreignKey: 'project_floor_id', as: 'floor' })
  declare floor: ProjectFloor;
}
