import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
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
import { Vendor } from '@/modules/vendors/models/vendors.model';

@Table({
  tableName: 'material_rate_sheets',
  timestamps: true,
  underscored: true,
})
export class MaterialRateSheet extends Model<
  InferAttributes<MaterialRateSheet>,
  InferCreationAttributes<MaterialRateSheet>
> {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: CreationOptional<string>;

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'vendor_id',
  })
  declare vendorId: string | null;

  @BelongsTo(() => Vendor, 'vendorId')
  declare vendor?: NonAttribute<Vendor>;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'project_id',
  })
  declare projectId: string | null;

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
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  declare rate: CreationOptional<number>;

  @Column({
    type: DataType.STRING(150),
    allowNull: true,
  })
  declare availability: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'valid_until',
  })
  declare validUntil: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}
