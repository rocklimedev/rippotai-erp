import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import { jsonColumn } from '@/common/types/json-column';

/** Immutable archive of a generated DPR and the exact Excel delivered to the user. */
@Table({
  tableName: 'admin_dpr_documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class AdminDprDocument extends Model<AdminDprDocument> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;
  @Column({ type: DataType.CHAR(36), allowNull: true }) declare project_id:
    | string
    | null;
  @Column(jsonColumn('project_names'))
  declare project_names: string[];
  @Column(jsonColumn('project_ids'))
  declare project_ids: string[];
  @Column({ type: DataType.DATEONLY, allowNull: true }) declare from_date:
    | string
    | null;
  @Column({ type: DataType.DATEONLY, allowNull: true }) declare to_date:
    | string
    | null;
  @Column(jsonColumn('filters')) declare filters: Record<string, any>;
  @Column(jsonColumn('reports')) declare reports: Record<string, any>[];
  @Column(jsonColumn('logs')) declare logs: Record<string, any>[];
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare report_count: number;
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare log_count: number;
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare filename: string;
  @Column({ type: DataType.BLOB('long'), allowNull: false })
  declare excel_data: Buffer;
  @Column({ type: DataType.CHAR(36), allowNull: true }) declare created_by:
    | string
    | null;
  @Column({ type: DataType.STRING(150), allowNull: true })
  declare created_by_name: string | null;
}
