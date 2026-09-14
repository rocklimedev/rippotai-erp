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

import { Project } from '../../projects/models/projects.model';
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
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Document extends Model<Document> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare id: string;

  // ============================================================
  // PROJECT
  // ============================================================

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'project_id',
  })
  declare projectId: string | null;

  @BelongsTo(() => Project, {
    foreignKey: 'projectId',
    as: 'project',
  })
  declare project: Project;

  // ============================================================
  // DOCUMENT TYPE
  // ============================================================

  @ForeignKey(() => DocumentType)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'document_type_id',
  })
  declare documentTypeId: string | null;

  @BelongsTo(() => DocumentType, {
    foreignKey: 'documentTypeId',
    as: 'documentType',
  })
  declare documentType: DocumentType;

  // ============================================================
  // REQUIREMENT
  // ============================================================

  @ForeignKey(() => DocumentRequirement)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'requirement_id',
  })
  declare requirementId: string | null;

  @BelongsTo(() => DocumentRequirement, {
    foreignKey: 'requirementId',
    as: 'requirement',
  })
  declare requirement: DocumentRequirement;

  // ============================================================
  // BASIC DOCUMENT INFORMATION
  // ============================================================

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
    field: 'storage_filename',
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

  // ============================================================
  // VERSION / STATUS
  // ============================================================

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

  // ============================================================
  // LOCKING
  // ============================================================

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'is_locked',
  })
  declare isLocked: boolean;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'locked_by',
  })
  declare lockedBy: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'locked_at',
  })
  declare lockedAt: Date | null;

  // ============================================================
  // UPLOAD INFORMATION
  // ============================================================

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'uploaded_by',
  })
  declare uploadedBy: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'uploaded_by_name',
  })
  declare uploadedByName: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'document_date',
  })
  declare documentDate: string | null;

  @Default('upload')
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'doc_type',
  })
  declare docType: DocumentSourceType | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'doc_no',
  })
  declare docNo: string | null;

  // ============================================================
  // EXTENDED DATA
  // ============================================================

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare sections: Record<string, unknown> | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'source_app',
  })
  declare sourceApp: string | null;

  // ============================================================
  // TIMESTAMPS
  // ============================================================

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'created_at',
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'updated_at',
  })
  declare updatedAt: Date;

  // ============================================================
  // CHILD RELATIONSHIPS
  // ============================================================

  @HasMany(() => DocumentVersion, {
    foreignKey: 'documentId',
    as: 'versions',
  })
  declare versions: DocumentVersion[];

  @HasMany(() => DocumentAttachment, {
    foreignKey: 'documentId',
    as: 'attachments',
  })
  declare attachments: DocumentAttachment[];
}
