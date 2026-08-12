import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import { Document } from '@/modules/documents/models/document.model';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { Vendor } from '../../vendors/models/vendors.model';
import { MaterialRequirement } from '@/modules/materials/models/material-requirement.model';

export enum SampleBoardStatus {
  PROPOSED = 'proposed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Table({
  tableName: 'sample_boards',
  timestamps: true,
  underscored: true,
})
export class SampleBoard extends Model<
  InferAttributes<SampleBoard>,
  InferCreationAttributes<SampleBoard>
> {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: CreationOptional<string>;

  @ForeignKey(() => MaterialRequirement)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'material_requirement_id',
  })
  declare materialRequirementId: string | null;

  @BelongsTo(() => MaterialRequirement, 'materialRequirementId')
  declare materialRequirement?: NonAttribute<MaterialRequirement>;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    field: 'project_id',
  })
  declare projectId: string;

  @BelongsTo(() => Project, 'projectId')
  declare project?: NonAttribute<Project>;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'vendor_id',
  })
  declare vendorId: string | null;

  @BelongsTo(() => Vendor, 'vendorId')
  declare vendor?: NonAttribute<Vendor>;

  @ForeignKey(() => Document)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'document_id',
  })
  declare documentId: string | null;

  @BelongsTo(() => Document, 'documentId')
  declare document?: NonAttribute<Document>;

  @Default(SampleBoardStatus.PROPOSED)
  @Column({
    type: DataType.ENUM(...Object.values(SampleBoardStatus)),
    allowNull: false,
  })
  declare status: CreationOptional<SampleBoardStatus>;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'created_by',
  })
  declare createdBy: string | null;

  @BelongsTo(() => User, 'createdBy')
  declare creator?: NonAttribute<User>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}
