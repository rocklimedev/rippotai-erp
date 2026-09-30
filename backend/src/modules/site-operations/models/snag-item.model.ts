import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { SnagStatus } from '@/common/enums/architect-visit.enums';
import { ArchitectSiteVisit } from './architect-site-visit.model';

/**
 * Sheet: "Snag list"
 * S. No. | Floor | Room | Category | Observation | Photo | Scope | Status | Remarks
 */
@Table({
  tableName: 'snag_items',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    {
      name: 'uq_snag_project_sno',
      unique: true,
      fields: ['project_id', 's_no'],
    },
    { name: 'idx_snag_status', fields: ['project_id', 'status'] },
  ],
})
export class SnagItem extends Model<SnagItem> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  /** Optional link to the visit (e.g. Pre handover inspection) that raised it */
  @ForeignKey(() => ArchitectSiteVisit)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare visit_id: string | null;

  /** S. No. – running number within a project (auto-assigned) */
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare s_no: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare floor: string | null;

  @Column({ type: DataType.STRING(150), allowNull: true })
  declare room: string | null;

  @Column({ type: DataType.STRING(150), allowNull: true })
  declare category: string | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare observation: string;

  /** Photo – array of file URLs */
  @Column({ type: DataType.JSON, allowNull: true })
  declare photos: string[] | null;

  /** Scope – who / which trade should rectify (e.g. Civil, Electrical, Carpentry, Painting) */
  @Column({ type: DataType.STRING(150), allowNull: true })
  declare scope: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(SnagStatus)),
    allowNull: false,
    defaultValue: SnagStatus.OPEN,
  })
  declare status: SnagStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare closed_at: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare closed_by: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare updated_by: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deleted_at: Date | null;

  @BelongsTo(() => Project, { foreignKey: 'project_id', as: 'project' })
  declare project: Project;

  @BelongsTo(() => ArchitectSiteVisit, { foreignKey: 'visit_id', as: 'visit' })
  declare visit: ArchitectSiteVisit;

  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  declare creator: User;
}
