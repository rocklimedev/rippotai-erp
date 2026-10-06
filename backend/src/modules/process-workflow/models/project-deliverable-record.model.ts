import {
  Table,
  Column,
  Model,
  PrimaryKey,
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
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare projectId: string;

  @BelongsTo(() => Project)
  declare project: Project;

  @ForeignKey(() => Deliverable)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare deliverableId: string;

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
