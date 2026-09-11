import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  IsUUID,
} from 'sequelize-typescript';

import {
  ProcurementItemType,
  PlannerItemStatus,
} from '@/common/enums/project-planner.enum';

import { ProjectPlanner } from './project_planners.model';
import { User } from '@/modules/users/models/user.model';
import { Vendor } from '@/modules/vendors/models/vendors.model';

/**
 * Attributes accepted when creating a ProjectProcurementItem.
 *
 * This must be separate from the Sequelize model itself so that
 * Model.create() does not expect Sequelize instance methods/properties.
 */
export interface ProjectProcurementItemCreationAttributes {
  id?: string;

  planner_id: string;

  item_type: ProcurementItemType;

  category_name: string;

  vendor_id?: string | null;

  vendor_name?: string | null;

  estimate_finalised_at?: string | null;

  quotation_finalised_at?: string | null;

  planned_start_date?: string | null;

  planned_end_date?: string | null;

  purchase_date?: string | null;

  received_at_site_date?: string | null;

  status?: PlannerItemStatus;

  remarks?: string | null;

  sort_order?: number;

  created_by?: string | null;
}

@Table({
  tableName: 'project_procurement_items',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    {
      fields: ['planner_id', 'item_type'],
    },
    {
      fields: ['vendor_id'],
    },
  ],
})
export class ProjectProcurementItem extends Model<
  ProjectProcurementItem,
  ProjectProcurementItemCreationAttributes
> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ============================================================
  // PLANNER
  // ============================================================

  @ForeignKey(() => ProjectPlanner)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare planner_id: string;

  // ============================================================
  // ITEM TYPE
  // MATERIAL / LABOUR
  // ============================================================

  @Column({
    type: DataType.ENUM(...Object.values(ProcurementItemType)),
    allowNull: false,
  })
  declare item_type: ProcurementItemType;

  // ============================================================
  // CATEGORY
  //
  // MATERIAL examples:
  // - TILES
  // - FURNITURE
  // - WALL PAINTS
  //
  // LABOUR examples:
  // - CIVIL
  // - ELECTRICAL
  // - PLUMBING
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare category_name: string;

  // ============================================================
  // VENDOR
  // ============================================================

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare vendor_id: string | null;

  /**
   * Snapshot/fallback vendor name.
   *
   * Useful when a vendor has not yet been created
   * in the Vendor master.
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare vendor_name: string | null;

  // ============================================================
  // ESTIMATE / QUOTATION DATES
  //
  // DATEONLY values are represented as YYYY-MM-DD strings.
  // ============================================================

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare estimate_finalised_at: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare quotation_finalised_at: string | null;

  // ============================================================
  // LABOUR TIMELINE
  // ============================================================

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare planned_start_date: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare planned_end_date: string | null;

  // ============================================================
  // MATERIAL TIMELINE
  // ============================================================

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare purchase_date: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare received_at_site_date: string | null;

  // ============================================================
  // STATUS
  // ============================================================

  @Column({
    type: DataType.ENUM(...Object.values(PlannerItemStatus)),
    allowNull: false,
    defaultValue: PlannerItemStatus.NOT_STARTED,
  })
  declare status: PlannerItemStatus;

  // ============================================================
  // REMARKS
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  // ============================================================
  // SORT ORDER
  // ============================================================

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sort_order: number;

  // ============================================================
  // CREATED BY
  // ============================================================

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  // ============================================================
  // ASSOCIATIONS
  // ============================================================

  @BelongsTo(() => ProjectPlanner)
  declare planner: ProjectPlanner;

  @BelongsTo(() => Vendor)
  declare vendor: Vendor | null;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User | null;
}
