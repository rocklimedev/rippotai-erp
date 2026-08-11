import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  PrimaryKey,
} from 'sequelize-typescript';

import { Estimate } from './estimate.model';
import { Unit } from '@/modules/metas/models/unit.model';

@Table({
  tableName: 'estimate_items',
  timestamps: false,
  underscored: true,
  charset: 'utf8',
  collate: 'utf8_unicode_ci',
})
export class EstimateItem extends Model<EstimateItem> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Estimate)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'estimate_id',
  })
  declare estimateId: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare particular: string;

  @ForeignKey(() => Unit)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'unit_id',
  })
  declare unitId: string | null;

  @Column({
    type: DataType.DECIMAL(15, 3),
    allowNull: false,
    defaultValue: 0,
  })
  declare quantity: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare rate: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare amount: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order',
  })
  declare sortOrder: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  declare createdAt: Date;

  @BelongsTo(() => Estimate, 'estimateId')
  declare estimate: Estimate;

  @BelongsTo(() => Unit, 'unitId')
  declare unit: Unit;
}
