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
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { TaskDefinition } from './task-definitions.model';
import { TaskExecutionStatus } from '@/common/enums/command-center.enum';

@Table({
  tableName: 'task_executions',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [{ unique: true, fields: ['project_id', 'task_definition_id'] }],
})
export class TaskExecution extends Model<TaskExecution> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  @BelongsTo(() => Project)
  declare project: Project;

  @ForeignKey(() => TaskDefinition)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare task_definition_id: string;

  @BelongsTo(() => TaskDefinition)
  declare task_definition: TaskDefinition;

  @Column({
    type: DataType.ENUM(...Object.values(TaskExecutionStatus)),
    allowNull: false,
    defaultValue: TaskExecutionStatus.PENDING,
  })
  declare status: TaskExecutionStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare completed_by: string | null;

  @BelongsTo(() => User, { foreignKey: 'completed_by' })
  declare completer: User;

  @Column({ type: DataType.DATE, allowNull: true })
  declare completed_at: Date | null;
}
