import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { Step } from './step.model';
import { ProjectDeliverableRecord } from './project-deliverable-record.model';

/**
 * The named deliverable(s) expected from a step (library-level definition).
 * Per-project fulfilment is tracked in ProjectDeliverableRecord, and together
 * they generate the live document register for a project.
 */
@Table({ tableName: 'deliverables', timestamps: true })
export class Deliverable extends Model<Deliverable> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare id: string;

  @ForeignKey(() => Step)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  stepId: string;

  @BelongsTo(() => Step)
  step: Step;

  @Column({ type: DataType.STRING(200), allowNull: false })
  name: string; // e.g. "Concept Design Presentation", "BOQ - Civil"

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  isRequired: boolean;

  @Column({ type: DataType.STRING(60), allowNull: true })
  fileType: string; // e.g. 'PDF', 'DWG', 'XLSX' — expected format, informational

  @HasMany(() => ProjectDeliverableRecord, { onDelete: 'CASCADE' })
  records: ProjectDeliverableRecord[];
}
