import {
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({
  tableName: 'snag_lists',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class SnagList extends Model<SnagList> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare project_name: string;
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;
  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare document_date: string;
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare revision: number;
  @Column({ type: DataType.JSON, allowNull: false }) declare items: any[];
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare item_count: number;
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare open_count: number;
  @Column({ type: DataType.BLOB('long'), allowNull: false })
  declare excel_data: Buffer;
  @Column(DataType.CHAR(36)) declare created_by: string | null;
  @Column(DataType.CHAR(36)) declare updated_by: string | null;
}

@Table({
  tableName: 'snag_list_revisions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class SnagListRevision extends Model<SnagListRevision> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare snag_list_id: string;
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare revision: number;
  @Column({ type: DataType.JSON, allowNull: false }) declare document: Record<
    string,
    any
  >;
  @Column({ type: DataType.BLOB('long'), allowNull: false })
  declare excel_data: Buffer;
  @Column(DataType.CHAR(36)) declare created_by: string | null;
}
