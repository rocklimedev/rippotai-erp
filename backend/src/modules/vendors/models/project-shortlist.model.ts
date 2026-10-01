import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';

import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { ShortlistType } from '@/common/enums/shortlist.enums';
import { ShortlistEntry } from './shortlist-entry.model';

export interface ProjectShortlistCreationAttributes {
  id?: string;

  project_id: string;

  shortlist_type: ShortlistType;

  title?: string | null;

  notes?: string | null;

  is_locked?: boolean;

  created_by?: string | null;

  updated_by?: string | null;

  created_at?: Date;

  updated_at?: Date;
}

@Table({
  tableName: 'project_shortlists',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ProjectShortlist extends Model<
  ProjectShortlist,
  ProjectShortlistCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @ForeignKey(() => Project)
  @Index
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_id: string;

  @BelongsTo(() => Project, {
    foreignKey: 'project_id',
    as: 'project',
  })
  declare project: Project;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(ShortlistType)),
    allowNull: false,
  })
  declare shortlist_type: ShortlistType;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare title: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_locked: boolean;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare updated_by: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  @BelongsTo(() => User, {
    foreignKey: 'updated_by',
    as: 'updater',
  })
  declare updater: User;

  @HasMany(() => ShortlistEntry, {
    foreignKey: 'project_shortlist_id',
    as: 'entries',
  })
  declare entries: ShortlistEntry[];

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  declare created_at: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
  })
  declare updated_at: Date;
}
