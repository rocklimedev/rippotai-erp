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
  IsUUID,
} from 'sequelize-typescript';

import { Project } from '@/modules/projects/models/projects.model';
import { PlannerLocationType } from '@/common/enums/project-planner.enum';
import { ProjectPlannerItemLocation } from './project_planner_item_locations.model';

export interface ProjectLocationCreationAttributes {
  id?: string;

  project_id: string;

  parent_id?: string | null;

  type: PlannerLocationType;

  name: string;

  code?: string | null;

  sort_order?: number;
}

@Table({
  tableName: 'project_locations',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    {
      fields: ['project_id', 'parent_id'],
    },
  ],
})
export class ProjectLocation extends Model<
  ProjectLocation,
  ProjectLocationCreationAttributes
> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_id: string;

  @ForeignKey(() => ProjectLocation)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare parent_id: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(PlannerLocationType)),
    allowNull: false,
    defaultValue: PlannerLocationType.FLOOR,
  })
  declare type: PlannerLocationType;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare code: string | null;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sort_order: number;

  @BelongsTo(() => Project)
  declare project: Project;

  @BelongsTo(() => ProjectLocation, {
    foreignKey: 'parent_id',
    as: 'parent',
  })
  declare parent: ProjectLocation | null;

  @HasMany(() => ProjectLocation, {
    foreignKey: 'parent_id',
    as: 'children',
  })
  declare children: ProjectLocation[];

  @HasMany(() => ProjectPlannerItemLocation, {
    foreignKey: 'location_id',
  })
  declare planner_item_locations: ProjectPlannerItemLocation[];
}
