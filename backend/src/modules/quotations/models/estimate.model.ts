import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  PrimaryKey,
} from 'sequelize-typescript';

import {
  EstimateSourcePath,
  EstimateCategory,
  EstimateStatus,
} from '@/common/enums/estimate.enums';

import { EstimateItem } from './estimate-item.model';

// Associations
import { Project } from '@/modules/projects/models/projects.model';
import { Vendor } from '@/modules/vendors/models/vendors.model';
import { TradeTeam } from '@/modules/process/models/trade-team.model';
import { User } from '../../users/models/user.model';
import { Quotation } from './quotations.model';

@Table({
  tableName: 'estimates',
  timestamps: true,
  paranoid: true,
  underscored: true,
  charset: 'utf8',
  collate: 'utf8_unicode_ci',
})
export class Estimate extends Model<Estimate> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    field: 'estimate_number',
  })
  declare estimateNumber: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'project_id',
  })
  declare projectId: string;

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'vendor_id',
  })
  declare vendorId: string | null;

  @ForeignKey(() => TradeTeam)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'trade_team_id',
  })
  declare tradeTeamId: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(EstimateSourcePath)),
    allowNull: false,
    defaultValue: EstimateSourcePath.RATES_ONLY,
    field: 'source_path',
  })
  declare sourcePath: EstimateSourcePath;

  @Column({
    type: DataType.ENUM(...Object.values(EstimateCategory)),
    allowNull: false,
    defaultValue: EstimateCategory.TRADE,
  })
  declare category: EstimateCategory;

  @Column({
    type: DataType.ENUM(...Object.values(EstimateStatus)),
    allowNull: false,
    defaultValue: EstimateStatus.DRAFT,
  })
  declare status: EstimateStatus;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare subtotal: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'total_amount',
  })
  declare totalAmount: number;

  @ForeignKey(() => Quotation)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'converted_quotation_id',
  })
  declare convertedQuotationId: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'approved_at',
  })
  declare approvedAt: Date | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'approved_by',
  })
  declare approvedBy: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'created_by',
  })
  declare createdBy: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'updated_by',
  })
  declare updatedBy: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'deleted_at',
  })
  declare deletedAt: Date | null;

  // Associations

  @BelongsTo(() => Project, 'projectId')
  declare project: Project;

  @BelongsTo(() => Vendor, 'vendorId')
  declare vendor: Vendor;

  @BelongsTo(() => TradeTeam, 'tradeTeamId')
  declare tradeTeam: TradeTeam;

  @BelongsTo(() => User, 'approvedBy')
  declare approver: User;

  @BelongsTo(() => Quotation, 'convertedQuotationId')
  declare convertedQuotation: Quotation;

  @HasMany(() => EstimateItem, 'estimateId')
  declare items: EstimateItem[];
}
