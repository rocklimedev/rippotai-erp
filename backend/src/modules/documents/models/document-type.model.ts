import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';

import { DocumentRequirement } from './document-requirement.model';
import { Document } from './document.model';
import { Drawing } from './drawing.model';

export type DocumentTargetType = 'DOCUMENT' | 'DRAWING';
export type DocumentRequirementType = 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL';

@Table({
  tableName: 'document_types',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class DocumentType extends Model<DocumentType> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(100),
    unique: true,
    allowNull: false,
  })
  declare code: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare phaseCode: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare phaseName: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare sectionCode: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare sectionName: string | null;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sequence: number;

  @Default('DOCUMENT')
  @Column({
    type: DataType.STRING(30),
    allowNull: false,
  })
  declare targetType: DocumentTargetType;

  @Default('REQUIRED')
  @Column({
    type: DataType.STRING(30),
    allowNull: false,
  })
  declare requirementType: DocumentRequirementType;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare allowsMultiple: boolean;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare requiresRevision: boolean;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare requiresApproval: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isActive: boolean;

  @HasMany(() => DocumentRequirement)
  declare requirements: DocumentRequirement[];

  @HasMany(() => Document)
  declare documents: Document[];

  @HasMany(() => Drawing)
  declare drawings: Drawing[];
}
