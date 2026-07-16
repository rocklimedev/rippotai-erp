import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { SiteLayoutAttachment } from './site-layout-attachment.model';
import { Document } from '@/modules/documents/models/document.model';
import { User } from '@/modules/users/models/user.model';

@Table({
  tableName: 'site_image_attachment',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class SiteImageAttachment extends Model<SiteImageAttachment> {
  // =====================================================
  // PRIMARY KEY
  // =====================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  // =====================================================
  // FOREIGN KEYS
  // =====================================================

  @ForeignKey(() => SiteLayoutAttachment)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare site_layout_attachment_id: string;

  @ForeignKey(() => Document)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare document_id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare created_by?: string;

  // =====================================================
  // DATA FIELDS
  // =====================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare caption?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare sort_order: number;

  // =====================================================
  // RELATIONSHIPS
  // =====================================================

  @BelongsTo(() => SiteLayoutAttachment, 'site_layout_attachment_id')
  declare layoutAttachment: SiteLayoutAttachment;

  @BelongsTo(() => Document, 'document_id')
  declare document: Document;

  @BelongsTo(() => User, 'created_by')
  declare creator?: User;
}
