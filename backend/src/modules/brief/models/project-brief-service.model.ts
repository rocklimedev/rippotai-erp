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
import { ServiceType } from '@/common/types/project-brief.types';

@Table({
  tableName: 'project_brief_services',
  timestamps: true,
  updatedAt: false,
  underscored: true,
})
export class ProjectBriefService extends Model<ProjectBriefService> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.CHAR(36),
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => ProjectBrief)
  @AllowNull(false)
  @Unique('uk_project_brief_service')
  @Column(DataType.CHAR(36))
  declare projectBriefId: string;

  @BelongsTo(() => ProjectBrief, 'projectBriefId')
  declare projectBrief: ProjectBrief;

  @AllowNull(false)
  @Unique('uk_project_brief_service')
  @Column({
    type: DataType.ENUM(...Object.values(ServiceType)),
  })
  declare serviceType: ServiceType;

  @CreatedAt
  declare createdAt: Date;
}
