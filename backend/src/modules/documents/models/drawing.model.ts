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

import { DocumentType } from '../../documents/models/document-type.model';
import { DocumentRequirement } from '../../documents/models/document-requirement.model';
import { DrawingRevision } from './drawing-revision.model';

export type DrawingStatus =
  | 'Draft'
  | 'For Review'
  | 'Approved'
  | 'Rejected'
  | 'Superseded';

@Table({
  tableName: 'drawings',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'drawing_number'],
    },
  ],
})
export class Drawing extends Model<Drawing> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare projectId: string;

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
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare drawingNumber: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare phaseCode: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare discipline: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare sheetNumber: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare scale: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare issuePurpose: string | null;

  @Default('Draft')
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare status: DrawingStatus | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare sequence: number | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare drawnBy: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare checkedBy: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare approvedBy: string | null;

  @BelongsTo(() => DocumentType)
  declare documentType: DocumentType;

  @BelongsTo(() => DocumentRequirement)
  declare requirement: DocumentRequirement;

  @HasMany(() => DrawingRevision)
  declare revisions: DrawingRevision[];
}
