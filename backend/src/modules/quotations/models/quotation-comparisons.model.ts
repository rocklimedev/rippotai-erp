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
import { Project } from '@/modules/projects/models/projects.model';

@Table({
  tableName: 'quotation_comparisons',
  timestamps: true,
  paranoid: false,
})
export class QuotationComparison extends Model<QuotationComparison> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @ForeignKey(() => Project)
  @Column(DataType.UUID)
  declare projectId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare workCategory: string | null;

  @Column({
    type: DataType.ARRAY(DataType.UUID),
    allowNull: false,
  })
  declare quotationIds: string[];

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare comparedAt: Date;
}
