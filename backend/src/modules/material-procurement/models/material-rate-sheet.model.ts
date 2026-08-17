import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { ApprovalStatus } from '../../../common/enums/approval-status.enum';
import { MaterialRequirement } from './material-requirement.model';

/**
 * 2b. Sourcing & sample boards — material rate sheets tracked per
 * requirement, with approval status.
 */
@Table({
  tableName: 'material_rate_sheets',
  timestamps: true,
  updatedAt: false,
})
export class MaterialRateSheet extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => MaterialRequirement)
  @Column(DataType.UUID)
  materialRequirementId: string;

  @BelongsTo(() => MaterialRequirement, { onDelete: 'CASCADE' })
  materialRequirement: MaterialRequirement;

  @Column(DataType.STRING)
  vendorName: string;

  @Column(DataType.STRING)
  unit: string;

  @Column(DataType.DECIMAL(12, 2))
  unitRate: number;

  @Default('INR')
  @Column(DataType.STRING)
  currency: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  validTill: string;

  @Default(ApprovalStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(ApprovalStatus)))
  approvalStatus: ApprovalStatus;

  @Column({ type: DataType.STRING, allowNull: true })
  approvedBy: string;

  @Column({ type: DataType.DATE, allowNull: true })
  approvedAt: Date;
}
