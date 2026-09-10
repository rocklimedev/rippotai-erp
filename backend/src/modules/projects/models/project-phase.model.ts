import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  IsUUID,
  HasMany,
} from 'sequelize-typescript';
import { ProjectPhaseModule } from '@/common/enums/project-planner.enum';
import { ProjectPlannerTask } from './project-planner-task.model';
import { PlannerTaskTemplate } from './planner-task-template.model';

@Table({
  tableName: 'project_phases',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    { unique: true, fields: ['module', 'phase_code'] },
    { unique: true, fields: ['module', 'phase_number'] },
  ],
})
export class ProjectPhase extends Model<ProjectPhase> {
  // ===================== Primary Key =====================

  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  // ===================== Scope =====================

  /**
   * CONSULTANCY, PMC, or DOCUMENTS. See enum doc-comment — this is what
   * lets the same table serve three independent phase vocabularies
   * instead of one shared (and therefore wrong) sequence.
   */
  @Column({
    type: DataType.ENUM(...Object.values(ProjectPhaseModule)),
    allowNull: false,
  })
  declare module: ProjectPhaseModule;

  // ===================== Phase =====================

  /** Phase number, unique per module. Used for the P1, P2, P3... sequence. */
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare phase_number: number;

  /** Explicit phase code printed on documents, e.g. P1, P2, P3. Unique per module. */
  @Column({ type: DataType.STRING(20), allowNull: false })
  declare phase_code: string;

  /** Reusable/master phase title, e.g. "MEP & Waterproofing", "SITE PREPARATION". */
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  // ===================== Ordering =====================

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare sort_order: number;

  // ===================== Soft Delete =====================

  @Column({ type: DataType.DATE, allowNull: true })
  declare deleted_at: Date | null;

  // ===================== Associations =====================

  @HasMany(() => ProjectPlannerTask, { foreignKey: 'phase_id' })
  declare tasks: ProjectPlannerTask[];

  @HasMany(() => PlannerTaskTemplate, { foreignKey: 'phase_id' })
  declare templates: PlannerTaskTemplate[];
}
