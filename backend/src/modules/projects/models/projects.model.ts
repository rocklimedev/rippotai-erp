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
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare slug: string;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare client_id: string | null;

  @ForeignKey(() => ProjectType)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare project_type_id: string | null;
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare site_location: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
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
  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare expected_completion_date: Date | null;
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare quotation_count: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  declare approved_value: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare updated_by: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare archived_at: Date | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare archived_by: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  @BelongsTo(() => User, {
    foreignKey: 'updated_by',
    as: 'updater',
  })
  declare updater: User;

  @BelongsTo(() => User, {
    foreignKey: 'archived_by',
    as: 'archiver',
  })
  declare archiver: User;
  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'deleted_by',
  })
  declare deleted_by: string | null;
  @HasMany(() => Quotation, {
    foreignKey: 'project_id',
  })
  declare quotations: Quotation[];
  @HasMany(() => Boq, {
    foreignKey: 'project_id',
    as: 'boqs',
  })
  declare boqs: Boq[];
  @BelongsTo(() => Client, {
    foreignKey: 'client_id',
    as: 'client',
  })
  declare client: Client;

  @BelongsTo(() => ProjectType, {
    foreignKey: 'project_type_id',
    as: 'project_type',
  })
  declare project_type: ProjectType;
}
