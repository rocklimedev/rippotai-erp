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
  DeletedAt,
} from 'sequelize-typescript';

import { Project } from '@/modules/projects/models/projects.model';
import { ScopeItem } from './scope-item.model';

@Table({
  tableName: 'project_spaces',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class ProjectSpace extends Model<ProjectSpace> {
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

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
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

  // Size details shared with every document that lists rooms (autofill).
  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare area: number | null;

  @Column({ type: DataType.DECIMAL(14, 6), allowNull: true })
  declare length: number | null;

  @Column({ type: DataType.DECIMAL(14, 6), allowNull: true })
  declare width: number | null;

  @Column({ type: DataType.DECIMAL(14, 6), allowNull: true })
  declare height: number | null;

  @Column({ type: DataType.STRING(8), allowNull: true })
  declare measurementUnit: string | null;

  @Column({ type: DataType.STRING(64), allowNull: true })
  declare sourceDocument: string | null;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @UpdatedAt
  @Column
  declare updatedAt: Date;

  @DeletedAt
  @Column
  declare deletedAt: Date;

  @HasMany(() => ScopeItem)
  declare scopeItems: ScopeItem[];
}
