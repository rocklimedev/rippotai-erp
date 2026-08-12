import { IsUUID, IsOptional } from 'class-validator';

export class CreateProjectHandoverDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  completionCertificateDocumentId?: string;

  @IsOptional()
  @IsUUID()
  warrantyPackDocumentId?: string;

  @IsOptional()
  @IsUUID()
  asBuiltDrawingDocumentId?: string;

  @IsOptional()
  @IsUUID()
  careNotesDocumentId?: string;

  @IsOptional()
  @IsUUID()
  consolidatedBillsDocumentId?: string;

  @IsOptional()
  @IsUUID()
  handedOverBy?: string;
}
