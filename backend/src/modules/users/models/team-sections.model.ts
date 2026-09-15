import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';

import { TeamSectionAccess } from './team-section-access.model';

@Table({
  tableName: 'team_sections',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class TeamSection extends Model<TeamSection> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare key: string;

  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare parent_key: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'ACTIVE',
  })
  declare status: 'ACTIVE' | 'INACTIVE';

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare sort_order: number;

  @HasMany(() => TeamSectionAccess, {
    foreignKey: 'section_id',
    as: 'teamAccess',
  })
  declare teamAccess: TeamSectionAccess[];
}
