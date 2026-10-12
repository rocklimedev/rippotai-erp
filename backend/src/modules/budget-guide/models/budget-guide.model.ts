import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Project } from '../../projects/models/projects.model';
import { GuideNoteDto, GuidePlanDto } from '../dto/budget-guide.dto';

@Table({
  tableName: 'budget_guides',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BudgetGuide extends Model<BudgetGuide, Partial<BudgetGuide>> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;
  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare project_id: string | null;
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare source_guide_id: string | null;
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare project_type: string;
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare location: string;
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare prepared_by: string;
  @Column({ type: DataType.CHAR(3), allowNull: false })
  declare currency: string;
  @Column({ type: DataType.STRING(80), allowNull: false })
  declare area_unit: string;
  @Column({ type: DataType.DECIMAL(18, 4), allowNull: true })
  declare built_up_area: number | null;
  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare issue_date: string;
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare validity_months: number;
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare rate_validity_days: number;
  @Column({
    type: DataType.ENUM('draft', 'published', 'archived'),
    allowNull: false,
  })
  declare status: string;
  @Column({ type: DataType.TEXT, allowNull: false })
  declare introduction: string;
  @Column({ type: DataType.JSON, allowNull: false })
  declare plans: GuidePlanDto[];
  @Column({ type: DataType.JSON, allowNull: false })
  declare pricing_notes: GuideNoteDto[];
  @Column({ type: DataType.JSON, allowNull: false })
  declare next_steps: GuideNoteDto[];
  @Default(1)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare revision: number;
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare created_by: string;
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare updated_by: string;
  @BelongsTo(() => Project) declare project: Project;
}
