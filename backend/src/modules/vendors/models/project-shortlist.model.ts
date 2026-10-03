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
  // ============================================================
  // ID
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ============================================================
  // PROJECT
  // ============================================================

  @ForeignKey(() => Project)
  @Index({
    name: 'uq_project_shortlist_type',
    unique: true,
  })
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

  // ============================================================
  // SHORTLIST TYPE
  // ============================================================

  @Index({
    name: 'uq_project_shortlist_type',
    unique: true,
  })
  @Column({
    type: DataType.ENUM(...Object.values(ShortlistType)),
    allowNull: false,
  })
  declare shortlist_type: ShortlistType;

  // ============================================================
  // TITLE
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare title: string | null;

  // ============================================================
  // NOTES
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  // ============================================================
  // LOCK
  // ============================================================

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_locked: boolean;

  // ============================================================
  // AUDIT
  // ============================================================

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

  // ============================================================
  // ENTRIES
  // ============================================================

  @HasMany(() => ShortlistEntry, {
    foreignKey: 'project_shortlist_id',
    as: 'entries',
    onDelete: 'CASCADE',
    hooks: true,
  })
  declare entries: ShortlistEntry[];

  // ============================================================
  // TIMESTAMPS
  // ============================================================

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
