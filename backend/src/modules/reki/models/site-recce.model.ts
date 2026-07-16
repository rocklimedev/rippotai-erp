import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  HasMany,
  Index,
} from 'sequelize-typescript';
import { Default } from 'sequelize-typescript';

import { SiteRecceFloor } from './site-recce-floor.model';
import { SiteLayoutAttachment } from './site-layout-attachment.model';
import { SiteRecceDocument } from './site-recce-document.model';

import { Project } from '@/modules/projects/models/projects.model';
import { Document } from '@/modules/documents/models/document.model';
import { User } from '@/modules/users/models/user.model';

@Table({
  tableName: 'site_recce',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class SiteRecce extends Model<SiteRecce> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Project)
  @Index
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_id: string;

  @ForeignKey(() => Document)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare document_id?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare supervisor_id?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare recce_date?: Date;

  @Column({
    type: DataType.TIME,
    allowNull: true,
  })
  declare time_of_visit?: string;

  @Column({
    type: DataType.ENUM(
      'draft',
      'scheduled',
      'in_progress',
      'completed',
      'approved',
      'cancelled',
    ),
    defaultValue: 'draft',
  })
  declare status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks?: string;

  // =====================================================
  // ACCESS DETAILS
  // =====================================================

  @Column({
    type: DataType.ENUM('Easy', 'Moderate', 'Difficult'),
    allowNull: true,
  })
  declare site_accessibility?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare road_width_near_site?: string;

  @Column({
    type: DataType.ENUM('Yes', 'No'),
    allowNull: true,
  })
  declare vehicle_entry_available?: string;

  @Column({
    type: DataType.ENUM('Yes', 'No', 'Limited'),
    allowNull: true,
  })
  declare loading_unloading_space?: string;

  @Column({
    type: DataType.ENUM('Yes', 'No'),
    allowNull: true,
  })
  declare lift_available?: string;

  @Column({
    type: DataType.ENUM('Yes', 'No'),
    allowNull: true,
  })
  declare service_lift_available?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare staircase_width?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare floor_level?: string;

  @Column({
    type: DataType.ENUM('Yes', 'No', 'Limited'),
    allowNull: true,
  })
  declare parking_availability?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare access_restrictions?: string;

  // =====================================================
  // SITE CONDITION
  // =====================================================

  @Column({
    type: DataType.ENUM(
      'Empty Site',
      'Under Construction',
      'Renovation Site',
      'Occupied Site',
      'Partially Occupied',
      'Demolition Required',
    ),
    allowNull: true,
  })
  declare current_site_status?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare existing_flooring_condition?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare existing_wall_condition?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare existing_ceiling_condition?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare existing_doors_windows_condition?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare leakage_dampness_observed?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare cracks_observed?: string;
  // =====================================================
  // ELECTRICAL
  // =====================================================

  @Column({
    type: DataType.ENUM('Yes', 'No'),
    allowNull: true,
  })
  declare existing_points_available?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare main_db_location?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare meter_location?: string;

  @Column({
    type: DataType.ENUM(
      'Available',
      'Not Available',
      'Temporary Connection Required',
    ),
    allowNull: true,
  })
  declare power_supply_status?: string;

  // =====================================================
  // PLUMBING
  // =====================================================

  @Column({
    type: DataType.ENUM('Yes', 'No'),
    allowNull: true,
  })
  declare water_supply_available?: string;

  @Column({
    type: DataType.ENUM('Yes', 'No'),
    allowNull: true,
  })
  declare drainage_line_available?: string;

  @Column({
    type: DataType.ENUM('Good', 'Average', 'Poor', 'Needs Replacement'),
    allowNull: true,
  })
  declare existing_plumbing_condition?: string;

  @Column({
    type: DataType.ENUM('Yes', 'No', 'Not Applicable'),
    allowNull: true,
  })
  declare kitchen_plumbing_checked?: string;

  @Column({
    type: DataType.ENUM('Yes', 'No', 'Not Applicable'),
    allowNull: true,
  })
  declare bathroom_plumbing_checked?: string;

  // =====================================================
  // AUDIT FIELDS
  // =====================================================

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare updated_by?: string;

  // =====================================================
  // RELATIONSHIPS
  // =====================================================

  @BelongsTo(() => Project)
  declare project: Project;

  @BelongsTo(() => Document)
  declare document?: Document;

  @BelongsTo(() => User, 'supervisor_id')
  declare supervisor?: User;

  @BelongsTo(() => User, 'created_by')
  declare createdBy?: User;

  @BelongsTo(() => User, 'updated_by')
  declare updatedBy?: User;

  @HasMany(() => SiteRecceFloor)
  declare floors: SiteRecceFloor[];

  @HasMany(() => SiteLayoutAttachment)
  declare layoutAttachments: SiteLayoutAttachment[];

  @HasMany(() => SiteRecceDocument)
  declare documents: SiteRecceDocument[];
}
