import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { DailySiteReport } from './daily-site-report.model';
import { Team } from '../../process-workflow/models/team.model';

/** Headcount for one trade/team on one day's report. */
@Table({
  tableName: 'manpower_entries',
  timestamps: true,
  indexes: [{ unique: true, fields: ['dailySiteReportId', 'teamId'] }],
})
export class ManpowerEntry extends Model<ManpowerEntry> {
  @ForeignKey(() => DailySiteReport)
  @Column({ type: DataType.INTEGER, allowNull: false })
  dailySiteReportId: number;

  @BelongsTo(() => DailySiteReport)
  dailySiteReport: DailySiteReport;

  @ForeignKey(() => Team)
  @Column({ type: DataType.INTEGER, allowNull: false })
  teamId: number;

  @BelongsTo(() => Team)
  team: Team;

  @Column({ type: DataType.INTEGER, allowNull: false })
  headcount: number;
}
