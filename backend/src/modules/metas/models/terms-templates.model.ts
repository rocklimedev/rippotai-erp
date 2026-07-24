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

import { User } from '@/modules/users/models/user.model';
import { TermsScope } from '@/common/enums/terms.enums';
import { TermsTemplateVersion } from './terms-template-version.model';
@Table({
  tableName: 'terms_templates',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class TermsTemplate extends Model<TermsTemplate> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.ENUM(...Object.values(TermsScope)),
    allowNull: false,
    defaultValue: TermsScope.GLOBAL,
  })
  declare scope: TermsScope;

  // Always mirrors the latest TermsTemplateVersion row's content, so
  // reads that don't need history (e.g. the "apply terms" picker) can
  // skip the join.
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare content_html: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  declare current_version: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare is_default: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare is_active: boolean;

  @ForeignKey(() => User)
  @Column(DataType.CHAR(36))
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column(DataType.CHAR(36))
  declare updated_by: string | null;

  // ===========================
  // RELATIONS
  // ===========================

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

  @HasMany(() => TermsTemplateVersion, {
    foreignKey: 'terms_template_id',
    as: 'versions',
  })
  declare versions: TermsTemplateVersion[];

  @Column(DataType.DATE)
  declare created_at: Date;

  @Column(DataType.DATE)
  declare updated_at: Date;

  @Column(DataType.DATE)
  declare deleted_at: Date | null;
}
