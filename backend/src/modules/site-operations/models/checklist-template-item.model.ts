import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { ChecklistTemplate } from './checklist-template.model';
import { QcSignOffItemResult } from './qc-sign-off-item-result.model';

@Table({ tableName: 'so_checklist_template_items', timestamps: true })
export class ChecklistTemplateItem extends Model<ChecklistTemplateItem> {
  @ForeignKey(() => ChecklistTemplate)
  @Column({ type: DataType.INTEGER, allowNull: false })
  templateId: number;

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
