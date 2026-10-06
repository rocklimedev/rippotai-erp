import {
  Table,
  Column,
  Model,
  Default,
  PrimaryKey,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { DailySiteReport } from './daily-site-report.model';

/** Headcount for one trade / contractor on one day's report. */
@Table({ tableName: 'manpower_entries', timestamps: true })
export class ManpowerEntry extends Model<ManpowerEntry> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare id: string;

  @ForeignKey(() => DailySiteReport)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  dailySiteReportId: string;

  @BelongsTo(() => DailySiteReport)
  dailySiteReport: DailySiteReport;

  /** Legacy link to a process-workflow team (unused by the current form). */
  @Column({ type: DataType.CHAR(36), allowNull: true })
  teamId: string | null;

  /** Trade category, e.g. CIVIL, ELECTRICAL, CARPENTRY, HELPER. */
  @Column({ type: DataType.STRING(40), allowNull: false })
  trade: string;

  /** Contractor / agency supplying the workers (optional). */
  @Column({ type: DataType.STRING(150), allowNull: true })
  contractorName: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false })
  headcount: number;
}
