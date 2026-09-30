import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { VisitType } from '@/common/enums/architect-visit.enums';
import { ArchitectSiteVisit } from './architect-site-visit.model';

/**
 * MASTER. Sheet: "Architect visit schedule" (21 standard rows).
 * Visit No. | Stage | Main checks / Purpose | Visit Type | Remarks
 */
@Table({
  tableName: 'architect_visit_stages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ArchitectVisitStage extends Model<ArchitectVisitStage> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  declare visit_no: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare stage: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare checks_purpose: string;

  @Column({
    type: DataType.ENUM(...Object.values(VisitType)),
    allowNull: false,
  })
  declare visit_type: VisitType;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare is_active: boolean;

  @HasMany(() => ArchitectSiteVisit, { foreignKey: 'stage_id', as: 'visits' })
  declare visits: ArchitectSiteVisit[];
}
