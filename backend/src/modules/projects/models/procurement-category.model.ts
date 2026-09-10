import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
  IsUUID,
} from 'sequelize-typescript';
import { ProcurementCategoryType } from '@/common/enums/project-planner.enum';
import { ProjectVendorProcurement } from './project-vendor-procurement.model';

/**
 * Master list backing the "LABOUR CONTRACTOR" / "MATERIAL VENDOR" columns
 * (TILES, FURNITURE, CIVIL, ELECTRICAL...). Shared across all projects;
 * per-project data (vendor name, dates) lives on ProjectVendorProcurement.
 */
@Table({
  tableName: 'procurement_categories',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class ProcurementCategory extends Model<ProcurementCategory> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({
    type: DataType.ENUM(...Object.values(ProcurementCategoryType)),
    allowNull: false,
  })
  declare type: ProcurementCategoryType;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare sort_order: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deleted_at: Date | null;

  // ===================== Associations =====================

  @HasMany(() => ProjectVendorProcurement, {
    foreignKey: 'procurement_category_id',
  })
  declare vendor_procurements: ProjectVendorProcurement[];
}
