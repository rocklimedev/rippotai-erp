import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import { Project } from '@/modules/projects/models/projects.model';
import { Unit } from '@/modules/metas/models/unit.model';
import { SiteInventoryTransaction } from './site-inventory-transaction.model';

@Table({
  tableName: 'site_inventory_items',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'material_name'],
    },
  ],
})
export class SiteInventoryItem extends Model<
  InferAttributes<SiteInventoryItem>,
  InferCreationAttributes<SiteInventoryItem>
> {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: CreationOptional<string>;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    field: 'project_id',
  })
  declare projectId: string;

  @BelongsTo(() => Project, 'projectId')
  declare project?: NonAttribute<Project>;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'material_name',
  })
  declare materialName: string;

  @ForeignKey(() => Unit)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'unit_id',
  })
  declare unitId: string | null;

  @BelongsTo(() => Unit, 'unitId')
  declare unit?: NonAttribute<Unit>;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(15, 3),
    allowNull: false,
  })
  declare quantityOnHand: CreationOptional<number>;

  @Column({
    type: DataType.DECIMAL(15, 3),
    allowNull: true,
    field: 'reorder_level',
  })
  declare reorderLevel: number | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'location_on_site',
  })
  declare locationOnSite: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  @HasMany(() => SiteInventoryTransaction, 'siteInventoryItemId')
  declare transactions?: NonAttribute<SiteInventoryTransaction[]>;
}
