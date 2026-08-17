import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { Project } from '../../process-workflow/models/project.model';
import { Step } from '../../process-workflow/models/step.model';
import { MockupStatus } from '../../../common/enums/site-operations.enums';

/**
 * A full-size mockup of a finish (tile pattern, paint, cladding panel, etc.)
 * that must be proposed, reviewed, and approved before that finish is rolled
 * out at volume across the site.
 */
@Table({ tableName: 'so_mockups', timestamps: true })
export class Mockup extends Model<Mockup> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  projectId: number;

  @BelongsTo(() => Project)
  project: Project;

  @ForeignKey(() => Step)
  @Column({ type: DataType.INTEGER, allowNull: true })
  stepId: number | null; // related process step, if applicable

  @BelongsTo(() => Step)
  step: Step;

  @Column({ type: DataType.STRING(200), allowNull: false })
  name: string; // e.g. "Living room flooring mockup - Option B"

  @Column({ type: DataType.STRING(150), allowNull: true })
  finishType: string; // e.g. "Flooring", "Paint", "False ceiling panel"

  @Column({ type: DataType.STRING(200), allowNull: true })
  location: string; // physical location on site where the mockup was built

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ type: DataType.JSON, allowNull: true })
  referenceImageUrls: string[] | null;

  @Column({ type: DataType.STRING(150), allowNull: false })
  proposedBy: string;

  @Column({ type: DataType.DATE, allowNull: false })
  proposedAt: Date;

  @Default(MockupStatus.PROPOSED)
  @Column({
    type: DataType.ENUM(...Object.values(MockupStatus)),
    allowNull: false,
  })
  status: MockupStatus;

  @Column({ type: DataType.STRING(150), allowNull: true })
  reviewedBy: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  reviewedAt: Date | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  reviewNotes: string | null;

  /** True once this finish has been cleared to roll out at volume across the site. */
  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  clearedForRollout: boolean;
}
