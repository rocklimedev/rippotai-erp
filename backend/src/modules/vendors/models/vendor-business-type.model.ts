import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { VendorCategory } from './vendor-category.model';
import { Vendor } from './vendors.model';

export type VendorBusinessTypeCreationAttributes = {
  id?: string;
  category_id: string;
  name: string;
  status?: boolean;
};

@Table({
  tableName: 'vendor_business_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class VendorBusinessType extends Model<
  VendorBusinessType,
  VendorBusinessTypeCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @ForeignKey(() => VendorCategory)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare category_id: string;

  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  declare name: string;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare status: boolean;

  @BelongsTo(() => VendorCategory)
  declare category: VendorCategory;

  @HasMany(() => Vendor)
  declare vendors: Vendor[];
}
