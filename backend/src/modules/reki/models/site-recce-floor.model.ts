import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';

import { SiteRecce } from './site-recce.model';
import { SiteRecceRoom } from './site-recce-room.model';

@Table({
  tableName: 'site_recce_floor',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class SiteRecceFloor extends Model<SiteRecceFloor> {
  @PrimaryKey
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @ForeignKey(() => SiteRecce)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare site_recce_id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare floor_name: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare floor_order: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  declare approx_area_sqft?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks?: string;

  @BelongsTo(() => SiteRecce)
  declare siteRecce: SiteRecce;

  @HasMany(() => SiteRecceRoom)
  declare rooms: SiteRecceRoom[];
}
