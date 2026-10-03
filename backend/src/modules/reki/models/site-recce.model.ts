import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  IsUUID,
} from 'sequelize-typescript';

import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { SiteRecceRoom } from './site-recce-room.model';
import { SiteReccePhoto } from './site-recce-photo.model';

@Table({
  tableName: 'site_recces',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class SiteRecce extends Model<SiteRecce> {
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
  // PROJECT
  // ============================================================

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_id: string;

  @BelongsTo(() => Project, {
    foreignKey: 'project_id',
    as: 'project',
  })
  declare project: Project;

  // ============================================================
  // BASIC PROJECT / SITE DETAILS
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare project_name: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare client_name: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare site_address: string | null;

  // ============================================================
  // RECCE DETAILS
  // ============================================================

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare recce_date: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare site_engineer_id: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'site_engineer_id',
    as: 'site_engineer',
  })
  declare site_engineer: User;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare accompanied_by: string | null;

  // ============================================================
  // PROPERTY DETAILS
  // ============================================================

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare unit_floor_no: string | null;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  declare carpet_area_sqft: number | null;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  declare built_up_area_sqft: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare number_of_rooms: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare number_of_floors: number | null;

  // ============================================================
  // SITE TYPE
  // ============================================================

  @Column({
    type: DataType.ENUM('FLAT', 'FLOOR', 'KOTHI', 'RAW'),
    allowNull: true,
  })
  declare site_type: 'FLAT' | 'FLOOR' | 'KOTHI' | 'RAW' | null;

  // ============================================================
  // ACCESS FOR MATERIAL & LABOUR
  // ============================================================

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  declare lift_available: boolean | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare lift_size: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare staircase_width: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare material_entry_point: string | null;

  // ============================================================
  // UTILITIES
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare water_connection: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare power_load_available: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare drainage_point_location: string | null;

  // ============================================================
  // SOCIETY / RWA RESTRICTIONS
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare society_rwa_restrictions: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare working_hours_allowed: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare material_movement_rule: string | null;

  // ============================================================
  // EXISTING CONDITION
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare existing_condition: string | null;

  // ============================================================
  // AUDIT
  // ============================================================

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare updated_by: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'updated_by',
    as: 'updater',
  })
  declare updater: User;

  // ============================================================
  // CHILD COLLECTIONS
  // ============================================================

  @HasMany(() => SiteRecceRoom, {
    foreignKey: 'site_recce_id',
    as: 'rooms',
  })
  declare rooms: SiteRecceRoom[];

  @HasMany(() => SiteReccePhoto, {
    foreignKey: 'site_recce_id',
    as: 'photos',
  })
  declare photos: SiteReccePhoto[];
}
