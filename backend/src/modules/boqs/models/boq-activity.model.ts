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
import { BoqActivityAction } from '@/common/enums/boq-enums';
import { Boq } from './boq.model';

@Table({
  tableName: 'boq_activities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class BoqActivity extends Model<BoqActivity> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  // Nullable: library/template-level actions (e.g. deleting a library
  // item) are logged here too and won't have a specific BOQ.
  @ForeignKey(() => Boq)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare boq_id: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare user_id: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(BoqActivityAction)),
    allowNull: false,
  })
  declare action: BoqActivityAction;

  // Human-readable label of what was acted on, e.g. "BOQ · Villa 12"
  // or "Library item · Vitrified tile flooring".
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare target: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare details: string | null;

  @BelongsTo(() => Boq, { foreignKey: 'boq_id' })
  declare boq: Boq;

  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
  declare user: User;
}
