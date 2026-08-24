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
import { ProcurementCategory } from '@/common/types/project-brief.types';

@Table({
  tableName: 'project_brief_procurement_categories',
  timestamps: true,
  updatedAt: false,
  underscored: true,
})
export class ProjectBriefProcurementCategory extends Model<ProjectBriefProcurementCategory> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.CHAR(36),
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => ProjectBrief)
  @AllowNull(false)
  @Unique('uk_project_brief_procurement_category')
  @Column(DataType.CHAR(36))
  declare projectBriefId: string;

  @BelongsTo(() => ProjectBrief, 'projectBriefId')
  declare projectBrief: ProjectBrief;

  @AllowNull(false)
  @Unique('uk_project_brief_procurement_category')
  @Column({
    type: DataType.ENUM(...Object.values(ProcurementCategory)),
  })
  declare category: ProcurementCategory;

  @Column(DataType.STRING)
  declare otherDescription: string | null;

  @CreatedAt
  declare createdAt: Date;
}
