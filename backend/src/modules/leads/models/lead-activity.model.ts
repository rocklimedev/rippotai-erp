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
  tableName: 'lead_activity',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class LeadActivity extends Model<LeadActivity> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Lead)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'lead_id',
  })
  declare leadId: string;

  @BelongsTo(() => Lead, {
    foreignKey: 'leadId',
    targetKey: 'id',
  })
  declare lead: Lead;

  // created | stage | note | update | task | won | lost | zoho
  @Column({ type: DataType.STRING(32), allowNull: false, defaultValue: 'update' })
  declare kind: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare author: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare text: string;

  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;
}
