import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  Index,
} from 'sequelize-typescript';

import { ProjectBrief } from './project-brief.model';

@Table({
  tableName: 'project_brief_references',
  timestamps: true,
  updatedAt: false,
  underscored: true,
})
export class ProjectBriefReference extends Model<ProjectBriefReference> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.CHAR(36),
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => ProjectBrief)
  @AllowNull(false)
  @Index
  @Column(DataType.CHAR(36))
  declare projectBriefId: string;

  @BelongsTo(() => ProjectBrief, 'projectBriefId')
  declare projectBrief: ProjectBrief;

  @Column(DataType.STRING)
  declare title: string | null;

  @Column(DataType.TEXT)
  declare referenceUrl: string | null;

  @Column(DataType.TEXT)
  declare fileUrl: string | null;

  @Column(DataType.TEXT)
  declare description: string | null;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare sortOrder: number;

  @CreatedAt
  declare createdAt: Date;
}
