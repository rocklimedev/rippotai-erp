import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';

import { DocumentRequirement } from './document-requirement.model';
import { Document } from './document.model';
import { Drawing } from './drawing.model';
import { ProjectPhase } from '@/modules/projects/models/project-phase.model';

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
  // ===================== Primary Key =====================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  // ===================== Identity =====================

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

  // ===================== Project Phase =====================

  /**
   * Authoritative relationship to the DOCUMENTS project phase.
   *
   * phaseCode / phaseName are retained temporarily for backward
   * compatibility and should eventually be removed from application usage.
   */
  @ForeignKey(() => ProjectPhase)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare projectPhaseId: string | null;

  @BelongsTo(() => ProjectPhase, {
    foreignKey: 'projectPhaseId',
    targetKey: 'id',
  })
  declare projectPhase: ProjectPhase | null;

  // ===================== Legacy Phase Fields =====================

  /**
   * Legacy phase code.
   *
   * Prefer projectPhaseId for all new application logic.
   */
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare phaseCode: string;

  /**
   * Legacy phase name.
   *
   * Prefer projectPhase.title through projectPhaseId.
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare phaseName: string;

  // ===================== Section =====================

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

  // ===================== Ordering =====================

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sequence: number;

  // ===================== Configuration =====================

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

  // ===================== Description =====================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  // ===================== Status =====================

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isActive: boolean;

  // ===================== Relations =====================

  @HasMany(() => DocumentRequirement)
  declare requirements: DocumentRequirement[];

  @HasMany(() => Document)
  declare documents: Document[];

  @HasMany(() => Drawing)
  declare drawings: Drawing[];
}
