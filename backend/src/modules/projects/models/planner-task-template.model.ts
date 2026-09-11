// src/modules/project-planner/models/planner-task-template.model.ts

import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  IsUUID,
} from 'sequelize-typescript';

import { ProjectPhase } from './project-phase.model';
import { DocumentType } from '@/modules/documents/models/document-type.model';

@Table({
  tableName: 'planner_task_templates',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',

  indexes: [
    {
      fields: ['phase_id'],
    },
    {
      fields: ['document_type_id'],
    },
    {
      fields: ['phase_id', 'sort_order'],
    },
  ],
})
export class PlannerTaskTemplate extends Model<PlannerTaskTemplate> {
  // ===================== Primary Key =====================

  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ===================== Phase =====================

  /**
   * Links this task to the master ProjectPhase.
   *
   * Examples:
   *
   * CONSULTANCY:
   * - PRE-DESIGN
   * - DESIGN
   * - MATERIAL SELECTION
   * - TENDER DRAWINGS
   * - WORKING DRAWINGS
   *
   * PMC:
   * - SITE PREPARATION
   * - CIVIL WORK
   * - FIT OUTS
   * - FINISHING
   * - SNAG & HANDOVER
   */
  @ForeignKey(() => ProjectPhase)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare phase_id: string;

  // ===================== Task =====================

  /**
   * Main work/task name.
   *
   * Consultancy examples:
   * - EXISTING LAYOUT
   * - PROPOSED LAYOUT
   * - CONCEPT DESIGN 01-3D
   * - ELECTRICAL LAYOUT
   *
   * PMC examples:
   * - DEMOLITION
   * - FOUNDATION
   * - FLOORING
   * - FALSE CEILING
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare work_name: string;

  /**
   * Optional second-level details.
   *
   * Examples:
   * - LAYOUT FINALISATION
   * - WITH MATERIAL
   * - CONCRETE & RCC
   * - LIGHT INSTALLATION
   * - SWITCH BOARDS
   */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare details: string | null;

  // ===================== Document Link =====================

  /**
   * Optional linkage with your existing DocumentType master.
   *
   * Example:
   *
   * work_name = ELECTRICAL LAYOUT
   * document_type_id = ELECTRICAL_LAYOUT document type
   *
   * This allows the planner task and actual document workflow
   * to remain connected without duplicating DocumentType.
   */
  @ForeignKey(() => DocumentType)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare document_type_id: string | null;

  // ===================== Behaviour =====================

  /**
   * Whether this planner task should automatically be
   * assigned to all project floors/locations when the
   * planner is generated.
   *
   * Example:
   *
   * FLOORING -> true
   * SITE CLEARING -> false
   */
  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare applies_to_locations: boolean;

  /**
   * Whether this task is mandatory in a standard project.
   */
  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare is_required: boolean;

  /**
   * Allows disabling an old master task without deleting
   * historical references.
   */
  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare is_active: boolean;

  // ===================== Ordering =====================

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sort_order: number;

  // ===================== Notes =====================

  /**
   * Internal/default instruction.
   *
   * Example:
   * "Applicable only where false ceiling is proposed."
   */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare default_remarks: string | null;

  // ===================== Soft Delete =====================

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare deleted_at: Date | null;

  // ===================== Associations =====================

  @BelongsTo(() => ProjectPhase, {
    foreignKey: 'phase_id',
    as: 'phase',
  })
  declare phase: ProjectPhase;

  @BelongsTo(() => DocumentType, {
    foreignKey: 'document_type_id',
    as: 'document_type',
  })
  declare document_type: DocumentType | null;
}
