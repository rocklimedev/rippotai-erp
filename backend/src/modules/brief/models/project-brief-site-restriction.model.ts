// project-brief-site-restriction.model.ts
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
  UpdatedAt,
  Index,
} from 'sequelize-typescript';

import { ProjectBrief } from './project-brief.model';
import { SiteRestrictionType } from '@/common/types/project-brief.types';

@Table({
  tableName: 'project_brief_site_restrictions',
  timestamps: true,
  underscored: true,
})
export class ProjectBriefSiteRestriction extends Model<ProjectBriefSiteRestriction> {
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.CHAR(36), defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => ProjectBrief)
  @AllowNull(false)
  @Index
  @Column(DataType.CHAR(36))
  declare projectBriefId: string;

  @BelongsTo(() => ProjectBrief, 'projectBriefId')
  declare projectBrief: ProjectBrief;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare sortOrder: number;

  @AllowNull(false)
  @Column({ type: DataType.ENUM(...Object.values(SiteRestrictionType)) })
  declare type: SiteRestrictionType;

  @Column(DataType.TEXT)
  declare details: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
