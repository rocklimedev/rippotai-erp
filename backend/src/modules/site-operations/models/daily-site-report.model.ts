import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { ManpowerEntry } from './manpower-entry.model';
import { WeatherCondition } from '../../../common/enums/site-operations.enums';

/** MariaDB stores JSON as LONGTEXT, so mysql2 can hand back a string — always return parsed arrays. */
const jsonArray = (field: string) => ({
  type: DataType.JSON,
  allowNull: true,
  get(this: Model) {
    const raw = this.getDataValue(field as any) as unknown;
    if (raw == null || raw === '') return [];
    if (typeof raw === 'string') {
      try {
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(raw) ? raw : [];
  },
});

export interface WorkItem {
  activity: string;
  location?: string | null;
  progress?: number | null; // % complete for that activity
  remarks?: string | null;
}
export interface MaterialLine {
  direction: 'RECEIVED' | 'USED';
  materialId?: string | null; // material_masters.id when picked from the master
  name: string;
  quantity: number;
  unit?: string | null;
  remarks?: string | null;
}
export interface EquipmentLine {
  name: string;
  count?: number | null;
  hours?: number | null;
  remarks?: string | null;
}
export interface IssueLine {
  type: string; // DELAY | MATERIAL | MANPOWER | DESIGN | CLIENT | WEATHER | QUALITY | SAFETY | OTHER
  description: string;
  impact?: string | null; // NONE | LOW | MEDIUM | HIGH
  needsAttention?: boolean;
}
export interface PhotoLine {
  url: string;
  caption?: string | null;
  filename?: string | null;
}

/**
 * One report per project per day: weather + site condition, manpower, work done,
 * materials, equipment, issues/delays, safety, photos and tomorrow's plan.
 */
@Table({
  tableName: 'daily_site_reports',
  timestamps: true,
  indexes: [{ unique: true, fields: ['projectId', 'reportDate'] }],
})
export class DailySiteReport extends Model<DailySiteReport> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  projectId: string;

  @BelongsTo(() => Project, { constraints: false })
  project: Project;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  reportDate: string;

  /** DRAFT while being filled on site, SUBMITTED once final. */
  @Default('DRAFT')
  @Column({ type: DataType.STRING(20), allowNull: false })
  status: string;

  @Column({ type: DataType.DATE, allowNull: true })
  submittedAt: Date | null;

  @Column({
    type: DataType.ENUM(...Object.values(WeatherCondition)),
    allowNull: true,
  })
  weatherCondition: WeatherCondition | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  weatherNotes: string | null; // e.g. "Rain from 2pm, site closed early"

  /** NORMAL | WET | WATERLOGGED | DUSTY | RESTRICTED | CLOSED */
  @Column({ type: DataType.STRING(30), allowNull: true })
  siteCondition: string | null;

  /** Free-text summary; the structured list lives in workItems. */
  @Column({ type: DataType.TEXT, allowNull: true })
  workCompleted: string | null;

  @Column(jsonArray('workItems'))
  workItems: WorkItem[];

  @Column(jsonArray('materials'))
  materials: MaterialLine[];

  @Column(jsonArray('equipment'))
  equipment: EquipmentLine[];

  @Column(jsonArray('issueItems'))
  issueItems: IssueLine[];

  /** Legacy free-text issues field (kept for older reports). */
  @Column({ type: DataType.TEXT, allowNull: true })
  issues: string | null;

  /** Derived: true when any issue line is flagged. Stored for cheap filtering. */
  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  needsAttention: boolean;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  safetyIncident: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  safetyNotes: string | null;

  @Column(jsonArray('photos'))
  photos: PhotoLine[];

  @Column({ type: DataType.TEXT, allowNull: true })
  nextDayPlan: string | null;

  @Column({ type: DataType.STRING(150), allowNull: false })
  reportedBy: string;

  /** The reporter wants this report shared with the client. */
  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  shareWithClient: boolean;

  /** True once the report has actually gone out (on submit with shareWithClient, or via /share). */
  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  isShared: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  sharedAt: Date | null;

  @HasMany(() => ManpowerEntry, { onDelete: 'CASCADE' })
  manpower: ManpowerEntry[];
}
