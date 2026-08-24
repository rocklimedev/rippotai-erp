import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';

import { ProjectScopeCategory } from './project-scope-category.model';
import { ScopeItem } from './scope-item.model';

@Table({
  tableName: 'scope_categories',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class ScopeCategory extends Model<ScopeCategory> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare slug: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

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

  @DeletedAt
  @Column
  declare deletedAt: Date;

  @HasMany(() => ProjectScopeCategory)
  declare projectScopeCategories: ProjectScopeCategory[];

  @HasMany(() => ScopeItem)
  declare scopeItems: ScopeItem[];
}
