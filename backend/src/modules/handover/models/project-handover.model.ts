import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'project_handovers',
  timestamps: true,
  underscored: true,
})
export class ProjectHandover extends Model<ProjectHandover> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
    unique: 'uk_handover_project',
    field: 'project_id',
  })
  declare projectId: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'completion_certificate_document_id',
  })
  declare completionCertificateDocumentId: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'warranty_pack_document_id',
  })
  declare warrantyPackDocumentId: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'as_built_drawing_document_id',
  })
  declare asBuiltDrawingDocumentId: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'care_notes_document_id',
  })
  declare careNotesDocumentId: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'consolidated_bills_document_id',
  })
  declare consolidatedBillsDocumentId: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'client_signed_off_at',
  })
  declare clientSignedOffAt: Date | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'client_signed_off_by',
  })
  declare clientSignedOffBy: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'handed_over_by',
  })
  declare handedOverBy: string | null;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  declare updatedAt: Date;
}
