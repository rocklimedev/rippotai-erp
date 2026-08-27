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

import { Document, DocumentStatus } from './document.model';

@Table({
  tableName: 'document_versions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['document_id', 'version'],
    },
  ],
})
export class DocumentVersion extends Model<DocumentVersion> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Document)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare documentId: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare version: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare filename: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare storageFilename: string | null;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
  })
  declare url: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare mime: string | null;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  declare size: number | null;

  @Default('draft')
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare status: DocumentStatus | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare uploadedBy: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare uploadedByName: string | null;

  @BelongsTo(() => Document)
  declare document: Document;
}
