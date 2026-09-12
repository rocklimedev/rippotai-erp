import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  IsUUID,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { ProjectPhaseModule } from '@/common/enums/project-planner.enum';
import { ProjectPhase } from '@/modules/projects/models/project-phase.model';
import { TaskType } from '@/common/enums/command-center.enum';
import { TaskExecution } from './task-execution.model';

@Table({
  tableName: 'task_definitions',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [{ unique: true, fields: ['module', 'code'] }],
})
export class TaskDefinition extends Model<TaskDefinition> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @Column({
    type: DataType.ENUM(...Object.values(ProjectPhaseModule)),
    allowNull: false,
  })
  declare module: ProjectPhaseModule;

  @ForeignKey(() => ProjectPhase)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare phase_id: string;

  @BelongsTo(() => ProjectPhase)
  declare phase: ProjectPhase;

  /** Task code, e.g. T0101 */
  @Column({ type: DataType.STRING(20), allowNull: false })
  declare code: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({
    type: DataType.ENUM(...Object.values(TaskType)),
    allowNull: false,
    defaultValue: TaskType.EXEC,
  })
  declare type: TaskType;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare mandatory: boolean;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare owner_role: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare sort_order: number;

  @HasMany(() => TaskExecution)
  declare executions: TaskExecution[];
}
