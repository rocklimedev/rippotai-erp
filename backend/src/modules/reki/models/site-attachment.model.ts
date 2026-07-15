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
import { SiteReki } from './site-reki.model';

@Table({
  tableName: 'site_reki_attachments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class SiteRekiAttachment extends Model<SiteRekiAttachment> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => SiteReki)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare site_reki_id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare filename: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare mime: string | null;

  // Bytes, computed server-side from the decoded base64 payload
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare size: number;

  // Free-text remark added per-attachment, e.g. "North wall damp patch"
  @Column({ type: DataType.TEXT, allowNull: true })
  declare remark: string | null;

  @Column({ type: DataType.BLOB('long'), allowNull: false })
  declare content: Buffer;

  @BelongsTo(() => SiteReki, {
    foreignKey: 'site_reki_id',
    as: 'site_reki',
  })
  declare site_reki: SiteReki;
}
