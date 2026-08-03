import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';

import { Project } from '../../projects/models/projects.model';
import { ProjectMaterial } from './project-materials.model'; // renamed for clarity
import { Vendor } from '../../vendors/models/vendors.model';
import { User } from '../../users/models/user.model';

@Table({
  tableName: 'inventory_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class InventoryRequest extends Model {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_id: string;

  @BelongsTo(() => Project)
  declare project: Project;

  @ForeignKey(() => ProjectMaterial)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_material_id: string;

  @BelongsTo(() => ProjectMaterial)
  declare projectMaterial: ProjectMaterial;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  declare quantity_required: number | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare required_date: string | null;

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare vendor_id: string | null;

  @BelongsTo(() => Vendor)
  declare vendor?: Vendor;

  @Default('Vendor')
  @Column({
    type: DataType.ENUM('Vendor', 'Warehouse', 'Site Stock'),
    allowNull: true,
  })
  declare source_type: 'Vendor' | 'Warehouse' | 'Site Stock';

  @Default('requested')
  @Column({
    type: DataType.ENUM(
      'requested',
      'approved',
      'dispatched',
      'delivered',
      'rejected',
      'cancelled',
    ),
    allowNull: true,
  })
  declare status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare requested_by: string | null;

  @BelongsTo(() => User, 'requested_by')
  declare requester?: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare approved_by: string | null;

  @BelongsTo(() => User, 'approved_by')
  declare approver?: User;

  @Column({ type: DataType.DATE })
  declare created_at: Date;

  @Column({ type: DataType.DATE })
  declare updated_at: Date;
}
