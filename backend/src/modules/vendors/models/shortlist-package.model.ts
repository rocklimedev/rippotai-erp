import {
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import {
  ShortlistType,
  Trade,
  WorkingType,
} from '@/common/enums/shortlist.enums';

export interface ShortlistPackageEntry {
  trade: Trade;
  working_type: WorkingType;
  vendor_id: string | null;
  material_id: string | null;
  name_of_vendor: string | null;
  notes: string | null;
}

@Table({
  tableName: 'shortlist_packages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ShortlistPackage extends Model<
  ShortlistPackage,
  {
    name: string;
    shortlist_type: ShortlistType;
    entries: ShortlistPackageEntry[];
  }
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({
    type: DataType.ENUM(...Object.values(ShortlistType)),
    allowNull: false,
  })
  declare shortlist_type: ShortlistType;

  @Column({ type: DataType.JSON, allowNull: false })
  declare entries: ShortlistPackageEntry[];
}
