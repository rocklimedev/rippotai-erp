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

import { User } from '@/modules/users/models/user.model';
import { Quotation } from '@/modules/quotations/models/quotations.model';
import { VendorCategory } from './vendor-category.model';
import { VendorBusinessType } from './vendor-business-type.model';
import { VendorStatus } from '@/common/enums';

@Table({
  tableName: 'vendors',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Vendor extends Model<Vendor> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare company_name: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare position: string | null;

  @ForeignKey(() => VendorCategory)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare vendor_category_id: string | null;

  @BelongsTo(() => VendorCategory, {
    foreignKey: 'vendor_category_id',
    as: 'vendorCategory',
  })
  declare vendorCategory: VendorCategory;

  @ForeignKey(() => VendorBusinessType)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare business_type_id: string | null;

  @BelongsTo(() => VendorBusinessType, {
    foreignKey: 'business_type_id',
    as: 'businessType',
  })
  declare businessType: VendorBusinessType;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  declare contact_number: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare alternate_contact: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare address: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(VendorStatus)),
    allowNull: false,
    defaultValue: VendorStatus.ACTIVE,
  })
  declare status: VendorStatus;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare updated_by: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  @BelongsTo(() => User, {
    foreignKey: 'updated_by',
    as: 'updater',
  })
  declare updater: User;

  @HasMany(() => Quotation, {
    foreignKey: 'vendor_id',
  })
  declare quotations: Quotation[];
}
