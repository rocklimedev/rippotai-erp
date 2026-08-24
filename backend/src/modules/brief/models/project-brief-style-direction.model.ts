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
  Unique,
} from 'sequelize-typescript';

import { ProjectBrief } from './project-brief.model';
import { StyleDirection } from '@/common/types/project-brief.types';

@Table({
  tableName: 'project_brief_style_directions',
  timestamps: true,
  updatedAt: false,
  underscored: true,
})
export class ProjectBriefStyleDirection extends Model<ProjectBriefStyleDirection> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.CHAR(36),
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => ProjectBrief)
  @AllowNull(false)
  @Unique('uk_project_brief_style_direction')
  @Column(DataType.CHAR(36))
  declare projectBriefId: string;

  @BelongsTo(() => ProjectBrief, 'projectBriefId')
  declare projectBrief: ProjectBrief;

  @AllowNull(false)
  @Unique('uk_project_brief_style_direction')
  @Column({
    type: DataType.ENUM(...Object.values(StyleDirection)),
  })
  declare styleDirection: StyleDirection;

  @Column(DataType.STRING)
  declare otherDescription: string | null;

  @CreatedAt
  declare createdAt: Date;
}
