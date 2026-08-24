import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  HasOne,
} from 'sequelize-typescript';

import { ApprovalStatus } from '../../../common/enums/approval-status.enum';
import { MaterialRequirement } from './material-requirement.model';
import { MaterialQuotation } from './material-quotation.model';

/**
 * 3. Material estimate → quotation.
 * Follows the identical estimate → approval → quotation conversion
 * rule used for trades: an estimate must reach ApprovalStatus.APPROVED
 * before it can be converted into a MaterialQuotation.
 */
@Table({
  tableName: 'material_estimates',
  timestamps: true,
  updatedAt: false,
})
export class MaterialEstimate extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => MaterialRequirement)
  @Column({
    type: DataType.UUID,
    unique: true,
  })
  declare materialRequirementId: string;

  @BelongsTo(() => MaterialRequirement, { onDelete: 'CASCADE' })
  declare materialRequirement: MaterialRequirement;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare rateSheetId: string;

  @Column(DataType.DECIMAL(12, 3))
  declare quantity: number;

  @Column(DataType.STRING)
  declare unit: string;

  @Column(DataType.DECIMAL(12, 2))
  declare unitRate: number;

  @Column(DataType.DECIMAL(14, 2))
  declare totalAmount: number;

  @Default(ApprovalStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(ApprovalStatus)))
  declare approvalStatus: ApprovalStatus;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare approvedBy: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare approvedAt: Date;

  // Set true only once the approved estimate has been converted
  // into a MaterialQuotation — mirrors the trades conversion rule.
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare convertedToQuotation: boolean;

  @HasOne(() => MaterialQuotation)
  declare quotation: MaterialQuotation;
}
