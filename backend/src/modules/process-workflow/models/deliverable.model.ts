import {
  Table,
  Column,
  Model,
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
  @ForeignKey(() => Step)
  @Column({ type: DataType.INTEGER, allowNull: false })
  stepId: number;

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
