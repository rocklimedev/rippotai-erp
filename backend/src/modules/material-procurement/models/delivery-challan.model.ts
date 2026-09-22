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
  HasMany,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import { DeliveryChallanItem } from './delivery-challan-item.model';
import { MaterialRequirement } from './material-requirement.model';

export enum DeliveryChallanStatus {
  DRAFT = 'DRAFT',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  PARTIALLY_ACCEPTED = 'PARTIALLY_ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Table({
  tableName: 'delivery_challans',
  timestamps: true,
})
export class DeliveryChallan extends Model<
  InferAttributes<DeliveryChallan>,
  InferCreationAttributes<DeliveryChallan>
> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  // ============================================================
  // CHALLAN NUMBER
  // ============================================================

  @AllowNull(false)
  @Unique
  @Index
  @Column(DataType.STRING(50))
  declare challan_number: string;

  // ============================================================
  // PROJECT / SITE / PROCUREMENT REFERENCES
  // ============================================================

  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  declare project_id: string;

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare site_id: string | null;

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare purchase_order_id: string | null;

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare vendor_id: string | null;

  // ============================================================
  // MATERIAL REQUIREMENT
  // ============================================================

  @ForeignKey(() => MaterialRequirement)
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare material_requirement_id: string | null;

  @BelongsTo(() => MaterialRequirement, {
    foreignKey: 'material_requirement_id',
    targetKey: 'id',
    as: 'materialRequirement',
  })
  declare materialRequirement?: MaterialRequirement;

  // ============================================================
  // CHALLAN DATE
  // ============================================================

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare challan_date: string;

  // ============================================================
  // SITE
  // ============================================================

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare site_address: string | null;

  // ============================================================
  // STATUS
  // ============================================================

  @AllowNull(false)
  @Default(DeliveryChallanStatus.DRAFT)
  @Index
  @Column(DataType.ENUM(...Object.values(DeliveryChallanStatus)))
  declare status: CreationOptional<DeliveryChallanStatus>;

  // ============================================================
  // MATERIAL / GATE CHECKS
  // ============================================================

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare gate_pass_received: CreationOptional<boolean>;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare material_checked: CreationOptional<boolean>;

  // ============================================================
  // REMARKS
  // ============================================================

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare general_remarks: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare discrepancy_notes: string | null;

  // ============================================================
  // DISPATCH
  // ============================================================

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare dispatched_by: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare dispatched_at: Date | null;

  // ============================================================
  // RECEIVING
  // ============================================================

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare received_by: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare received_at: Date | null;

  // ============================================================
  // ATTACHMENT
  // ============================================================

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare attachment_url: string | null;

  // ============================================================
  // AUDIT
  // ============================================================

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare created_by: string | null;

  // ============================================================
  // TIMESTAMPS
  // ============================================================

  @CreatedAt
  @Column({
    field: 'createdAt',
    type: DataType.DATE,
  })
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column({
    field: 'updatedAt',
    type: DataType.DATE,
  })
  declare updatedAt: CreationOptional<Date>;

  // ============================================================
  // RELATIONS
  // ============================================================

  @HasMany(() => DeliveryChallanItem)
  declare items?: DeliveryChallanItem[];
}
