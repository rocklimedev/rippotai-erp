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
import { Document } from './document.model';

@Table({
  tableName: 'document_attachments',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class DocumentAttachment extends Model<DocumentAttachment> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Document)
  @Column({ type: DataType.UUID, allowNull: false })
  declare documentId: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare filename: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare storageFilename: string | null;

  @Column({ type: DataType.STRING(1000), allowNull: true })
  declare url: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare mime: string | null;

  @Column({ type: DataType.BIGINT, allowNull: true })
  declare size: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remark: string | null;

  @BelongsTo(() => Document)
  declare document: Document;
}
