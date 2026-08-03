import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';

import { InventoryCategory } from './inventory-category.model';
import { Unit } from '@/modules/metas/models/unit.model';
import { Brand } from './brand.model';

@Table({
  tableName: 'inventory_master',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class InventoryMaster extends Model {
  @PrimaryKey
  @Column({
    type: DataType.CHAR(36),
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare item_code: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare item_name: string;

  @ForeignKey(() => InventoryCategory)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare category_id: string | null;

  @BelongsTo(() => InventoryCategory)
  declare category?: InventoryCategory;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @ForeignKey(() => Unit)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare unit_id: string | null;

  @BelongsTo(() => Unit)
  declare unit?: Unit;

  @Default(0.0)
  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: true,
  })
  declare default_rate: number;

  @Default(18.0)
  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  declare gst_percent: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare hsn_code: string | null;

  @Default(0.0)
  @Column({
    type: DataType.DECIMAL(12, 3),
    allowNull: true,
  })
  declare min_stock_level: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare specification: string | null;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  declare is_active: boolean;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  declare is_serialized: boolean;

  @Column({ type: DataType.DATE })
  declare created_at: Date;

  @Column({ type: DataType.DATE })
  declare updated_at: Date;

  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare updated_by: string | null;

  @ForeignKey(() => Brand)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare brand_id: string | null;

  @BelongsTo(() => Brand)
  declare brand?: Brand;
}
