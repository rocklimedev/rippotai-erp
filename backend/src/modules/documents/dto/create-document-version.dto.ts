import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDocumentVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;

  @IsOptional()
  @IsIn(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'archived'])
  status?: string;

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
}
