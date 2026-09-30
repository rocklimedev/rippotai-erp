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
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { QualityChecklist } from './quality-checklist.model';
import { User } from '@/modules/users/models/user.model';

export enum ItemStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  DEFERRED = 'DEFERRED',
}

export enum CheckpointPhase {
  BEFORE_EXECUTION = 'BEFORE_EXECUTION',
  DURING_EXECUTION = 'DURING_EXECUTION',
  AFTER_EXECUTION = 'AFTER_EXECUTION',
}

export interface QualityChecklistItemAttributes {
  id: string;
  checklist_id: string;
  serial_number: number;
  checkpoint_name: string;
  checkpoint_description: string | null;
  phase: CheckpointPhase;
  status: ItemStatus;
  is_accepted: boolean | null;
  remarks: string | null;
  inspection_date: Date | null;
  inspected_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface QualityChecklistItemCreationAttributes extends Optional<
  QualityChecklistItemAttributes,
  | 'id'
  | 'phase'
  | 'status'
  | 'checkpoint_description'
  | 'remarks'
  | 'inspection_date'
  | 'is_accepted'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at'
> {}
@Table({
  tableName: 'quality_checklist_items',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class QualityChecklistItem extends Model<
  QualityChecklistItemAttributes,
  QualityChecklistItemCreationAttributes
> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => QualityChecklist)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare checklist_id: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare serial_number: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare checkpoint_name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare checkpoint_description: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(CheckpointPhase)),
    allowNull: false,
    defaultValue: CheckpointPhase.DURING_EXECUTION,
  })
  declare phase: CheckpointPhase;

  @Column({
    type: DataType.ENUM(...Object.values(ItemStatus)),
    allowNull: false,
    defaultValue: ItemStatus.NOT_STARTED,
  })
  declare status: ItemStatus;

  @Column({ type: DataType.BOOLEAN, allowNull: true })
  declare is_accepted: boolean | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare inspection_date: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare inspected_by: string | null;

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

  @BelongsTo(() => QualityChecklist, {
    foreignKey: 'checklist_id',
    as: 'checklist',
  })
  declare checklist: QualityChecklist;

  @BelongsTo(() => User, { foreignKey: 'inspected_by', as: 'inspector' })
  declare inspector: User;

  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  declare creator: User;

  @BelongsTo(() => User, { foreignKey: 'updated_by', as: 'updater' })
  declare updater: User;
}
