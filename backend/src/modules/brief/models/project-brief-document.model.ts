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
} from 'sequelize-typescript';

import { ProjectBrief } from './project-brief.model';
import { ProjectBriefDocumentType } from '@/common/types/project-brief.types';

@Table({
  tableName: 'project_brief_documents',
  timestamps: true,
  updatedAt: false,
  underscored: true,
})
export class ProjectBriefDocument extends Model<ProjectBriefDocument> {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => ProjectBrief)
  @AllowNull(false)
  @Column(DataType.CHAR(36))
  declare projectBriefId: string;

  @BelongsTo(() => ProjectBrief, 'projectBriefId')
  declare projectBrief: ProjectBrief;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(ProjectBriefDocumentType)),
  })
  declare documentType: ProjectBriefDocumentType;

  @Column(DataType.STRING)
  declare documentName: string | null;

  @Column(DataType.TEXT)
  declare documentUrl: string | null;

  @Column(DataType.TEXT)
  declare notes: string | null;

  @CreatedAt
  declare createdAt: Date;
}
