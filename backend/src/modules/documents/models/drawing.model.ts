import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';

export type DrawingStatus = 'Draft' | 'Issued' | 'superseded';

@Table({ tableName: 'drawings', timestamps: true, underscored: true })
export class Drawing extends Model<Drawing> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Project)
  @AllowNull(false)
  @Column({ type: DataType.UUID, field: 'project_id' })
  declare projectId: string;

  @BelongsTo(() => Project)
  declare project: Project;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING, field: 'drawing_number' })
  declare drawingNumber: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare discipline: string | null;

  @Default('R1')
  @Column(DataType.STRING)
  declare revision: string;

  @AllowNull(true)
  @Column({ type: DataType.DATEONLY, field: 'issue_date' })
  declare issueDate: string | null;

  @AllowNull(true)
  @Column({ type: DataType.STRING, field: 'issue_purpose' })
  declare issuePurpose: string | null;

  @Default('Draft')
  @Column(DataType.STRING)
  declare status: DrawingStatus;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare remarks: string | null;

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

  @AllowNull(true)
  @Column({ type: DataType.UUID, field: 'uploaded_by' })
  declare uploadedBy: string | null;
}
