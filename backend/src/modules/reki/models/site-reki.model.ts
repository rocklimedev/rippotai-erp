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
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { SiteRekiAttachment } from './site-attachment.model';

@Table({
  tableName: 'site_rekis',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class SiteReki extends Model<SiteReki> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  declare doc_no: string;

  // Matches CreateSiteRekiDto['sections']:
  // { [sectionTitle]: { [fieldKey]: string } } for every entry in REKI_SECTIONS
  @Column({ type: DataType.JSON, allowNull: false })
  declare sections: Record<string, Record<string, string>>;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare pdf_path: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare pdf_size: number | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare created_by: string | null;

  @BelongsTo(() => Project, {
    foreignKey: 'project_id',
    as: 'project',
  })
  declare project: Project;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  @HasMany(() => SiteRekiAttachment, {
    foreignKey: 'site_reki_id',
    as: 'attachments',
  })
  declare attachments: SiteRekiAttachment[];
}
