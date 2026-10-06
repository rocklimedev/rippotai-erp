import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { ChecklistTemplate } from './checklist-template.model';
import { QcSignOffItemResult } from './qc-sign-off-item-result.model';

@Table({ tableName: 'checklist_template_items', timestamps: true })
export class ChecklistTemplateItem extends Model<ChecklistTemplateItem> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare id: string;

  @ForeignKey(() => ChecklistTemplate)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  templateId: string;

  @BelongsTo(() => ChecklistTemplate)
  template: ChecklistTemplate;

  @Column({ type: DataType.STRING(300), allowNull: false })
  text: string; // e.g. "Conduit routing matches approved drawing"

  @Column({ type: DataType.INTEGER, allowNull: false })
  order: number;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  isRequired: boolean;

  @HasMany(() => QcSignOffItemResult, { onDelete: 'CASCADE' })
  results: QcSignOffItemResult[];
}
