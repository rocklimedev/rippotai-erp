import { IsBoolean, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDocumentRequirementDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  documentTypeId: string;

  @IsOptional()
  @IsIn(['REQUIRED', 'OPTIONAL', 'CONDITIONAL'])
  requirementType?: 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL';

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;
}
