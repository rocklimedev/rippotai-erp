import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
} from 'sequelize-typescript';
import { Document } from './document.model';

@Table({
  tableName: 'document_attachments',
  timestamps: true,
  underscored: true,
})
export class DocumentAttachment extends Model<DocumentAttachment> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Document)
  @AllowNull(false)
  @Column({ type: DataType.UUID, field: 'document_id' })
  declare documentId: string;

  @BelongsTo(() => Document)
  declare document: Document;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare filename: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING, field: 'storage_filename' })
  declare storageFilename: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare url: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare mime: string | null;

  @AllowNull(true)
  @Column(DataType.BIGINT)
  declare size: number | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare remark: string | null;
}
