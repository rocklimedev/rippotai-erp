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
import { User } from '@/modules/users/models/user.model';

@Table({
  tableName: 'quotation_versions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class QuotationVersion extends Model<QuotationVersion> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Quotation)
  @Column({
    field: 'quotation_id',
    type: DataType.UUID,
    allowNull: false,
  })
  declare quotationId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare version: number;

  @Column({
    field: 'snapshot',
    type: DataType.JSON,
    allowNull: false,
  })
  declare snapshot: object;

  @Column({
    field: 'remarks',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @ForeignKey(() => User)
  @Column({
    field: 'created_by',
    type: DataType.UUID,
    allowNull: true,
  })
  declare createdBy: string | null;

  @BelongsTo(() => Quotation)
  declare quotation: Quotation;

  @BelongsTo(() => User, 'createdBy')
  declare creator: User;
}
