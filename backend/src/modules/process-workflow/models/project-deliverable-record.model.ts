import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { Deliverable } from './deliverable.model';

/**
 * Per-project fulfilment status of a library deliverable. Joining this against
 * Deliverable + Step + Phase produces the live document register for a project.
 */
@Table({
  tableName: 'project_deliverable_records',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['projectId', 'deliverableId'],
    },
  ],
})
export class ProjectDeliverableRecord extends Model<ProjectDeliverableRecord> {
  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare projectId: number;

  @BelongsTo(() => Project)
  declare project: Project;

  @ForeignKey(() => Deliverable)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare deliverableId: number;

  @BelongsTo(() => Deliverable)
  declare deliverable: Deliverable;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
  })
  declare isSubmitted: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare submittedAt: Date | null;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  declare fileUrl: string | null;

  @Column({
    type: DataType.STRING(150),
    allowNull: true,
  })
  declare submittedBy: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare version: string | null;
}
