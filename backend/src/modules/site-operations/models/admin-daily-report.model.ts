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
 * Sheet: "ADMIN DAILY REPORT"
 * One row = one project's progress entry for one day.
 */
@Table({
  tableName: 'admin_daily_reports',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    { name: 'idx_adr_date_project', fields: ['report_date', 'project_id'] },
  ],
})
export class AdminDailyReport extends Model<AdminDailyReport> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  /** DATE */
  @Index
  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare report_date: string;

  /** PROJECT */
  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  /** WORK STATUS */
  @Column({
    type: DataType.ENUM(...Object.values(DprWorkStatus)),
    allowNull: false,
    defaultValue: DprWorkStatus.PENDING,
  })
  declare work_status: DprWorkStatus;

  /** WORK DETAILS */
  @Column({ type: DataType.TEXT, allowNull: true })
  declare work_details: string | null;

  /** CONTRACTOR WORKING */
  @Column({ type: DataType.TEXT, allowNull: true })
  declare contractor_working: string | null;

  /** WORK PLANNED TOMORROW */
  @Column({ type: DataType.TEXT, allowNull: true })
  declare work_planned_tomorrow: string | null;

  /** MATERIAL REQUIRED TOMORROW */
  @Column({ type: DataType.TEXT, allowNull: true })
  declare material_required_tomorrow: string | null;

  /** MATERIAL SENT FROM VENDOR */
  @Column({ type: DataType.TEXT, allowNull: true })
  declare material_sent_from_vendor: string | null;

  /** MATERIAL SENT FROM INVENTORY */
  @Column({ type: DataType.TEXT, allowNull: true })
  declare material_sent_from_inventory: string | null;

  /** ISSUE/BLOCKERS */
  @Column({ type: DataType.TEXT, allowNull: true })
  declare issues_blockers: string | null;

  /** Lists sheet -> PHOTOS ATTACHED (Y/N) */
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare photos_attached: boolean;

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
