import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { Project } from '../../projects/models/projects.model';

@Table({
  tableName: 'clients',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class Client extends Model<Client> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare slug: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare contact_person: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare email: string | null;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare phone: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare address: string | null;

  @HasMany(() => Project)
  declare projects: Project[];
}
