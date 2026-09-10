import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  IsUUID,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { PlannerExportModule } from '@/common/enums/project-planner.enum';

@Table({
  tableName: 'project_planner_exports',
  timestamps: true,
  paranoid: false,
  createdAt: 'created_at',
  updatedAt: false,
})
export class ProjectPlannerExport extends Model<ProjectPlannerExport> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  @Column({
    type: DataType.ENUM(...Object.values(PlannerExportModule)),
    allowNull: false,
  })
  declare module: PlannerExportModule;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare file_url: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare generated_by: string | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare generated_at: Date;

  // ===================== Associations =====================

  @BelongsTo(() => Project, { foreignKey: 'project_id' })
  declare project: Project;

  @BelongsTo(() => User, { foreignKey: 'generated_by', as: 'generator' })
  declare generator: User;
}
