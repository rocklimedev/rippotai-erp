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
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { QualityChecklistItem } from './quality-checklist-item.model';

export enum ChecklistStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  ON_HOLD = 'ON_HOLD',
}

export interface QualityChecklistAttributes {
  id: string;
  project_id: string;
  checklist_name: string;
  description: string | null;
  status: ChecklistStatus;
  completion_percentage: number;
  created_by: string | null;
  updated_by: string | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface QualityChecklistCreationAttributes extends Optional<
  QualityChecklistAttributes,
  | 'id'
  | 'completion_percentage'
  | 'status'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at'
  | 'description'
> {}
@Table({
  tableName: 'quality_checklists',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class QualityChecklist extends Model<
  QualityChecklistAttributes,
  QualityChecklistCreationAttributes
> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare checklist_name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(ChecklistStatus)),
    allowNull: false,
    defaultValue: ChecklistStatus.PENDING,
  })
  declare status: ChecklistStatus;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare completion_percentage: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare updated_by: string | null;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  @DeletedAt
  declare deleted_at: Date | null;

  // ===================== Associations =====================

  @BelongsTo(() => Project, { foreignKey: 'project_id', as: 'project' })
  declare project: Project;

  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  declare creator: User;

  @BelongsTo(() => User, { foreignKey: 'updated_by', as: 'updater' })
  declare updater: User;

  @HasMany(() => QualityChecklistItem, {
    foreignKey: 'checklist_id',
    as: 'checklist_items',
  })
  declare checklist_items: QualityChecklistItem[];
}
