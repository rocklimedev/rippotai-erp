import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { SiteRecceFloor } from './site-recce-floor.model'; // or .entity if that's your file

@Table({
  tableName: 'site_recce_room',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class SiteRecceRoom extends Model<SiteRecceRoom> {
  @PrimaryKey
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @ForeignKey(() => SiteRecceFloor)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare floor_id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare room_name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare room_type?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare ceiling_height?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare beam_column_details?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare length?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare width?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare height?: number;

  @Column({
    type: DataType.STRING(20),
    defaultValue: 'ft',
  })
  declare unit: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks?: string;

  @BelongsTo(() => SiteRecceFloor)
  declare floor: SiteRecceFloor;
}
