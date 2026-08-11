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

import {
  TenderResponsePath,
  TenderResponseStatus,
} from '@/common/enums/estimate.enums';

import { Project } from '@/modules/projects/models/projects.model';
import { Vendor } from './vendors.model';
import { TradeTeam } from '@/modules/process/models/trade-team.model';
import { Document } from '../../documents/models/document.model';
import { Estimate } from '@/modules/quotations/models/estimate.model';

@Table({
  tableName: 'vendor_tender_responses',
  timestamps: false,
  underscored: true,
  charset: 'utf8',
  collate: 'utf8_unicode_ci',
})
export class VendorTenderResponse extends Model<VendorTenderResponse> {
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

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'vendor_id',
  })
  declare vendorId: string;

  @ForeignKey(() => TradeTeam)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'trade_team_id',
  })
  declare tradeTeamId: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(TenderResponsePath)),
    allowNull: false,
    defaultValue: TenderResponsePath.VENDOR_QUOTE,
    field: 'response_path',
  })
  declare responsePath: TenderResponsePath;

  @ForeignKey(() => Document)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'raw_quote_document_id',
  })
  declare rawQuoteDocumentId: string | null;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: true,
    field: 'submitted_amount',
  })
  declare submittedAmount: number | null;

  @Column({
    type: DataType.ENUM(...Object.values(TenderResponseStatus)),
    allowNull: false,
    defaultValue: TenderResponseStatus.RECEIVED,
  })
  declare status: TenderResponseStatus;

  @ForeignKey(() => Estimate)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'estimate_id',
  })
  declare estimateId: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'received_at',
  })
  declare receivedAt: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  declare createdAt: Date;

  // Associations

  @BelongsTo(() => Project, 'projectId')
  declare project: Project;

  @BelongsTo(() => Vendor, 'vendorId')
  declare vendor: Vendor;

  @BelongsTo(() => TradeTeam, 'tradeTeamId')
  declare tradeTeam: TradeTeam;

  @BelongsTo(() => Document, 'rawQuoteDocumentId')
  declare rawQuoteDocument: Document;

  @BelongsTo(() => Estimate, 'estimateId')
  declare estimate: Estimate;
}
