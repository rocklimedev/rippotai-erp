import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  Index,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Vendor } from '@/modules/vendors/models/vendors.model';
import { Unit } from '@/modules/metas/models/unit.model';

import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

@Table({
  tableName: 'material_masters',
  timestamps: true,
})
export class MaterialMaster extends Model<
  InferAttributes<MaterialMaster>,
  InferCreationAttributes<MaterialMaster>
> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  // ============================================================
  // MATERIAL IDENTIFICATION
  // ============================================================

  @AllowNull(false)
  @Unique
  @Index
  @Column(DataType.STRING(50))
  declare material_code: string;

  @AllowNull(false)
  @Index
  @Column(DataType.STRING(255))
  declare name: string;

  // ============================================================
  // CLASSIFICATION
  // ============================================================

  @AllowNull(true)
  @Index
  @Column(DataType.STRING(100))
  declare category: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(100))
  declare sub_category: string | null;

  // ============================================================
  // BRAND / PRODUCT INFORMATION
  // ============================================================

  @AllowNull(true)
  @Index
  @Column(DataType.STRING(150))
  declare brand: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(150))
  declare model: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare specification: string | null;

  // ============================================================
  // VENDOR
  // ============================================================

  @ForeignKey(() => Vendor)
  @AllowNull(true)
  @Index
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare vendor_id: string | null;

  @BelongsTo(() => Vendor, {
    foreignKey: 'vendor_id',
    as: 'vendor',
  })
  declare vendor: Vendor | null;

  // ============================================================
  // UNIT
  // ============================================================

  @ForeignKey(() => Unit)
  @AllowNull(false)
  @Index
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare unit_id: string;

  @BelongsTo(() => Unit, {
    foreignKey: 'unit_id',
    as: 'unit',
  })
  declare unit?: Unit;

  // ============================================================
  // TAX
  // ============================================================

  @AllowNull(true)
  @Column(DataType.STRING(30))
  declare hsn_code: string | null;

  // ============================================================
  // DESCRIPTION
  // ============================================================

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description: string | null;

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
