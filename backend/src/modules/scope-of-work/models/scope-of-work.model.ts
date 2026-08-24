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
import { User } from '../../users/models/user.model';
import { ScopeItem } from './scope-item.model';

@Table({
  tableName: 'scope_of_work',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class ScopeOfWork extends Model<ScopeOfWork> {
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

  // =========================================================
  // SCOPE ITEMS
  // =========================================================

  @HasMany(() => ScopeItem)
  declare items: ScopeItem[];

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare scopeSummary: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare specificExclusions: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare projectMode: string;

  @Default(1)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare version: number;

  @Default('DRAFT')
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare status: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare preparedBy: string;

  @BelongsTo(() => User, 'preparedBy')
  declare preparedByUser: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare reviewedBy: string;

  @BelongsTo(() => User, 'reviewedBy')
  declare reviewedByUser: User;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare acceptedAt: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare acceptedBy: string;

  @BelongsTo(() => User, 'acceptedBy')
  declare acceptedByUser: User;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare clientSignatureName: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare clientSignatureDate: string;

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
