import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDocumentTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  /**
   * Authoritative relationship to project_phases.id.
   *
   * This must point to a ProjectPhase with:
   * module = DOCUMENTS
   */
  @IsUUID()
  @IsNotEmpty()
  projectPhaseId: string;

  /**
   * Legacy compatibility fields.
   *
   * These should eventually be removed once all callers
   * have moved to projectPhaseId.
   *
   * The service should derive these values from ProjectPhase
   * instead of trusting the client.
   */
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
