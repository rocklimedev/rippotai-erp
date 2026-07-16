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

import { SiteRecce } from './site-recce.model';
import { SiteRecceFloor } from './site-recce-floor.model';
import { SiteImageAttachment } from './site-image-attachment.model';
import { Document } from '@/modules/documents/models/document.model';
import { User } from '@/modules/users/models/user.model';

@Table({
  tableName: 'site_layout_attachment',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class SiteLayoutAttachment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
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

  @ForeignKey(() => SiteRecceFloor)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare floor_id?: string;

  @ForeignKey(() => Document)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare document_id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare title?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark?: string;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sort_order: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by?: string;

  @BelongsTo(() => SiteRecce)
  declare siteRecce: SiteRecce;

  @BelongsTo(() => SiteRecceFloor)
  declare floor?: SiteRecceFloor;

  @BelongsTo(() => Document)
  declare document: Document;

  @BelongsTo(() => User)
  declare creator?: User;

  @HasMany(() => SiteImageAttachment)
  declare images: SiteImageAttachment[];
}
