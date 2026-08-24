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
import { User } from '../../users/models/user.model';
import { ProjectBriefAttachmentCategory } from '@/common/types/project-brief.types';

@Table({
  tableName: 'project_brief_attachments',
  timestamps: true,
  updatedAt: false,
  underscored: true,
})
export class ProjectBriefAttachment extends Model<ProjectBriefAttachment> {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => ProjectBrief)
  @AllowNull(false)
  @Index
  @Column(DataType.CHAR(36))
  declare projectBriefId: string;

  @BelongsTo(() => ProjectBrief, 'projectBriefId')
  declare projectBrief: ProjectBrief;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(ProjectBriefAttachmentCategory)),
  })
  declare category: ProjectBriefAttachmentCategory;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare fileUrl: string;

  @Column(DataType.STRING(150))
  declare mimeType: string | null;

  @ForeignKey(() => User)
  @Column(DataType.CHAR(36))
  declare uploadedBy: string | null;

  @BelongsTo(() => User, 'uploadedBy')
  declare uploader: User | null;

  @CreatedAt
  declare createdAt: Date;
}
