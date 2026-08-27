import {
  IsIn,
  IsISO8601,
  IsJSON,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDocumentDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  documentTypeId?: string;

  @IsOptional()
  @IsUUID()
  requirementId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsIn([
    'draft',
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'archived',
  ])
  status?: string;

  @IsOptional()
  @IsIn(['internal', 'external', 'public'])
  visibility?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsUUID()
  uploadedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  uploadedByName?: string;

  @IsOptional()
  @IsISO8601()
  documentDate?: string;

  @IsOptional()
  @IsIn(['upload', 'generated', 'system'])
  docType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  docNo?: string;

  @IsOptional()
  @IsObject()
  sections?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sourceApp?: string;
}
