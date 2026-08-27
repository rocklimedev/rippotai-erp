import { IsIn, IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDrawingRevisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  revision?: string;

  @IsOptional()
  @IsISO8601()
  issueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  issuePurpose?: string;

  @IsOptional()
  @IsIn(['Draft', 'For Review', 'Approved', 'Rejected', 'Superseded'])
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
