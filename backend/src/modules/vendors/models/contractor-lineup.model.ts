import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  PrimaryKey,
} from 'sequelize-typescript';

import { ContractorLineupStatus } from '@/common/enums/estimate.enums';
import { Project } from '@/modules/projects/models/projects.model';
import { TradeTeam } from '@/modules/process/models/trade-team.model';
import { Vendor } from './vendors.model';
import { Quotation } from '@/modules/quotations/models/quotations.model';

@Table({
  tableName: 'contractor_lineup',
  timestamps: true,
  underscored: true,
  charset: 'utf8',
  collate: 'utf8_unicode_ci',
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'trade_team_id'],
      name: 'uk_lineup_project_trade',
    },
  ],
})
export class ContractorLineup extends Model<ContractorLineup> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'project_id',
  })
  declare projectId: string;

  @ForeignKey(() => TradeTeam)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'trade_team_id',
  })
  declare tradeTeamId: string;

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'vendor_id',
  })
  declare vendorId: string;

  @ForeignKey(() => Quotation)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'quotation_id',
  })
  declare quotationId: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(ContractorLineupStatus)),
    allowNull: false,
    defaultValue: ContractorLineupStatus.ASSIGNED,
  })
  declare status: ContractorLineupStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'mobilised_at',
  })
  declare mobilisedAt: Date | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  // Associations

  @BelongsTo(() => Project, 'projectId')
  declare project: Project;

  @BelongsTo(() => TradeTeam, 'tradeTeamId')
  declare tradeTeam: TradeTeam;

  @BelongsTo(() => Vendor, 'vendorId')
  declare vendor: Vendor;

  @BelongsTo(() => Quotation, 'quotationId')
  declare quotation: Quotation;

  // Sequelize timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}
