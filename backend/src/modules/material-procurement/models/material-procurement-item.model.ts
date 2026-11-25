import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';

import { MaterialProcurement } from './material-procurement.model';
import { MaterialMaster } from './material-master.model';

export interface MaterialProcurementItemCreationAttributes {
  procurementId: string;
  materialId: string;
  serialNo: number;
  brand?: string | null;

  area?: string | null;
  location?: string | null;
  sheetName?: string | null;
  customValues?: string[] | null;

  wallArea?: number | null;
  floorArea?: number | null;
  ceilingArea?: number | null;
  totalArea?: number | null;
  isTotalAreaManual?: boolean | null;

  quantity?: number;
  price?: number;
  amount?: number;
}

@Table({
  tableName: 'material_procurement_items',
  timestamps: true,
  underscored: true,
})
export class MaterialProcurementItem extends Model<
  MaterialProcurementItem,
  MaterialProcurementItemCreationAttributes
> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  // ============================================================
  // PROCUREMENT
  // ============================================================

  @Index
  @ForeignKey(() => MaterialProcurement)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare procurementId: string;

  @BelongsTo(() => MaterialProcurement, {
    foreignKey: 'procurementId',
    targetKey: 'id',
    as: 'procurement',
  })
  declare procurement: MaterialProcurement;

  // ============================================================
  // MATERIAL MASTER
  // ============================================================

  @Index
  @ForeignKey(() => MaterialMaster)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare materialId: string;

  @BelongsTo(() => MaterialMaster, {
    foreignKey: 'materialId',
    targetKey: 'id',
    as: 'materialMaster',
  })
  declare materialMaster: MaterialMaster;

  // ============================================================
  // SERIAL NUMBER
  // ============================================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare serialNo: number;

  @Column({
    type: DataType.STRING(150),
    allowNull: true,
  })
  declare brand: string | null;

  // ============================================================
  // LOCATION / AREA
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare area: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare location: string | null;

  // Material-type sheet this row belongs to (e.g. "Flooring & Stone").
  @Column({
    type: DataType.STRING(120),
    allowNull: true,
  })
  declare sheetName: string | null;

  @Column({ type: DataType.JSON, allowNull: true })
  declare customValues: string[] | null;

  // ============================================================
  // AREA MEASUREMENTS
  // ============================================================

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  declare wallArea: number | null;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  declare floorArea: number | null;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  declare ceilingArea: number | null;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  declare totalArea: number | null;

  @Column({ type: DataType.BOOLEAN, allowNull: true })
  declare isTotalAreaManual: boolean | null;

  // ============================================================
  // QUANTITY / PRICE
  // ============================================================

  @Column({
    type: DataType.DECIMAL(14, 3),
    allowNull: false,
    defaultValue: 0,
  })
  declare quantity: number;

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare price: number;

  @Column({
    type: DataType.DECIMAL(16, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare amount: number;
}
