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
import { ProjectFloor } from './project-floor.model';

/**
 * NEW MODEL — not present in the original schema.
 *
 * The Overview sheet nests rooms under floors (e.g. under "STILT":
 * KIDS ROOM, MASTER BATHROOM, KITCHEN, MASTER BEDROOM; under "UGF":
 * ROOM 1/2/3, etc). Consultancy, PMC and Vendor & Procurement only ever
 * track at floor granularity — none of them reference a room — so this
 * table is scoped to Overview only. It's deliberately NOT wired into
 * PlannerTaskFloorProgress: the Overview sheet in the source file has no
 * filled-in data rows, only headers, so treat this as the minimum
 * building block and confirm with the client whether Overview needs its
 * own tracked fields (EXECUTION / DOCUMENTS / DETAILS per room) or is
 * meant to be a computed rollup of the other three sheets before
 * building more on top of it.
 */
@Table({
  tableName: 'project_rooms',
  timestamps: true,
  paranoid: false,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ProjectRoom extends Model<ProjectRoom> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => ProjectFloor)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_floor_id: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare room_name: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare sort_order: number;

  // ===================== Associations =====================

  @BelongsTo(() => ProjectFloor, { foreignKey: 'project_floor_id' })
  declare floor: ProjectFloor;
}
