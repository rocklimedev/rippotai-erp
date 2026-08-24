import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';

import { Project } from '@/modules/projects/models/projects.model';
import { ProjectSpace } from './project-space.model';
import { ScopeCategory } from './scope-category.model';
import { ScopeOfWork } from './scope-of-work.model';

@Table({
  tableName: 'scope_items',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class ScopeItem extends Model<ScopeItem> {
  // =========================================================
  // ID
  // =========================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  // =========================================================
  // PROJECT
  // =========================================================

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare projectId: string;

  @BelongsTo(() => Project)
  declare project: Project;

  // =========================================================
  // SCOPE OF WORK DOCUMENT
  // =========================================================

  @ForeignKey(() => ScopeOfWork)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'scope_of_work_id',
  })
  declare scopeOfWorkId: string;

  @BelongsTo(() => ScopeOfWork, {
    foreignKey: 'scopeOfWorkId',
  })
  declare scopeOfWorkDocument: ScopeOfWork;

  // =========================================================
  // SCOPE OF WORK DESCRIPTION
  // =========================================================
  //
  // This is the actual work description for this scope item.
  //
  // Example:
  // "Complete electrical wiring, switchboards and light points."
  //
  // scopeOfWorkId = parent Scope Of Work document
  // scopeOfWork   = actual item description
  //
  // =========================================================

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare scopeOfWork: string;

  // =========================================================
  // PROJECT SPACE
  // =========================================================

  @ForeignKey(() => ProjectSpace)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare projectSpaceId: string;

  @BelongsTo(() => ProjectSpace)
  declare projectSpace: ProjectSpace;

  // =========================================================
  // SCOPE CATEGORY
  // =========================================================

  @ForeignKey(() => ScopeCategory)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare scopeCategoryId: string;

  @BelongsTo(() => ScopeCategory)
  declare scopeCategory: ScopeCategory;

  // =========================================================
  // INCLUDED
  // =========================================================

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isIncluded: boolean;

  // =========================================================
  // EXCLUDED
  // =========================================================

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isExcluded: boolean;

  // =========================================================
  // NOTES
  // =========================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string;

  // =========================================================
  // SORT ORDER
  // =========================================================

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sortOrder: number;

  // =========================================================
  // TIMESTAMPS
  // =========================================================

  @CreatedAt
  @Column
  declare createdAt: Date;

  @UpdatedAt
  @Column
  declare updatedAt: Date;

  @DeletedAt
  @Column
  declare deletedAt: Date;
}
