import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';

import { Boq } from './boq.model';

@Table({
  tableName: 'boq_versions',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class BoqVersion extends Model<BoqVersion> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => Boq)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare boq_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare version: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare version_name: string;

  // ===========================
  // RELATIONS
  // ===========================

  @BelongsTo(() => Boq, {
    foreignKey: 'boq_id',
    as: 'parentBoq',
  })
  declare parentBoq: Boq;

  @HasMany(() => Boq, {
    foreignKey: 'boq_version_id',
    as: 'versionBoqs',
  })
  declare versionBoqs: Boq[];
}
