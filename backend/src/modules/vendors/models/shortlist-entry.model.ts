import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';

import { ProjectShortlist } from './project-shortlist.model';
import { Vendor } from '@/modules/vendors/models/vendors.model';
import { MaterialMaster } from '@/modules/material-procurement/models/material-master.model';
import { User } from '@/modules/users/models/user.model';

import {
  Trade,
  WorkingType,
  ShortlistEntryStatus,
} from '@/common/enums/shortlist.enums';

/**
 * ============================================================
 * SHORTLIST ENTRY CREATION ATTRIBUTES
 * ============================================================
 *
 * Fields that can be supplied when creating a ShortlistEntry.
 *
 * Sequelize-managed fields and associations are intentionally
 * excluded from this type.
 */
export interface ShortlistEntryCreationAttributes {
  id?: string;

  project_shortlist_id: string;

  trade: Trade;

  working_type: WorkingType;

  sort_order?: number;

  vendor_id?: string | null;

  material_id?: string | null;

  name_of_vendor?: string | null;

  estimate_value?: number | null;

  quotation_value?: number | null;

  currency?: string;

  quotation_id?: string | null;

  status?: ShortlistEntryStatus;

  notes?: string | null;

  is_selected?: boolean;

  created_by?: string | null;

  updated_by?: string | null;

  created_at?: Date;

  updated_at?: Date;
}

/**
 * ============================================================
 * SHORTLIST ENTRY
 * ============================================================
 *
 * One row in the Excel-like shortlist grid.
 */
@Table({
  tableName: 'shortlist_entries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ShortlistEntry extends Model<
  ShortlistEntry,
  ShortlistEntryCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ============================================================
  // PROJECT SHORTLIST
  // ============================================================

  @ForeignKey(() => ProjectShortlist)
  @Index
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_shortlist_id: string;

  @BelongsTo(() => ProjectShortlist, {
    foreignKey: 'project_shortlist_id',
    as: 'projectShortlist',
  })
  declare projectShortlist: ProjectShortlist;

  // ============================================================
  // TRADE
  // ============================================================

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(Trade)),
    allowNull: false,
  })
  declare trade: Trade;

  // ============================================================
  // WORKING TYPE
  // ============================================================

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(WorkingType)),
    allowNull: false,
  })
  declare working_type: WorkingType;

  // ============================================================
  // SORT ORDER
  // ============================================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare sort_order: number;

  // ============================================================
  // VENDOR
  // ============================================================

  @ForeignKey(() => Vendor)
  @Index
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare vendor_id: string | null;

  @BelongsTo(() => Vendor, {
    foreignKey: 'vendor_id',
    as: 'vendor',
  })
  declare vendor: Vendor;

  // ============================================================
  // MATERIAL
  // ============================================================

  @ForeignKey(() => MaterialMaster)
  @Index
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare material_id: string | null;

  @BelongsTo(() => MaterialMaster, {
    foreignKey: 'material_id',
    as: 'material',
  })
  declare material: MaterialMaster;

  // ============================================================
  // DISPLAY NAME
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare name_of_vendor: string | null;

  // ============================================================
  // COMMERCIAL VALUES
  // ============================================================

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: null,
  })
  declare estimate_value: number | null;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: null,
  })
  declare quotation_value: number | null;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    defaultValue: 'INR',
  })
  declare currency: string;

  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare quotation_id: string | null;

  // ============================================================
  // WORKFLOW
  // ============================================================

  @Column({
    type: DataType.ENUM(...Object.values(ShortlistEntryStatus)),
    allowNull: false,
    defaultValue: ShortlistEntryStatus.DRAFT,
  })
  declare status: ShortlistEntryStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_selected: boolean;

  // ============================================================
  // AUDIT
  // ============================================================

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare updated_by: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  @BelongsTo(() => User, {
    foreignKey: 'updated_by',
    as: 'updater',
  })
  declare updater: User;

  // ============================================================
  // TIMESTAMPS
  // ============================================================

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  declare created_at: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
  })
  declare updated_at: Date;
}
