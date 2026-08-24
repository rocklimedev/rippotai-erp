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
import { WorkType } from '@/common/types/project-brief.types';

@Table({
  tableName: 'project_brief_work_types',
  timestamps: true,
  updatedAt: false,
  underscored: true,
})
export class ProjectBriefWorkType extends Model<ProjectBriefWorkType> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.CHAR(36),
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => ProjectBrief)
  @AllowNull(false)
  @Unique('uk_project_brief_work_type')
  @Column(DataType.CHAR(36))
  declare projectBriefId: string;

  @BelongsTo(() => ProjectBrief, 'projectBriefId')
  declare projectBrief: ProjectBrief;

  @AllowNull(false)
  @Unique('uk_project_brief_work_type')
  @Column({
    type: DataType.ENUM(...Object.values(WorkType)),
  })
  declare workType: WorkType;

  @CreatedAt
  declare createdAt: Date;
}
