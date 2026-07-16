import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { SiteRecce } from './site-recce.model';
import { Document } from '@/modules/documents/models/document.model';

@Table({
  tableName: 'site_recce_document',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class SiteRecceDocument extends Model<SiteRecceDocument> {
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

  @ForeignKey(() => Document)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare document_id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark?: string;

  @BelongsTo(() => SiteRecce)
  declare siteRecce: SiteRecce;

  @BelongsTo(() => Document)
  declare document: Document;
}
