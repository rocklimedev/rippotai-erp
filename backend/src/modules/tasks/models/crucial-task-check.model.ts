import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Task } from './task.model';
import { User } from '../../users/models/user.model';

@Table({
  tableName: 'crucial_task_checks',
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ['task_id', 'cycle_date', 'cycle'] }],
})
export class CrucialTaskCheck extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Task)
  @Column({ type: DataType.UUID, allowNull: false })
  declare task_id: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare cycle_date: string;

  @Column({ type: DataType.ENUM('daily', 'weekly'), allowNull: false })
  declare cycle: 'daily' | 'weekly';

  @Column({
    type: DataType.ENUM('checked', 'in_progress', 'not_checked'),
    allowNull: false,
  })
  declare check_status: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare follow_up: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare checked_by: string;

  @BelongsTo(() => User, { foreignKey: 'checked_by', as: 'checker' })
  declare checker?: User;
}
