import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  IsUUID,
} from 'sequelize-typescript';

import { SiteRecce } from './site-recce.model';
import { SiteRecceRoom } from './site-recce-room.model';

@Table({
  tableName: 'site_recce_photos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class SiteReccePhoto extends Model<SiteReccePhoto> {
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
  // ROOM
  // ============================================================

  @ForeignKey(() => SiteRecceRoom)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare room_id: string;

  @BelongsTo(() => SiteRecceRoom, {
    foreignKey: 'room_id',
    as: 'room',
  })
  declare room: SiteRecceRoom;

  // ============================================================
  // SHOT
  // ============================================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare shot_number: number;

  // ============================================================
  // LAYOUT IMAGE
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare layout_image_url: string | null;

  // ============================================================
  // ACTUAL PHOTO
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare photo_url: string | null;

  // ============================================================
  // FILE NAMES
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare layout_file_name: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare photo_file_name: string | null;

  // ============================================================
  // CAMERA / SHOT METADATA
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare standing_position: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare camera_direction: string | null;

  // ============================================================
  // NOTES
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;
}
