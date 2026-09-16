import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Index,
  Unique,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { MaterialMaster } from './material-master.model';
import { Vendor } from '@/modules/vendors/models/vendors.model';

import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

@Table({
  tableName: 'material_vendors',
  timestamps: true,
})
export class MaterialVendor extends Model<
  InferAttributes<MaterialVendor>,
  InferCreationAttributes<MaterialVendor>
> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  // ============================================================
  // MATERIAL
  // ============================================================

  @ForeignKey(() => MaterialMaster)
  @AllowNull(false)
  @Index
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare material_id: string;

  @BelongsTo(() => MaterialMaster, {
    foreignKey: 'material_id',
    as: 'material',
  })
  declare material?: MaterialMaster;

  // ============================================================
  // VENDOR
  // ============================================================

  @ForeignKey(() => Vendor)
  @AllowNull(false)
  @Index
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare vendor_id: string;

  @BelongsTo(() => Vendor, {
    foreignKey: 'vendor_id',
    as: 'vendor',
  })
  declare vendor?: Vendor;

  // ============================================================
  // VENDOR-SPECIFIC PRODUCT CODE
  // ============================================================

  @AllowNull(true)
  @Column(DataType.STRING(100))
  declare vendor_material_code: string | null;

  // ============================================================
  // PRICE
  // ============================================================

  @AllowNull(true)
  @Column(DataType.DECIMAL(15, 2))
  declare price: number | null;

  // ============================================================
  // OPTIONAL COMMERCIAL INFORMATION
  // ============================================================

  @AllowNull(true)
  @Column(DataType.DECIMAL(5, 2))
  declare discount_percent: number | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare lead_time_days: number | null;

  // ============================================================
  // PREFERRED VENDOR
  // ============================================================

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare is_preferred: CreationOptional<boolean>;

  // ============================================================
  // STATUS
  // ============================================================

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare is_active: CreationOptional<boolean>;

  // ============================================================
  // AUDIT
  // ============================================================

  @AllowNull(true)
  @Column(DataType.UUID)
  declare created_by: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare updated_by: string | null;
}
