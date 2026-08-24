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

@Table({
  tableName: 'project_brief_phases',
  timestamps: true,
  underscored: true,
})
export class ProjectBriefPhase extends Model<ProjectBriefPhase> {
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

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare sortOrder: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare phaseName: string;

  @Column(DataType.DATEONLY)
  declare startDate: string | null;

  @Column(DataType.DATEONLY)
  declare endDate: string | null;

  @Column(DataType.STRING)
  declare expectedTime: string | null;

  @Column(DataType.TEXT)
  declare notes: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
