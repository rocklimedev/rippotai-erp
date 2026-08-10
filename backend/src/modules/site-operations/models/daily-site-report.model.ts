import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { Project } from '../../process-workflow/models/project.model';
import { ManpowerEntry } from './manpower-entry.model';
import { WeatherCondition } from '../../../common/enums/site-operations.enums';

/**
 * One report per project per day: weather, manpower, work completed, and
 * issues, shared with the whole team.
 */
@Table({
  tableName: 'so_daily_site_reports',
  timestamps: true,
  indexes: [{ unique: true, fields: ['projectId', 'reportDate'] }],
})
export class DailySiteReport extends Model<DailySiteReport> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  projectId: number;

  @BelongsTo(() => Project)
  project: Project;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  reportDate: string;

  @Column({
    type: DataType.ENUM(...Object.values(WeatherCondition)),
    allowNull: true,
  })
  weatherCondition: WeatherCondition | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  weatherNotes: string | null; // e.g. "Rain from 2pm, site closed early"

  @Column({ type: DataType.TEXT, allowNull: false })
  workCompleted: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  issues: string | null;

  @Column({ type: DataType.STRING(150), allowNull: false })
  reportedBy: string;

  /** True once the report has gone out to the team distribution list. */
  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  isShared: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  sharedAt: Date | null;

  @HasMany(() => ManpowerEntry, { onDelete: 'CASCADE' })
  manpower: ManpowerEntry[];
}
