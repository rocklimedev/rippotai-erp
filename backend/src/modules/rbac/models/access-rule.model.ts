import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({ tableName: 'access_rules', timestamps: true, underscored: true })
export class AccessRuleModel extends Model {
  @PrimaryKey @Default(DataType.UUIDV4) @Column(DataType.CHAR(36))
  declare id: string;
  @Column({ type: DataType.ENUM('USER', 'ROLE'), allowNull: false })
  declare subject_type: 'USER' | 'ROLE';
  @Column({ type: DataType.CHAR(36), allowNull: false }) declare subject_id: string;
  @Column({ type: DataType.STRING(255), allowNull: false }) declare resource: string;
  @Column({ type: DataType.STRING(50), allowNull: false }) declare action: string;
  @Column({ type: DataType.ENUM('ALLOW', 'DENY'), allowNull: false }) declare effect: 'ALLOW' | 'DENY';
  @Column(DataType.CHAR(36)) declare created_by: string;
}
