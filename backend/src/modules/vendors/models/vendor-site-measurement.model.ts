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

import { Project } from '@/modules/projects/models/projects.model';
import { Vendor } from './vendors.model';
import { TradeTeam } from '@/modules/process/models/trade-team.model';
import { Document } from '../../documents/models/document.model';

@Table({
  tableName: 'vendor_site_measurements',
  timestamps: false,
  underscored: true,
  charset: 'utf8',
  collate: 'utf8_unicode_ci',
})
export class VendorSiteMeasurement extends Model<VendorSiteMeasurement> {
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
    type: DataType.DATE,
    allowNull: true,
    field: 'measured_at',
  })
  declare measuredAt: Date | null;

  @ForeignKey(() => Document)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'document_id',
  })
  declare documentId: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

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

  @BelongsTo(() => Document, 'documentId')
  declare document: Document;
}
