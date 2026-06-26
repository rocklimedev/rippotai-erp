import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { VendorBusinessType } from './vendor-business-type.model';
import { Vendor } from './vendors.model';

@Table({
  tableName: 'vendor_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class VendorCategory extends Model<VendorCategory> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare status: boolean;

  @HasMany(() => VendorBusinessType)
  declare businessTypes: VendorBusinessType[];

  @HasMany(() => Vendor)
  declare vendors: Vendor[];
}
