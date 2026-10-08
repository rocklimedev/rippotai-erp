import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
@Table({ tableName: 'business_proposals', timestamps: true, underscored: true })
export class BusinessProposal extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;
  @Column({ type: DataType.JSON, allowNull: false }) declare snapshot: Record<
    string,
    any
  >;
  @Column(DataType.CHAR(36)) declare created_by: string;
  @Column(DataType.CHAR(36)) declare updated_by: string;
}
