import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Boq } from './boq.model';

@Table({
  tableName: 'boq_miscellaneous',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BoqMiscellaneous extends Model<BoqMiscellaneous> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => Boq)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare boq_id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare value: number;

  @Column(DataType.TEXT)
  declare notes: string | null;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare sort_order: number;

  @BelongsTo(() => Boq, {
    foreignKey: 'boq_id',
    as: 'boq',
  })
  declare boq: Boq;
}
