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
import { QcChecklistTemplate } from './qc-checklist-template.model';

@Table({
  tableName: 'qc_checklist_items',
  timestamps: false,
  underscored: true,
})
export class QcChecklistItem extends Model<QcChecklistItem> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => QcChecklistTemplate)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'checklist_id',
  })
  declare checklistId: string;

  @BelongsTo(() => QcChecklistTemplate, {
    foreignKey: 'checklistId',
  })
  declare checklist: QcChecklistTemplate;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'item_text',
  })
  declare itemText: string;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'sort_order',
  })
  declare sortOrder: number;
}
