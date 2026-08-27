import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDocumentTypeDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(50)
  phaseCode: string;

  @IsString()
  @MaxLength(255)
  phaseName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sectionCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sectionName?: string;

  @IsOptional()
  @IsInt()
  sequence?: number;

  @IsOptional()
  @IsIn(['DOCUMENT', 'DRAWING'])
  targetType?: 'DOCUMENT' | 'DRAWING';

  @IsOptional()
  @IsIn(['REQUIRED', 'OPTIONAL', 'CONDITIONAL'])
  requirementType?: 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL';

  @IsOptional()
  @IsBoolean()
  allowsMultiple?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresRevision?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
