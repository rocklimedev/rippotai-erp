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
import { Document } from './document.model';
import { Drawing } from './drawing.model';
import type { DocumentRequirementType } from './document-type.model';

@Table({
  tableName: 'document_requirements',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'document_type_id'],
    },
  ],
})
export class DocumentRequirement extends Model<DocumentRequirement> {
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
    allowNull: false,
  })
  declare documentTypeId: string;

  @Default('REQUIRED')
  @Column({
    type: DataType.STRING(30),
    allowNull: false,
  })
  declare requirementType: DocumentRequirementType;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isEnabled: boolean;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isCompleted: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare completedAt: Date | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @BelongsTo(() => DocumentType)
  declare documentType: DocumentType;

  @HasMany(() => Document)
  declare documents: Document[];

  @HasMany(() => Drawing)
  declare drawings: Drawing[];
}
