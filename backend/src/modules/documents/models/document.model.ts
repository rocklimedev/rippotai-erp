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

import { DocumentType } from './document-type.model';
import { DocumentRequirement } from './document-requirement.model';
import { DocumentVersion } from './document-version.model';
import { DocumentAttachment } from './document-attachment.model';

export type DocumentStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export type DocumentVisibility = 'internal' | 'external' | 'public';

export type DocumentSourceType = 'upload' | 'generated' | 'system';

@Table({
  tableName: 'documents',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Document extends Model<Document> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare projectId: string | null;

  @ForeignKey(() => DocumentType)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare documentTypeId: string | null;

  @ForeignKey(() => DocumentRequirement)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare requirementId: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare category: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

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

  @Default('V1')
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare version: string | null;

  @Default('draft')
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare status: DocumentStatus | null;

  @Default('internal')
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare visibility: DocumentVisibility | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isLocked: boolean;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare lockedBy: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lockedAt: Date | null;

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

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare documentDate: string | null;

  @Default('upload')
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare docType: DocumentSourceType | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare docNo: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare sections: Record<string, unknown> | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare sourceApp: string | null;

  @BelongsTo(() => DocumentType)
  declare documentType: DocumentType;

  @BelongsTo(() => DocumentRequirement)
  declare requirement: DocumentRequirement;

  @HasMany(() => DocumentVersion)
  declare versions: DocumentVersion[];

  @HasMany(() => DocumentAttachment)
  declare attachments: DocumentAttachment[];
}
