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
  IsUUID,
} from 'sequelize-typescript';

import { SiteRecce } from './site-recce.model';
import { SiteReccePhoto } from './site-recce-photo.model';

@Table({
  tableName: 'site_recce_rooms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class SiteRecceRoom extends Model<SiteRecceRoom> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ============================================================
  // SITE RECCE
  // ============================================================

  @ForeignKey(() => SiteRecce)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare site_recce_id: string;

  @BelongsTo(() => SiteRecce, {
    foreignKey: 'site_recce_id',
    as: 'site_recce',
  })
  declare site_recce: SiteRecce;

  // ============================================================
  // ROOM INFORMATION
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare room_name: string;

  @Column({
    type: DataType.ENUM(
      'LIVING_DINING',
      'MASTER_BEDROOM',
      'BEDROOM',
      'KITCHEN',
      'BATHROOM',
      'BALCONY',
      'OTHER',
    ),
    allowNull: false,
    defaultValue: 'OTHER',
  })
  declare room_type:
    | 'LIVING_DINING'
    | 'MASTER_BEDROOM'
    | 'BEDROOM'
    | 'KITCHEN'
    | 'BATHROOM'
    | 'BALCONY'
    | 'OTHER';

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare room_number: number | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare room_type_other: string | null;

  // ============================================================
  // MEASUREMENTS
  // ============================================================

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare length: number | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare width: number | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare height: number | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare area: number | null;

  @Column({
    type: DataType.ENUM('FT', 'M', 'IN', 'CM'),
    allowNull: false,
    defaultValue: 'FT',
  })
  declare measurement_unit: 'FT' | 'M' | 'IN' | 'CM';

  // ============================================================
  // EXISTING CONDITION
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare existing_flooring: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare existing_ceiling: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  // ============================================================
  // ORDERING
  // ============================================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare sort_order: number;

  // ============================================================
  // PHOTOS / SHOTS
  // ============================================================

  @HasMany(() => SiteReccePhoto, {
    foreignKey: 'room_id',
    as: 'photos',
  })
  declare photos: SiteReccePhoto[];
}
