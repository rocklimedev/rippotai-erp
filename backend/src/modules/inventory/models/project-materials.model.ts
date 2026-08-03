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

import { Project } from '../../projects/models/projects.model';
import { InventoryMaster } from './inventory-master.model';
import { Unit } from '@/modules/metas/models/unit.model';
import { Brand } from './brand.model';

@Table({
  tableName: 'project_materials',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ProjectMaterial extends Model {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare item_name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare category: string | null;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_id: string;

  @BelongsTo(() => Project)
  declare project: Project;

  @ForeignKey(() => InventoryMaster)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare inventory_master_id: string | null;

  @BelongsTo(() => InventoryMaster)
  declare inventoryMaster?: InventoryMaster;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare item_code: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare specification: string | null;

  @ForeignKey(() => Unit)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare unit_id: string | null;

  @BelongsTo(() => Unit)
  declare unit?: Unit;

  @ForeignKey(() => Brand)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare brand_id: string | null;

  @BelongsTo(() => Brand)
  declare brand?: Brand;

  @Default(0.0)
  @Column({
    type: DataType.DECIMAL(14, 3),
    allowNull: true,
  })
  declare quantity_estimated: number;

  @Default(0.0)
  @Column({
    type: DataType.DECIMAL(14, 3),
    allowNull: true,
  })
  declare quantity_required: number;

  @Default(0.0)
  @Column({
    type: DataType.DECIMAL(14, 3),
    allowNull: true,
  })
  declare quantity_received: number;

  @Default(0.0)
  @Column({
    type: DataType.DECIMAL(14, 3),
    allowNull: true,
  })
  declare quantity_used: number;

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: true,
  })
  declare rate: number | null;

  @Default(18.0)
  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  declare gst_percent: number;

  @Default('planned')
  @Column({
    type: DataType.ENUM('planned', 'ordered', 'received', 'in_use', 'closed'),
    allowNull: true,
  })
  declare status: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  @Column({ type: DataType.DATE })
  declare created_at: Date;

  @Column({ type: DataType.DATE })
  declare updated_at: Date;
}
