import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { SampleBoard } from '@/modules/materials/models/sample-board.model';

export enum MaterialRequirementStatus {
  PENDING = 'PENDING',
  SOURCING = 'SOURCING',
  ORDERED = 'ORDERED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

@Table({
  tableName: 'material_requirements',
  timestamps: true,
  underscored: true,
})
export class MaterialRequirement extends Model<
  InferAttributes<MaterialRequirement>,
  InferCreationAttributes<MaterialRequirement>
> {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: CreationOptional<string>;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    field: 'project_id',
  })
  declare projectId: string;

  @BelongsTo(() => Project, 'projectId')
  declare project?: NonAttribute<Project>;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'raised_by',
  })
  declare raisedBy: string | null;

  @BelongsTo(() => User, 'raisedBy')
  declare raisedByUser?: NonAttribute<User>;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare category: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'budget_hint',
  })
  declare budgetHint: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'style_notes',
  })
  declare styleNotes: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(MaterialRequirementStatus)),
    allowNull: false,
    defaultValue: MaterialRequirementStatus.PENDING,
  })
  declare status: CreationOptional<MaterialRequirementStatus>;

  @ForeignKey(() => SampleBoard)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'sample_board_id',
  })
  declare sampleBoardId: string | null;

  @BelongsTo(() => SampleBoard, 'sampleBoardId')
  declare sampleBoard?: NonAttribute<SampleBoard>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}
