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
import { User } from '@/modules/users/models/user.model';
import { ProjectPlannerType } from '@/common/enums/project-planner.enum';
import { ProjectPlannerItem } from './project_planner_items.model';
import { ProjectProcurementItem } from './project_procurement_items.model';

export interface ProjectPlannerCreationAttributes {
  id?: string;
  project_id: string;
  type: ProjectPlannerType;
  name?: string | null;
  description?: string | null;
  planned_start_date?: string | null;
  planned_end_date?: string | null;
  is_active?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_at?: Date | null;
}

@Table({
  tableName: 'project_planners',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'type'],
    },
  ],
})
export class ProjectPlanner extends Model<
  ProjectPlanner,
  ProjectPlannerCreationAttributes
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

  @Column({
    type: DataType.ENUM(...Object.values(ProjectPlannerType)),
    allowNull: false,
  })
  declare type: ProjectPlannerType;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare name: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare planned_start_date: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare planned_end_date: string | null;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare is_active: boolean;

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

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare deleted_at: Date | null;

  // ================= Associations =================

  @BelongsTo(() => Project)
  declare project: Project;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  @HasMany(() => ProjectPlannerItem, {
    foreignKey: 'planner_id',
  })
  declare items: ProjectPlannerItem[];

  @HasMany(() => ProjectProcurementItem, {
    foreignKey: 'planner_id',
  })
  declare procurement_items: ProjectProcurementItem[];
}
