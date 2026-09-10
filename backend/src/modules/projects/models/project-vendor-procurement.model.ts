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
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { ProcurementCategory } from './procurement-category.model';

/** One row per project per procurement category on the Vendor & Procurement sheet. */
@Table({
  tableName: 'project_vendor_procurements',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    { unique: true, fields: ['project_id', 'procurement_category_id'] },
  ],
})
export class ProjectVendorProcurement extends Model<ProjectVendorProcurement> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  @ForeignKey(() => ProcurementCategory)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare procurement_category_id: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare s_no: number;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare vendor_name: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare estimate_finalised_date: Date | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare quotation_finalised_date: Date | null;

  /** Timeline (labour work) — START */
  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare labour_start_date: Date | null;

  /** Timeline (labour work) — END */
  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare labour_end_date: Date | null;

  /** Status (material) — PURCHASE */
  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare material_purchase_date: Date | null;

  /** Status (material) — RECEIVED AT SITE */
  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare material_received_date: Date | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare updated_by: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deleted_at: Date | null;

  // ===================== Associations =====================

  @BelongsTo(() => Project, { foreignKey: 'project_id' })
  declare project: Project;

  @BelongsTo(() => ProcurementCategory, { foreignKey: 'procurement_category_id', as: 'category' })
  declare category: ProcurementCategory;

  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  declare creator: User;

  @BelongsTo(() => User, { foreignKey: 'updated_by', as: 'updater' })
  declare updater: User;
}
