import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  IsUUID,
} from 'sequelize-typescript';
import { User } from '@/modules/users/models/user.model';
import { TeamMemberOwnerType } from '@/common/enums/team.enums';

// Generic membership table. Any module that needs "who's on this" —
// Project, PlanOfAction, Quotation, BOQ, etc. — writes rows here instead
// of growing its own join table each time.
//
// owner_type + owner_id together point at the owning row. There is no
// DB-level foreign key on owner_id since it can target different tables
// depending on owner_type; referential integrity for the owner side is
// enforced in TeamService (which is always called scoped to a caller's
// own owner_type/owner_id) rather than at the schema level. This is the
// standard trade-off for a polymorphic association.
@Table({
  tableName: 'team_members',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    { fields: ['owner_type', 'owner_id'] },
    {
      fields: ['owner_type', 'owner_id', 'user_id', 'role_label'],
      unique: true,
    },
  ],
})
export class TeamMember extends Model<TeamMember> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @Column({
    type: DataType.ENUM(...Object.values(TeamMemberOwnerType)),
    allowNull: false,
  })
  declare owner_type: TeamMemberOwnerType;

  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare owner_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare user_id: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare role_label: string;
  // "Principal Architect", "Project Lead", "Site Supervisor" ... free
  // text so a new role on the document never needs a migration

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare is_primary: boolean;
  // marks the one contact to surface first when a role_label has several people

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare sort_order: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare created_by: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deleted_at: Date | null;

  // ===================== Associations =====================
  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
  declare user: User;

  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  declare creator: User;
}
