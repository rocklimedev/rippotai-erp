import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import { Lead } from './lead.model';

@Table({
  tableName: 'lead_tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class LeadTask extends Model<LeadTask> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Lead)
  @Column({ type: DataType.UUID, allowNull: false, field: 'lead_id' })
  declare leadId: string;

  @BelongsTo(() => Lead, { foreignKey: 'leadId', targetKey: 'id' })
  declare lead: Lead;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column({ type: DataType.DATEONLY, allowNull: true, field: 'due_date' })
  declare dueDate: string | null;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  declare done: boolean;

  @Column({ type: DataType.STRING, allowNull: true, field: 'created_by' })
  declare createdBy: string | null;

  declare createdAt: Date;
}
