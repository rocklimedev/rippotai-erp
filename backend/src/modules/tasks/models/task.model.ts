import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Project } from '@/modules/projects/models/projects.model';

export interface TaskAttributes {
  id: string;
  title: string;
  project_id: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'completed';
  due_date: Date | null;
  due_bucket: string | null;
  order_index: number;
  workload_estimate_hours: number;
  created_at: Date;
  updated_at: Date;
}

export interface TaskCreationAttributes extends Optional<
  TaskAttributes,
  | 'id'
  | 'project_id'
  | 'priority'
  | 'status'
  | 'due_date'
  | 'due_bucket'
  | 'order_index'
  | 'workload_estimate_hours'
  | 'created_at'
  | 'updated_at'
> {}

@Table({
  tableName: 'tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Task extends Model<TaskAttributes, TaskCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare project_id: string | null;

  @BelongsTo(() => Project, {
    foreignKey: 'project_id',
    targetKey: 'id',
  })
  declare project?: Project;

  @Column({
    type: DataType.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium',
  })
  declare priority: 'low' | 'medium' | 'high' | 'critical';

  @Column({
    type: DataType.ENUM('todo', 'completed'),
    allowNull: false,
    defaultValue: 'todo',
  })
  declare status: 'todo' | 'completed';

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare due_date: Date | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare due_bucket: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare order_index: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare workload_estimate_hours: number;

  @CreatedAt
  @Column(DataType.DATE)
  declare created_at: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updated_at: Date;
}
