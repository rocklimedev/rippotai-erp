import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Project } from '../../projects/models/projects.model';
import { Boq } from '../../boqs/models/boq.model';

@Table({
  tableName: 'vendor_rate_comparisons',
  timestamps: true,
  underscored: true,
})
export class VendorRateComparison extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;
  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;
  @BelongsTo(() => Project) declare project: Project;
  @ForeignKey(() => Boq)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare boq_id: string;
  @BelongsTo(() => Boq) declare boq: Boq;
  @Column({ type: DataType.TEXT, allowNull: true }) declare notes:
    | string
    | null;
  @Column({ type: DataType.JSON, allowNull: false }) declare snapshot: Record<
    string,
    any
  >;
  @Default(1) @Column(DataType.INTEGER) declare revision: number;
  @Column(DataType.CHAR(36)) declare created_by: string;
}
