import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { Project } from './project.model';
import { Deliverable } from './deliverable.model';

/**
 * Per-project fulfilment status of a library deliverable. Joining this against
 * Deliverable + Step + Phase produces the live document register for a project.
 */
@Table({
  tableName: 'wf_project_deliverable_records',
  timestamps: true,
  indexes: [{ unique: true, fields: ['projectId', 'deliverableId'] }],
})
export class ProjectDeliverableRecord extends Model<ProjectDeliverableRecord> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  projectId: number;

  @BelongsTo(() => Project)
  project: Project;

  @ForeignKey(() => Deliverable)
  @Column({ type: DataType.INTEGER, allowNull: false })
  deliverableId: number;

  @BelongsTo(() => Deliverable)
  deliverable: Deliverable;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  isSubmitted: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  submittedAt: Date | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  fileUrl: string | null; // pointer to the stored file (S3 key, doc-store id, etc.)

  @Column({ type: DataType.STRING(150), allowNull: true })
  submittedBy: string | null;

  @Column({ type: DataType.STRING(20), allowNull: true })
  version: string | null;
}
