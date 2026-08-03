import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { InventoryRequest } from './inventory-request.model';

@Table({
  tableName: 'inventory_dispatches',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // only created_at
})
export class InventoryDispatch extends Model {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => InventoryRequest)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare request_id: string;

  @BelongsTo(() => InventoryRequest)
  declare request: InventoryRequest;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare dispatch_date: Date | null;

  @Column({
    type: DataType.DECIMAL(12, 3),
    allowNull: false,
  })
  declare dispatch_quantity: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare vehicle_challan: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare driver_name: string | null;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  declare received_quantity: number | null;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  declare damage_shortage: boolean;

  @Column({
    type: DataType.DECIMAL(12, 3),
    allowNull: true,
  })
  declare shortage_quantity: number | null;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  declare supervisor_confirmation: boolean;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  declare delivery_photo_url: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @Column({ type: DataType.DATE })
  declare created_at: Date;
}
