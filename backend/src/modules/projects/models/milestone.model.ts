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
import { Project } from '../../projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Table({
  tableName: 'milestones',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class Milestone extends Model<Milestone> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare due_date: Date;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare planned_start: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare completed_at: Date | null;

  @Column({
    type: DataType.ENUM(...Object.values(MilestoneStatus)),
    allowNull: false,
    defaultValue: MilestoneStatus.PENDING,
  })
  declare status: MilestoneStatus;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare order: number;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true, defaultValue: null })
  declare weight: number | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare assignee_id: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare updated_by: string | null;

  @BelongsTo(() => Project, { foreignKey: 'project_id', as: 'project' })
  declare project: Project;

  @BelongsTo(() => User, { foreignKey: 'assignee_id', as: 'assignee' })
  declare assignee: User | null;

  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  declare creator: User | null;
}
