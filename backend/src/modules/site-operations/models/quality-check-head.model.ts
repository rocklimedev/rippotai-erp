import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { ProjectQualityCheck } from './project-quality-check.model';

/**
 * MASTER catalog from ARCHITECT SITEVISIT SCHEDULE.xlsx → "Quality check list"
 * and QUALITY CHECK LIST.xlsx → "QC -Work heads" (cleaned).
 *
 * One row per work head / inspection head. Per-project pass/fail lives in
 * project_quality_checks.
 *
 * Columns: Sort Order | Name | is_active
 */
@Table({
  tableName: 'quality_check_heads',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class QualityCheckHead extends Model<QualityCheckHead> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  declare sort_order: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare is_active: boolean;

  @HasMany(() => ProjectQualityCheck, { foreignKey: 'item_id', as: 'checks' })
  declare checks: ProjectQualityCheck[];
}
