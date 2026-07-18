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
  })
  declare leadId: string;

  @BelongsTo(() => Lead)
  declare lead: Lead;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare text: string;

  @Column(DataType.DATE)
  declare createdAt: Date;
}
