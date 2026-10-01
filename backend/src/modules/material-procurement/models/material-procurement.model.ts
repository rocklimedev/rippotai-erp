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
  Index,
} from 'sequelize-typescript';

import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';

import { MaterialProcurementItem } from './material-procurement-item.model';

export enum MaterialProcurementStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PARTIALLY_PROCURED = 'PARTIALLY_PROCURED',
  PROCURED = 'PROCURED',
  CANCELLED = 'CANCELLED',
}

export interface MaterialProcurementCreationAttributes {
  projectId: string;
  procurementNo: string;
  status?: MaterialProcurementStatus;
  remarks?: string | null;
  createdById?: string | null;
}

@Table({
  tableName: 'material_procurements',
  timestamps: true,
  underscored: true,
})
export class MaterialProcurement extends Model<
  MaterialProcurement,
  MaterialProcurementCreationAttributes
> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  // ============================================================
  // PROJECT
  // ============================================================

  @Index
  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare projectId: string;

  @BelongsTo(() => Project, {
    foreignKey: 'projectId',
    as: 'project',
  })
  declare project: Project;

  // ============================================================
  // PROCUREMENT NUMBER
  // ============================================================

  @Index
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare procurementNo: string;

  // ============================================================
  // STATUS
  // ============================================================

  @Column({
    type: DataType.ENUM(...Object.values(MaterialProcurementStatus)),
    allowNull: false,
    defaultValue: MaterialProcurementStatus.DRAFT,
  })
  declare status: MaterialProcurementStatus;

  // ============================================================
  // REMARKS
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  // ============================================================
  // CREATED BY
  // ============================================================

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare createdById: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'createdById',
    as: 'createdBy',
  })
  declare createdBy: User;

  // ============================================================
  // ITEMS
  // ============================================================

  @HasMany(() => MaterialProcurementItem, {
    foreignKey: 'procurementId',
    sourceKey: 'id',
    as: 'items',
  })
  declare items: MaterialProcurementItem[];
}
