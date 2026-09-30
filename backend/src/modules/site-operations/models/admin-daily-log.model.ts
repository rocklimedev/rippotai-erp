import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { DprWorkStatus } from '@/common/enums/dpr.enums';

/**
 * Sheet: "Admin Daily Log"
 * Filled by the Admin Coordinator every working day: approvals, POs,
 * vendor paperwork, billing support and scheduling.
 */
@Table({
  tableName: 'admin_daily_logs',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [{ name: 'idx_adl_status_due', fields: ['status', 'due_date'] }],
})
export class AdminDailyLog extends Model<AdminDailyLog> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  /** Day the entry was logged (the sheet is filled daily) */
  @Index
  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare log_date: string;

  /** Work Type e.g. Gate Approval, PO, Vendor Paperwork, Billing Support, Scheduling */
  @Column({ type: DataType.STRING(150), allowNull: false })
  declare work_type: string;

  /** Project */
  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare project_id: string | null;

  /** Details */
  @Column({ type: DataType.TEXT, allowNull: false })
  declare details: string;

  /** Status */
  @Column({
    type: DataType.ENUM(...Object.values(DprWorkStatus)),
    allowNull: false,
    defaultValue: DprWorkStatus.PENDING,
  })
  declare status: DprWorkStatus;

  /** Pending With (Client, Vendor, Accounts ...) */
  @Column({ type: DataType.STRING(255), allowNull: true })
  declare pending_with: string | null;

  /** Due Date */
  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare due_date: string | null;

  /** Remarks */
  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare completed_at: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare updated_by: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare deleted_by: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deleted_at: Date | null;

  // ============ Associations ============
  @BelongsTo(() => Project, { foreignKey: 'project_id', as: 'project' })
  declare project: Project;

  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  declare creator: User;

  @BelongsTo(() => User, { foreignKey: 'updated_by', as: 'updater' })
  declare updater: User;
}
