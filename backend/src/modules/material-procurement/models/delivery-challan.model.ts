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
} from 'sequelize-typescript';

import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import { DeliveryChallanItem } from './delivery-challan-item.model';

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
  // CHALLAN IDENTIFICATION
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
  // CHALLAN DATE
  // ============================================================

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare challan_date: string;

  // ============================================================
  // DELIVERY LOCATION
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
  // RECEIVING / VERIFICATION
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
  // REMARKS / DISCREPANCIES
  // ============================================================

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare general_remarks: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare discrepancy_notes: string | null;

  // ============================================================
  // DISPATCH INFORMATION
  // ============================================================

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare dispatched_by: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare dispatched_at: Date | null;

  // ============================================================
  // RECEIVING INFORMATION
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
  // RELATIONS
  // ============================================================

  @HasMany(() => DeliveryChallanItem)
  declare items?: DeliveryChallanItem[];
}
