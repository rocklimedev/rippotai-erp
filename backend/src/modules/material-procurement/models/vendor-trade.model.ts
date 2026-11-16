import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';

@Table({ tableName: 'vendor_trades', timestamps: true, underscored: true })
export class VendorTrade extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;
  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  declare normalized_name: string;
  @Default(1000)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare sort_order: number;
}
