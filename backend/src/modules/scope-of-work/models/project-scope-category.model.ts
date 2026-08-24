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
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { ScopeCategory } from './scope-category.model';

@Table({
  tableName: 'project_scope_categories',
  timestamps: true,
  underscored: true,
})
export class ProjectScopeCategory extends Model<ProjectScopeCategory> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare projectId: string;

  @BelongsTo(() => Project)
  declare project: Project;

  @ForeignKey(() => ScopeCategory)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare scopeCategoryId: string;

  @BelongsTo(() => ScopeCategory)
  declare scopeCategory: ScopeCategory;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sortOrder: number;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isActive: boolean;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @UpdatedAt
  @Column
  declare updatedAt: Date;
}
