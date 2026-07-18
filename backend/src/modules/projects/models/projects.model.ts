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
import { Client } from '../../clients/models/client.model';
import { ProjectType } from './project-type.model';
import { ProjectPriority, ProjectStatus } from '@/common/enums';
import { User } from '@/modules/users/models/user.model';
import { Quotation } from '@/modules/quotations/models/quotations.model';
import { Boq } from '@/modules/boqs/models/boq.model';

@Table({
  tableName: 'projects',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class Project extends Model<Project> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare slug: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare client_id: string | null;

  @ForeignKey(() => ProjectType)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare project_type_id: string | null;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare site_location: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(ProjectPriority)),
    allowNull: false,
    defaultValue: ProjectPriority.MEDIUM,
  })
  declare priority: ProjectPriority;

  @Column({
    type: DataType.ENUM(...Object.values(ProjectStatus)),
    allowNull: false,
    defaultValue: ProjectStatus.ACTIVE,
  })
  declare status: ProjectStatus;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare expected_completion_date: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare quotation_count: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  declare approved_value: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare updated_by: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare archived_at: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare archived_by: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deleted_at: Date | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'deleted_by',
  })
  declare deleted_by: string | null;

  // === Dashboard-specific fields (added to fix TS errors) ===
  @Column({ type: DataType.STRING(100), allowNull: true })
  declare current_phase: string | null;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true, defaultValue: 0 })
  declare progress_pct: number | null;

  @Column({ type: DataType.STRING(50), allowNull: true })
  declare timeline_status: 'ON_TIME' | 'AT_RISK' | 'DELAYED' | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare next_milestone_name: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  declare schedule_variance: number;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  declare planned_duration: number;

  // ===================== Associations =====================
  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  declare creator: User;

  @BelongsTo(() => User, { foreignKey: 'updated_by', as: 'updater' })
  declare updater: User;

  @BelongsTo(() => User, { foreignKey: 'archived_by', as: 'archiver' })
  declare archiver: User;

  @HasMany(() => Quotation, { foreignKey: 'project_id' })
  declare quotations: Quotation[];

  @HasMany(() => Boq, { foreignKey: 'project_id', as: 'boqs' })
  declare boqs: Boq[];

  @BelongsTo(() => Client, { foreignKey: 'client_id', as: 'client' })
  declare client: Client;

  @BelongsTo(() => ProjectType, {
    foreignKey: 'project_type_id',
    as: 'project_type',
  })
  declare project_type: ProjectType;
}
