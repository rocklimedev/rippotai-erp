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

import { User } from '@/modules/users/models/user.model';
import { TermsTemplate } from './terms-templates.model';
@Table({
  tableName: 'terms_template_versions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class TermsTemplateVersion extends Model<TermsTemplateVersion> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => TermsTemplate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare terms_template_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare version: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare content_html: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare change_note: string | null;

  @ForeignKey(() => User)
  @Column(DataType.CHAR(36))
  declare created_by: string | null;

  // ===========================
  // RELATIONS
  // ===========================

  @BelongsTo(() => TermsTemplate, {
    foreignKey: 'terms_template_id',
    as: 'template',
  })
  declare template: TermsTemplate;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  @Column(DataType.DATE)
  declare created_at: Date;
}
