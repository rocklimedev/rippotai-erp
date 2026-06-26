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

import { Quotation } from './quotations.model';

@Table({
  tableName: 'quotation_items',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['quotation_id', 'sno'],
      name: 'uk_quotation_sno',
    },
  ],
})
export class QuotationItem extends Model<QuotationItem> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @ForeignKey(() => Quotation)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare quotation_id: string;

  @Column({
    type: DataType.SMALLINT,
    allowNull: false,
  })
  declare sno: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare particular: string;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  declare rate: number;

  @Column({
    type: DataType.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 0.0,
  })
  declare quantity: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  declare amount: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @BelongsTo(() => Quotation)
  declare quotation: Quotation;
}
