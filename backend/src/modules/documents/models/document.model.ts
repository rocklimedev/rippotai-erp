import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  AllowNull,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { DocumentAttachment } from './document-attachment.model';

export type DocumentCategory =
  | 'Agreements'
  | 'Pitch'
  | 'Scope of Work'
  | 'Time and Cost'
  | 'Project Brief'
  | 'Site Reki'
  | 'BOQs'
  | 'Quotations'
  | 'Drawings'
  | 'GFC Drawings'
  | '3D Views'
  | 'Approvals'
  | 'Other'
  | 'Handover Documents';

export type DocumentVisibility = 'internal' | 'client';
export type DocumentStatus = 'draft' | 'in_review' | 'approved' | 'archived';
export type DocumentType = 'upload' | 'project_brief' | 'site_reki';

@Table({ tableName: 'documents', timestamps: true, underscored: true })
export class Document extends Model<Document> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Project)
  @AllowNull(true)
  @Column({ type: DataType.UUID, field: 'project_id' })
  declare projectId: string | null;

  @BelongsTo(() => Project)
  declare project: Project;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare category: DocumentCategory;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare filename: string | null;

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

  @Default('V1')
  @Column(DataType.STRING)
  declare version: string;

  @Default('draft')
  @Column(DataType.STRING)
  declare status: DocumentStatus;

  @Default('internal')
  @Column(DataType.STRING)
  declare visibility: DocumentVisibility;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare remarks: string | null;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'is_locked' })
  declare isLocked: boolean;

  @AllowNull(true)
  @Column({ type: DataType.STRING, field: 'locked_by' })
  declare lockedBy: string | null;

  @AllowNull(true)
  @Column({ type: DataType.DATE, field: 'locked_at' })
  declare lockedAt: Date | null;

  @AllowNull(true)
  @Column({ type: DataType.UUID, field: 'uploaded_by' })
  declare uploadedBy: string | null;

  @AllowNull(true)
  @Column({ type: DataType.STRING, field: 'uploaded_by_name' })
  declare uploadedByName: string | null;

  @AllowNull(true)
  @Column({ type: DataType.DATEONLY, field: 'document_date' })
  declare documentDate: string | null;

  @Default('upload')
  @Column({ type: DataType.STRING, field: 'doc_type' })
  declare docType: DocumentType;

  @AllowNull(true)
  @Column({ type: DataType.STRING, field: 'doc_no' })
  declare docNo: string | null;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare sections: Record<string, Record<string, string>> | null;

  @AllowNull(true)
  @Column({ type: DataType.STRING, field: 'source_app' })
  declare sourceApp: string | null;

  @HasMany(() => DocumentAttachment, { onDelete: 'CASCADE' })
  declare attachments: DocumentAttachment[];
}
